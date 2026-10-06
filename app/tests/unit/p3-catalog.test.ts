import { expect, it } from 'vitest';
import { Observer, ObserverVector } from 'astronomy-engine';
import holdouts from '../astronomy/fixtures/p3-holdouts.json';
import moonHoldouts from '../astronomy/fixtures/p3-moon-holdouts.json';
import { calculateCatalog } from '../../src/astronomy/extra-catalog';
import { equatorialToHorizonMatrix } from '../../src/astronomy/stars';
import { eclipseExample, moonPhaseReading, nextMoonQuarters, solarDay } from '../../src/astronomy/observing';
import defaults from '../../.generated/probe.json';
import { initialState, parseConfig, parseState } from '../../src/domain/probe';

const sites = [
  ['Warszawa', 52.2297, 21.0122], ['Dallas', 32.7767, -96.797], ['Austin', 30.2672, -97.7431],
  ['Nowy Jork', 40.7128, -74.006], ['Los Angeles', 34.0522, -118.2437], ['Meksyk', 19.4326, -99.1332],
  ['Quito', -0.1807, -78.4678], ['Kapsztad', -33.9258, 18.4232], ['Sydney', -33.8688, 151.2093],
  ['Tokio', 35.6762, 139.6503], ['Londyn', 51.5074, -0.1278], ['Honolulu', 21.3099, -157.8581],
] as const;
function observation(instantUtc: string, latitudeDeg: number, longitudeDeg: number) {
  return { instantUtc, timeZone: 'UTC', objectId: 'Jupiter' as const,
    observer: { latitudeDeg, longitudeDeg, heightM: 0 }, refraction: false };
}
function expectedAngles(vector: number[], instant: string, latitude: number, longitude: number) {
  const obs = ObserverVector(new Date(instant), new Observer(latitude, longitude, 0), false);
  const [x,y,z] = [vector[0]! - obs.x, vector[1]! - obs.y, vector[2]! - obs.z];
  const matrix = equatorialToHorizonMatrix(instant, { latitudeDeg: latitude, longitudeDeg: longitude, heightM: 0 });
  const north = matrix[0]![0]!*x + matrix[1]![0]!*y + matrix[2]![0]!*z;
  const west = matrix[0]![1]!*x + matrix[1]![1]!*y + matrix[2]![1]!*z;
  const up = matrix[0]![2]!*x + matrix[1]![2]!*y + matrix[2]![2]!*z;
  return { az: (Math.atan2(-west,north)*180/Math.PI+360)%360,
    alt: Math.atan2(up,Math.hypot(north,west))*180/Math.PI };
}
function separation(a: {az:number;alt:number}, b: {az:number;alt:number}) {
  const r = Math.PI/180; const dot = Math.sin(a.alt*r)*Math.sin(b.alt*r) +
    Math.cos(a.alt*r)*Math.cos(b.alt*r)*Math.cos((a.az-b.az)*r);
  return Math.acos(Math.max(-1,Math.min(1,dot)))/r*60;
}
it('P3: Ceres i 67P zgadzają się z niezależnymi próbkami JPL pomiędzy węzłami tabeli', () => {
  for (const row of holdouts) for (const [, latitude, longitude] of [sites[0]!, sites[8]!]) {
    const value = calculateCatalog(observation(row.instantUtc, latitude, longitude)).find((item) => item.id === row.id)!;
    const ref = expectedAngles(row.vector, row.instantUtc, latitude, longitude);
    expect(separation({az:value.azimuthDeg, alt:value.altitudeDeg}, ref)).toBeLessThan(0.1);
  }
});
it('P3: każdy typ katalogu ma kierunek i odpowiednio ograniczoną ważność', () => {
  const result = calculateCatalog(observation('2025-06-15T00:00:00.000Z', 52, 21));
  expect(result).toHaveLength(8);
  for (const item of result) {
    expect(item.azimuthDeg).toBeGreaterThanOrEqual(0); expect(item.azimuthDeg).toBeLessThan(360);
    expect(item.altitudeDeg).toBeGreaterThanOrEqual(-90); expect(item.altitudeDeg).toBeLessThanOrEqual(90);
  }
  expect(result.find((item) => item.id === '67P')?.validTo).toBe('2030-01-01T00:00:00.000Z');
  expect(calculateCatalog(observation('2031-01-01T00:00:00.000Z', 52, 21)).map((item) => item.id))
    .not.toContain('Ceres');
});
it('P3: kierunki księżyców Jowisza zgadzają się z niezależną efemerydą JPL', () => {
  let maximumArcmin = 0;
  for (const row of moonHoldouts) {
    const [latitude, longitude] = [52.2297, 21.0122];
    const value = calculateCatalog(observation(row.instantUtc, latitude, longitude)).find((item) => item.id === row.id)!;
    const ref = expectedAngles(row.vector, row.instantUtc, latitude, longitude);
    maximumArcmin = Math.max(maximumArcmin, separation({az:value.azimuthDeg, alt:value.altitudeDeg}, ref));
  }
  expect(maximumArcmin).toBeLessThan(5);
});
it('Z03: górowanie jest obliczone dla danej daty, a cztery daty mogą być porównane w jednym miejscu', () => {
  const days = ['2025-03-20','2025-06-21','2025-09-22','2025-12-21'].map((date) => solarDay(date, { latitudeDeg:52.2297, longitudeDeg:21.0122, heightM:100 }));
  expect(days.every((item) => item.transitUtc?.startsWith(item.date))).toBe(true);
  expect(days[1]!.transitAltitudeDeg!).toBeGreaterThan(days[3]!.transitAltitudeDeg! + 40);
  for (const day of days) expect(Date.parse(day.transitUtc!) - Date.parse(day.riseUtc!)).toBeGreaterThan(0);
});
it('Z04: kierunek jasnego brzegu wynika z położenia Słońca i obraca się między półkulami', () => {
  const instant = '2025-04-05T00:00:00.000Z';
  const north = moonPhaseReading(instant, { latitudeDeg:45, longitudeDeg:0, heightM:0 });
  const south = moonPhaseReading(instant, { latitudeDeg:-45, longitudeDeg:0, heightM:0 });
  expect(north.litFraction).toBeGreaterThan(0.4);
  expect(north.litFraction).toBeLessThan(0.6);
  expect(Math.abs(north.brightLimbAngleDeg-south.brightLimbAngleDeg)).toBeGreaterThan(60);
});
it('Z04: zapis odrzuca fazy z różnych cykli i miejsc', () => {
  const state = initialState(parseConfig(defaults));
  const observer = state.observation.observer;
  const records = nextMoonQuarters('2025-04-01T00:00:00.000Z').slice(0, 2).map((event) => {
    const reading = moonPhaseReading(event.instantUtc, observer);
    return { quarter: event.quarter, instantUtc: event.instantUtc, observer,
      litFraction: reading.litFraction, phaseAngleDeg: reading.phaseAngleDeg,
      brightLimbAngleDeg: reading.brightLimbAngleDeg };
  });
  const withRecords = { ...state, p3Tasks: { ...state.p3Tasks, moonRecords: records } };
  expect(parseState(withRecords).p3Tasks.moonRecords).toHaveLength(2);
  expect(() => parseState({ ...withRecords, p3Tasks: { ...withRecords.p3Tasks, moonRecords:
    [records[0], { ...records[1], instantUtc: '2025-06-01T00:00:00.000Z' }] } })).toThrow('invalid-p3-tasks');
  expect(() => parseState({ ...withRecords, p3Tasks: { ...withRecords.p3Tasks, moonRecords:
    [records[0], { ...records[1], observer: { ...observer, latitudeDeg: observer.latitudeDeg + 1 } }] } })).toThrow('invalid-p3-tasks');
});
it('EDU-13: pełne kontakty obu zaćmień mają lokalną widoczność w 12 miejscach', () => {
  // NASA GSFC: 08.04.2024 18:17:18 UT oraz 14.03.2025 06:59:56 UT.
  const solarPeak = eclipseExample('solar', { latitudeDeg: 32.7767, longitudeDeg: -96.797, heightM: 0 }).peakUtc;
  const lunarPeak = eclipseExample('lunar', { latitudeDeg: 32.7767, longitudeDeg: -96.797, heightM: 0 }).peakUtc;
  expect(Math.abs(Date.parse(solarPeak)-Date.parse('2024-04-08T18:17:18.000Z'))).toBeLessThan(120_000);
  expect(Math.abs(Date.parse(lunarPeak)-Date.parse('2025-03-14T06:59:56.000Z'))).toBeLessThan(120_000);
  for (const [, latitude, longitude] of sites) {
    const site = { latitudeDeg: latitude, longitudeDeg: longitude, heightM: 0 };
    for (const kind of ['solar','lunar'] as const) {
      const example = eclipseExample(kind, site);
      expect(example.localEvent).toBe(example.localVisibility !== 'none');
      for (const contact of example.contacts) {
        expect(Number.isFinite(contact.altitudeDeg)).toBe(true);
        expect(Date.parse(contact.instantUtc)).toBeGreaterThan(0);
      }
      if (example.localVisibility === 'peak') expect(example.localPeakAltitudeDeg).toBeGreaterThan(0);
    }
  }
  const dallas = eclipseExample('solar', { latitudeDeg: 32.7767, longitudeDeg: -96.797, heightM: 0 });
  expect(dallas.localVisibility).toBe('peak'); expect(dallas.contacts.length).toBe(5);
});
