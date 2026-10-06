import { expect, it } from 'vitest';
import defaults from '../../.generated/probe.json';
import { createProbeStore } from '../../src/app/probe-store';
import { parseConfig, parseState } from '../../src/domain/probe';
import { angularSeparationDeg } from '../../src/education/coordinate-task';

it('Z02 ocenia separację sferyczną przy zawijaniu azymutu', () => {
  expect(angularSeparationDeg(359, 30, 1, 30)).toBeCloseTo(1.732, 2);
  expect(angularSeparationDeg(90, 30, 90, 30)).toBeCloseTo(0, 7);
  expect(angularSeparationDeg(270, -30, 90, 30)).toBeCloseTo(180, 7);
});

it('Z02 zapisuje próby, przywraca widok i przeżywa migrację/import', () => {
  const store = createProbeStore(parseConfig(defaults));
  const before = store.getState().camera;
  expect(store.startCoordinateTask()).toBe(true);
  expect(store.setTaskNotes('Sześć kroków w prawo i jeden w górę.', '')).toBe(true);
  expect(store.getState().playbackRate).toBe(0);
  expect(store.checkCoordinateTask()?.completed).toBe(false);
  store.setCamera({ azimuthDeg: 90, altitudeDeg: 30, fovDeg: 100 });
  const result = store.checkCoordinateTask();
  expect(result?.completed).toBe(true);
  expect(store.setTaskNotes('Sześć kroków w prawo i jeden w górę.', 'Azymut rośnie ku wschodowi; wysokość wzrosła o 15°.')).toBe(true);
  expect(store.getState().coordinateTask.attempts).toBe(2);
  expect(store.getState().coordinateTask.bestSeparationDeg).toBeCloseTo(0, 7);
  const restored = parseState(JSON.parse(JSON.stringify(store.getState())));
  expect(restored.coordinateTask.active).toBe(true);
  expect(restored.coordinateTask.completedAtUtc).toBeTruthy();
  expect(restored.coordinateTask.lastReading?.azimuthDeg).toBe(90);
  expect(restored.coordinateTask.conclusion).toContain('Azymut');
  expect(store.leaveCoordinateTask()).toBe(true);
  expect(store.getState().camera).toEqual(before);
  expect(store.getState().coordinateTask.completedAtUtc).toBe(restored.coordinateTask.completedAtUtc);
  const legacy = { ...store.getState(), schemaVersion: 4, contentVersion: '0.1.0' } as Record<string, unknown>;
  delete legacy.coordinateTask; delete legacy.selectedStarId; delete legacy.observationPlan; delete legacy.observationJournal;
  expect(parseState(legacy).coordinateTask.attempts).toBe(0);
  const v5 = { ...store.getState(), schemaVersion: 5, contentVersion: '0.1.0', coordinateTask: {
    active: false, previousCamera: null, attempts: 2, bestSeparationDeg: 0, completedAtUtc: restored.coordinateTask.completedAtUtc,
  } } as Record<string, unknown>;
  delete v5.selectedStarId; delete v5.observationPlan; delete v5.observationJournal;
  const migrated = parseState(v5);
  expect(migrated.schemaVersion).toBe(8);
  expect(migrated.coordinateTask.lastReading).toBeNull();
  expect(migrated.coordinateTask.attempts).toBe(2);
});

it('Z02 nie przyjmuje błędnego wyniku i nie zmienia stanu przy zamrożeniu', () => {
  const store = createProbeStore(parseConfig(defaults));
  store.startCoordinateTask();
  const before = store.getState();
  store.setFrozen(true);
  expect(store.checkCoordinateTask()).toBeNull();
  expect(store.leaveCoordinateTask()).toBe(false);
  expect(store.getState()).toEqual(before);
  expect(() => parseState({ ...before, coordinateTask: { ...before.coordinateTask, attempts: -1 } })).toThrow();
  expect(() => parseState({ ...before, coordinateTask: { ...before.coordinateTask, completedAtUtc: '2026-10-03T12:00:00.000Z' } })).toThrow();
  expect(() => parseState({ ...before, sceneId: 'E3' })).toThrow('invalid-coordinate-task');
});
