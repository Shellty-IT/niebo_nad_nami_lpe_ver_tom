import { expect, it } from 'vitest';
import { normalizeCamera, projectDirection, skyDirection } from '../../src/rendering/sky/projection';

it('orientuje północ przed kamerą, wschód po prawej i zenit w górze', () => {
  const camera = { azimuthDeg: 0, altitudeDeg: 0, fovDeg: 90 };
  expect(projectDirection(skyDirection(0, 0), camera, 800, 400)).toEqual({ x: 400, y: 200 });
  expect(projectDirection(skyDirection(30, 0), camera, 800, 400)!.x).toBeGreaterThan(400);
  expect(projectDirection(skyDirection(0, 30), camera, 800, 400)!.y).toBeLessThan(200);
  expect(projectDirection(skyDirection(180, 0), camera, 800, 400)).toBe(null);
});
it('zawija azymut, ogranicza zoom i poprawnie centruje dowolny kierunek', () => {
  expect(normalizeCamera({ azimuthDeg: -15, altitudeDeg: 100, fovDeg: 1 })).toEqual({ azimuthDeg: 345, altitudeDeg: 89, fovDeg: 15 });
  const camera = { azimuthDeg: 239, altitudeDeg: -37, fovDeg: 55 };
  const projected = projectDirection(skyDirection(239, -37), camera, 800, 400)!;
  expect(projected.x).toBeCloseTo(400); expect(projected.y).toBeCloseTo(200);
});
