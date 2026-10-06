import { describe, expect, it, vi } from 'vitest';
import defaults from '../../.generated/probe.json';
import { initialState, parseConfig, parseState } from '../../src/domain/probe';
import { createProbeStore } from '../../src/app/probe-store';

describe('TC-ZPE-04 / TC-NFR-07: stan próbki', () => {
  const config = parseConfig(defaults);
  it('odrzuca nadmiarowe pola, złą wersję i cudzą lekcję', () => {
    const state = initialState(config);
    for (const extra of [{ schemaVersion: 99 }, { lessonId: 'other' }, { injected: '<script>' }]) {
      expect(() => parseState({ ...state, ...extra })).toThrow();
    }
  });
  it('odrzuca datę znormalizowaną przez Date oraz nieznaną strefę', () => {
    for (const patch of [{ instantUtc: '2026-02-30T18:00:00.000Z' }, { timeZone: 'Invalid/Zone' }]) {
      expect(() => parseState({ ...initialState(config), observation: { ...config.initialObservation, ...patch } })).toThrow();
    }
  });
  it('błędne przywrócenie nie zmienia poprawnego stanu', () => {
    const store = createProbeStore(config);
    const before = store.getState();
    expect(() => store.restore({ observation: {} })).toThrow();
    expect(store.getState()).toEqual(before);
  });
  it('zamrożenie blokuje komendy i powiadomienia, ale pozwala hostowi zmienić podgląd', () => {
    const store = createProbeStore(config);
    const listener = vi.fn();
    store.setFrozen(true);
    store.subscribe(listener);
    expect(store.change({ ...config.initialObservation, objectId: 'Mars' })).toBe(false);
    expect(listener).not.toHaveBeenCalled();
    store.restore({ ...initialState(config), observation: { ...config.initialObservation, objectId: 'Sun' } });
    expect(store.getState().observation.objectId).toBe('Sun');
    expect(store.isFrozen()).toBe(true);
  });
  it('izoluje instancje i zwracane kopie danych', () => {
    const first = createProbeStore(config);
    const second = createProbeStore(config);
    first.change({ ...config.initialObservation, objectId: 'Mars' });
    const copy = first.getState();
    copy.observation.objectId = 'Sun';
    expect(first.getState().observation.objectId).toBe('Mars');
    expect(second.getState().observation.objectId).toBe('Moon');
  });
  it('zmiana strefy zachowuje UTC również na granicy DST', () => {
    const store = createProbeStore(config);
    store.change({ ...config.initialObservation, instantUtc: '2026-10-25T01:30:00.000Z' });
    store.change({ ...store.getState().observation, timeZone: 'America/New_York' });
    expect(store.getState().observation.instantUtc).toBe('2026-10-25T01:30:00.000Z');
  });
  it('zapisuje wybór gwiazdy i odczytuje starszy stan v6 bez tego pola', () => {
    const store = createProbeStore(config);
    expect(store.setSelectedStar(32349)).toBe(true);
    const saved = store.getState();
    store.restore(saved);
    expect(store.getState().selectedStarId).toBe(32349);
    store.selectObject('Venus');
    expect(store.getState().selectedStarId).toBeNull();
    const oldV6 = JSON.parse(JSON.stringify(saved));
    delete oldV6.selectedStarId;
    expect(parseState(oldV6).selectedStarId).toBeNull();
  });
});
