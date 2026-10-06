import { describe, expect, it } from 'vitest';
import { calculateSnapshot } from '../../src/astronomy/ephemeris';
import { parseConfig, parseState, DEFAULT_OBSERVER } from '../../src/domain/probe';
import defaults from '../../.generated/probe.json';

describe('TC-NFR-06 / SIM-04: kontrakt efemeryd', () => {
  const observation = parseConfig(defaults).initialObservation;
  it('zwraca Słońce, Księżyc i siedem planet na niebie ziemskiego obserwatora', () => {
    const result = calculateSnapshot(observation);
    expect(result.frame).toBe('topocentric-equator-of-date');
    expect(result.positions.map((p) => p.objectId)).toEqual(['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune']);
    for (const p of result.positions) {
      expect(p.raHours).toBeGreaterThanOrEqual(0); expect(p.raHours).toBeLessThan(24);
      expect(p.azimuthDeg).toBeGreaterThanOrEqual(0); expect(p.azimuthDeg).toBeLessThan(360);
      expect(p.altitudeDeg).toBeGreaterThanOrEqual(-90); expect(p.altitudeDeg).toBeLessThanOrEqual(90);
      expect(p.distanceAu).toBeGreaterThan(0);
      expect(p.angularDiameterArcmin).toBeGreaterThan(0);
      if (p.objectId === 'Sun') expect(p.phaseFraction).toBeNull();
      else { expect(p.phaseFraction).toBeGreaterThanOrEqual(0); expect(p.phaseFraction).toBeLessThanOrEqual(1); }
    }
  });
  it('nie zależy od strefy prezentacji i reaguje na zmianę obserwatora', () => {
    const result = calculateSnapshot(observation);
    expect(calculateSnapshot({ ...observation, timeZone: 'Pacific/Auckland' })).toEqual(result);
    expect(calculateSnapshot({ ...observation, observer: { ...observation.observer, latitudeDeg: -52 } })).not.toEqual(result);
  });
  it('nie ekstrapoluje poza zakres próbnego modelu', () => {
    expect(() => calculateSnapshot({ ...observation, instantUtc: '1800-01-01T00:00:00.000Z' })).toThrow('outside-validity');
  });
  it('refrakcja zmienia wysokość, ale nie bezrefrakcyjne RA/Dec', () => {
    const plain = calculateSnapshot(observation).positions;
    const refracted = calculateSnapshot({ ...observation, refraction: true }).positions;
    expect(refracted[0]!.raHours).toBe(plain[0]!.raHours);
    expect(refracted[0]!.altitudeDeg).toBeGreaterThanOrEqual(plain[0]!.altitudeDeg);
  });
  it('migruje wersję 1 bez utraty czasu/strefy/wyboru', () => {
    const old = { schemaVersion: 1, lessonId: 'p0-host-probe', contentVersion: '0.1.0',
      observation: { instantUtc: '2024-02-29T13:00:00.000Z', timeZone: 'UTC', objectId: 'Mars' } };
    const migrated = parseState(old);
    expect(migrated.schemaVersion).toBe(8);
    expect(migrated.observation).toEqual({ ...old.observation, observer: DEFAULT_OBSERVER, refraction: false });
    expect(old.schemaVersion).toBe(1);
  });
});
