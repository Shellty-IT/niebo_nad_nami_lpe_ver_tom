import { expect, it } from 'vitest';
import defaults from '../../.generated/probe.json';
import { createProbeStore } from '../../src/app/probe-store';
import { parseConfig, parseState } from '../../src/domain/probe';
import { LocalSession, parseSessionImport } from '../../src/persistence/local-session';

function memory() {
  const data = new Map<string, string>();
  return { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value); },
    removeItem: (key: string) => { data.delete(key); } };
}
it('stan P1 migruje z v3 i waliduje routing, a historia miejsc ma limit', () => {
  const store = createProbeStore(parseConfig(defaults));
  const legacy = { ...store.getState(), schemaVersion: 3, contentVersion: '0.1.0' } as Record<string, unknown>;
  delete legacy.sceneId; delete legacy.level; delete legacy.mode; delete legacy.locationHistory; delete legacy.coordinateTask; delete legacy.selectedStarId; delete legacy.observationPlan; delete legacy.observationJournal;
  const migrated = parseState(legacy);
  expect(migrated.sceneId).toBe('E1'); expect(migrated.level).toBe('basic');
  expect(migrated.locationHistory).toEqual([migrated.observation.observer]);
  expect(() => parseState({ ...migrated, sceneId: 'E9' })).toThrow();
  for (let index = 0; index < 110; index++) {
    const current = store.getState().observation;
    store.change({ ...current, observer: { ...current.observer, heightM: index + 101 } });
  }
  expect(store.getState().locationHistory).toHaveLength(100);
  expect(store.getState().locationHistory.at(-1)?.heightM).toBe(210);
  store.navigate('E7'); expect(store.getState().sceneId).toBe('E7');
  store.setFrozen(true); expect(store.navigate('E1')).toBe(false);
});
it('import waliduje przed zapisem i nie nadpisuje stanu po błędnym pliku', () => {
  const store = createProbeStore(parseConfig(defaults));
  const storage = memory(); const session = new LocalSession(store, () => storage);
  store.navigate('E5'); session.save(); const exported = session.exportJson();
  expect(() => session.importJson('{"schemaVersion":99}')).toThrow();
  expect(() => parseSessionImport('x'.repeat(1_000_001))).toThrow('import-too-large');
  expect(store.getState().sceneId).toBe('E5');
  store.navigate('E2'); session.importJson(exported);
  expect(store.getState().sceneId).toBe('E5');
  session.reset(); expect(store.getState().sceneId).toBe('E1');
  expect(storage.getItem('nnb:p0-host-probe:0.1.0')).toBeNull();
});
it('EDU-10: plan obserwacji przeżywa eksport, import i odrzuca uszkodzone dane', () => {
  const store = createProbeStore(parseConfig(defaults));
  const session = new LocalSession(store, () => memory());
  const plan = { dateUtc: '2025-08-12', observer: { latitudeDeg: 52.2297, longitudeDeg: 21.0122, heightM: 100 },
    equipment: 'Lornetka' as const, conditions: 'Sprawdzę przeszkody przy horyzoncie.' };
  expect(store.saveObservationPlan(plan)).toBe(true);
  const exported = session.exportJson();
  store.saveObservationPlan({ ...plan, conditions: 'Inny plan' });
  session.importJson(exported);
  expect(store.getState().observationPlan).toEqual(plan);
  expect(() => parseState({ ...store.getState(), observationPlan: { ...plan, dateUtc: '2025-02-30' } })).toThrow();
});
it('EDU-10: dziennik zachowuje pomiar i waliduje odczyt przy imporcie', () => {
  const store = createProbeStore(parseConfig(defaults));
  const observation = store.getState().observation;
  const entry = { instantUtc: observation.instantUtc, observer: observation.observer, objectId: 'Moon' as const,
    azimuthDeg: 120, altitudeDeg: 30, phaseFraction: 0.5, note: 'Księżyc nad horyzontem.' };
  expect(store.addObservationEntry(entry)).toBe(true);
  expect(parseState(store.getState()).observationJournal).toEqual([entry]);
  expect(() => parseState({ ...store.getState(), observationJournal: [{ ...entry, phaseFraction: 1.2 }] })).toThrow();
  const session = new LocalSession(store, () => memory());
  const exported = session.exportJson(); store.restore(null); session.importJson(exported);
  expect(store.getState().observationJournal).toEqual([entry]);
});
