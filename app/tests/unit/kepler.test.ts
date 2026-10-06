import { expect, it } from 'vitest';
import { orbitPoint, orbitalPeriodYears, sweptAreaAu2 } from '../../src/astronomy/kepler';

it('EDU-09: Słońce jest w ognisku, a odległości peryhelium i aphelium wynikają z a i e', () => {
  const peri = orbitPoint(2, 0.5, 0);
  const apo = orbitPoint(2, 0.5, Math.PI);
  expect(peri.radiusAu).toBeCloseTo(1, 10);
  expect(apo.radiusAu).toBeCloseTo(3, 10);
  expect(peri.xAu).toBeCloseTo(1, 10);
  expect(apo.xAu).toBeCloseTo(-3, 10);
});

it('EDU-09: równe interwały czasu zakreślają równe pola, a T²=a³', () => {
  const nearPeri = sweptAreaAu2(1.5, 0.4, 0, Math.PI / 6);
  const nearApo = sweptAreaAu2(1.5, 0.4, Math.PI, Math.PI + Math.PI / 6);
  expect(nearPeri).toBeCloseTo(nearApo, 12);
  expect(orbitalPeriodYears(4) ** 2).toBeCloseTo(4 ** 3, 12);
  expect(() => orbitPoint(1, 1, 0)).toThrow();
});
