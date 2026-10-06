import { afterAll, expect, test } from 'vitest';
import references from '../astronomy/fixtures/horizons.json';
import planetReferences from '../astronomy/fixtures/planets.json';
import { calculateSnapshot } from '../../src/astronomy/ephemeris';
import type { ObjectId } from '../../src/domain/probe';

function direction(longitude: number, latitude: number) {
  const rad = Math.PI / 180;
  return [Math.cos(latitude * rad) * Math.cos(longitude * rad),
    Math.cos(latitude * rad) * Math.sin(longitude * rad), Math.sin(latitude * rad)] as const;
}
function separation(aLon: number, aLat: number, bLon: number, bLat: number) {
  const a = direction(aLon, aLat); const b = direction(bLon, bLat);
  const cross = Math.hypot(a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]);
  const dot = a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  return Math.atan2(cross, dot) * 180 / Math.PI * 60;
}
let maxEquatorial = 0;
let maxHorizontal = 0;
const samples = [...references.samples.map((sample) => ({ ...sample, tolerance: references.angularToleranceArcmin })),
  ...planetReferences.samples.map((sample) => ({ ...sample, tolerance: planetReferences.angularToleranceArcmin }))];
test.each(samples)('JPL: $siteId / $objectId / $instantUtc', (sample) => {
  const actual = calculateSnapshot({
    instantUtc: sample.instantUtc, observer: sample.observer, refraction: false,
    timeZone: 'UTC', objectId: sample.objectId as ObjectId,
  }).positions.find((position) => position.objectId === sample.objectId)!;
  const equatorial = separation(actual.raHours * 15, actual.decDeg, sample.raDeg, sample.decDeg);
  const horizontal = separation(actual.azimuthDeg, actual.altitudeDeg, sample.azimuthDeg, sample.altitudeDeg);
  maxEquatorial = Math.max(maxEquatorial, equatorial);
  maxHorizontal = Math.max(maxHorizontal, horizontal);
  expect(equatorial).toBeLessThanOrEqual(sample.tolerance);
  expect(horizontal).toBeLessThanOrEqual(sample.tolerance);
});
afterAll(() => console.log(`JPL ${samples.length} próbek: maks. błąd RA/Dec ${maxEquatorial.toFixed(6)}′, az/alt ${maxHorizontal.toFixed(6)}′.`));
