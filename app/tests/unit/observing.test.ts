import { expect, it } from 'vitest';
import { Body } from 'astronomy-engine';
import { eclipseExample, meteorStreaks, moonPhaseReading, nextMoonQuarters, solarDay, sunPlanetSeparation } from '../../src/astronomy/observing';
import { telescopeReading, exposureSignalRatio } from '../../src/astronomy/telescope';

const warsaw = { latitudeDeg: 52.2297, longitudeDeg: 21.0122, heightM: 100 };
const dallas = { latitudeDeg: 32.7767, longitudeDeg: -96.797, heightM: 100 };

it('EDU-10: wschód i zachód Słońca zależą od daty, a zdarzeń polarnych nie tworzymy sztucznie', () => {
  const june = solarDay('2025-06-21', warsaw);
  const december = solarDay('2025-12-21', warsaw);
  expect(june.riseUtc).toMatch(/^2025-06-21T/);
  expect(december.riseUtc).toMatch(/^2025-12-21T/);
  expect(Date.parse(june.setUtc!) - Date.parse(june.riseUtc!)).toBeGreaterThan(Date.parse(december.setUtc!) - Date.parse(december.riseUtc!));
  const polar = solarDay('2025-06-21', { latitudeDeg: 78, longitudeDeg: 15, heightM: 0 });
  expect(polar.riseUtc).toBeNull(); expect(polar.setUtc).toBeNull();
});

it('EDU-12: nów i pełnia mają właściwe oświetlenie, a cztery kolejne kwadry zachowują kolejność', () => {
  const newMoon = moonPhaseReading('2025-03-29T10:58:00.000Z', warsaw);
  const fullMoon = moonPhaseReading('2025-03-14T06:55:00.000Z', warsaw);
  expect(newMoon.litFraction).toBeLessThan(0.02);
  expect(fullMoon.litFraction).toBeGreaterThan(0.98);
  const quarters = nextMoonQuarters('2025-03-01T00:00:00.000Z');
  expect(quarters.map((item) => item.quarter)).toEqual([1, 2, 3, 0]);
  expect(quarters.map((item) => item.instantUtc)).toEqual([...quarters.map((item) => item.instantUtc)].sort());
});

it('EDU-13: ta sama geometria zaćmienia Słońca ma odmienną widoczność lokalną', () => {
  const local = eclipseExample('solar', dallas);
  const remote = eclipseExample('solar', warsaw);
  expect(local.peakUtc.slice(0, 10)).toBe('2024-04-08');
  expect(local.localEvent).toBe(true);
  expect(local.localSolarCoverage).toBeGreaterThan(0.9);
  expect(remote.peakUtc).toBe(local.peakUtc);
  expect(remote.localEvent).toBe(false);
  expect(remote.localSolarCoverage).toBeNull();
  const lunar = eclipseExample('lunar', warsaw);
  expect(lunar.peakUtc.slice(0, 10)).toBe('2025-03-14');
});

it('EDU-12: Mars przy opozycji ma dużą separację kierunku od Słońca', () => {
  expect(sunPlanetSeparation('2025-01-16T00:00:00.000Z', warsaw, Body.Mars)).toBeGreaterThan(170);
  expect(() => sunPlanetSeparation('2025-01-16T00:00:00.000Z', warsaw, Body.Moon)).toThrow();
});

it('EDU-14: meteorowe smugi są powtarzalnym modelem statystycznym', () => {
  expect(meteorStreaks(20)).toEqual(meteorStreaks(20));
  expect(meteorStreaks(20)).not.toEqual(meteorStreaks(21));
  expect(() => meteorStreaks(101)).toThrow();
});

it('EDU-15/SIM-10: okular zmienia powiększenie i pole, apertura limit dyfrakcyjny', () => {
  const base = { instrument: 'refractor' as const, focalLengthMm: 900, apertureMm: 90, apparentFieldDeg: 60 };
  const wide = telescopeReading({ ...base, eyepieceFocalMm: 30 });
  const narrow = telescopeReading({ ...base, eyepieceFocalMm: 10 });
  expect(wide.magnification).toBeCloseTo(30);
  expect(narrow.magnification).toBeCloseTo(90);
  expect(narrow.trueFieldDeg).toBeCloseTo(wide.trueFieldDeg / 3);
  expect(telescopeReading({ ...base, apertureMm: 180, eyepieceFocalMm: 10 }).diffractionLimitArcsec).toBeCloseTo(narrow.diffractionLimitArcsec / 2);
  expect(() => telescopeReading({ ...base, eyepieceFocalMm: 0 })).toThrow();
});

it('EDU-16: model sygnału ekspozycji ma liniową proporcję i odrzuca brak czasu', () => {
  expect(exposureSignalRatio(60, 10)).toBe(6);
  expect(() => exposureSignalRatio(0, 10)).toThrow();
});
