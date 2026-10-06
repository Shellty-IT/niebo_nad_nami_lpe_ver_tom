import { expect, it } from 'vitest';
import { EquatorFromVector, Horizon, Observer, RotateVector, Rotation_EQJ_EQD, Spherical, VectorFromSphere } from 'astronomy-engine';
import { calculateStarDirections, constellations, projectStar, starUnitVector, stars } from '../../src/astronomy/stars';
import { DEFAULT_OBSERVER } from '../../src/domain/probe';
import { equatorialGrid } from '../../src/astronomy/sky-grids';

it('BL-10: katalog ma pełne identyfikatory i pięć rozłącznych warstw granica/figura', () => {
  expect(stars.length).toBe(8871);
  expect(new Set(stars.map((star) => star.id)).size).toBe(stars.length);
  expect(constellations.map((item) => item.id)).toEqual(['UMa', 'Cas', 'Ori', 'Cru', 'Cen']);
  const ids = new Set(stars.map((star) => star.id));
  for (const item of constellations) {
    expect(item.boundary.length).toBeGreaterThan(3);
    expect(item.figure.flat().every((id) => ids.has(id))).toBe(true);
  }
});

it('BL-11: transformacja ICRS do horyzontu zgadza się z niezależną ścieżką Astronomy Engine', () => {
  const instant = '2026-10-03T18:00:00.000Z';
  const location = DEFAULT_OBSERVER;
  const sirius = stars.find((star) => star.id === 32349)!;
  const result = calculateStarDirections(instant, location, false).find((star) => star.id === 32349)!;
  const [x, y, z] = starUnitVector(sirius, instant);
  const time = new Date(instant);
  const dateVector = RotateVector(Rotation_EQJ_EQD(time), VectorFromSphere(new Spherical(Math.asin(z) * 180 / Math.PI, Math.atan2(y, x) * 180 / Math.PI, 1), time));
  const equatorial = EquatorFromVector(dateVector);
  const horizontal = Horizon(time, new Observer(location.latitudeDeg, location.longitudeDeg, location.heightM), equatorial.ra, equatorial.dec);
  expect(result.azimuthDeg).toBeCloseTo(horizontal.azimuth, 5);
  expect(result.altitudeDeg).toBeCloseTo(horizontal.altitude, 5);
  expect(projectStar(sirius, instant, [[1, 0, 0], [0, 1, 0], [0, 0, 1]], false).magnitude).toBe(sirius.magnitude);
});

it('BL-11: ruch własny Gwiazdy Barnarda zmienia kierunek w stuleciu, ale nie udaje efemerydy planet', () => {
  const barnard = stars.find((star) => star.id === 87937)!;
  const a = starUnitVector(barnard, '1950-01-01T00:00:00.000Z');
  const b = starUnitVector(barnard, '2050-01-01T00:00:00.000Z');
  const separationArcmin = Math.acos(Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]))) * 180 / Math.PI * 60;
  expect(separationArcmin).toBeGreaterThan(15);
  expect(separationArcmin).toBeLessThan(20);
});

it('E2: siatka równikowa daty obejmuje równoleżniki i południki', () => {
  const paths = equatorialGrid('2026-10-03T18:00:00.000Z', DEFAULT_OBSERVER);
  expect(paths).toHaveLength(13);
  expect(paths.every((path) => path.length >= 61 && path.every((point) =>
    point.azimuthDeg >= 0 && point.azimuthDeg < 360 && point.altitudeDeg >= -90 && point.altitudeDeg <= 90))).toBe(true);
});
