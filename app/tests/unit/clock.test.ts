import { expect, it } from 'vitest';
import { SimulationClock } from '../../src/simulation/clock';
import { createProbeStore } from '../../src/app/probe-store';
import { parseConfig } from '../../src/domain/probe';
import defaults from '../../.generated/probe.json';

it('czas zależy od monotonicznego upływu, nie liczby próbek, także przy zwalnianiu i cofaniu', () => {
  const a = new SimulationClock(); const b = new SimulationClock();
  for (const rate of [0, 0.1, 1, 60, 3600, 86400, -0.1, -86400]) {
    a.set(1_000_000, rate, 200); b.set(1_000_000, rate, 200);
    for (let tick = 200; tick <= 2200; tick += 10) a.sample(tick);
    expect(a.sample(2200)).toBe(b.sample(2200));
    expect(b.sample(2200)).toBe(1_000_000 + 2000 * rate);
  }
});
it('zamrożenie blokuje tempo i kamerę, a zwracana kamera jest kopią', () => {
  const store = createProbeStore(parseConfig(defaults));
  store.setFrozen(true);
  expect(store.setPlaybackRate(86400)).toBe(false);
  expect(store.setCamera({ azimuthDeg: 90, altitudeDeg: 10, fovDeg: 60 })).toBe(false);
  store.setFrozen(false);
  const copy = store.getState(); copy.camera.azimuthDeg = 180;
  expect(store.getState().camera.azimuthDeg).toBe(0);
  expect(() => store.setPlaybackRate(123)).toThrow();
});
