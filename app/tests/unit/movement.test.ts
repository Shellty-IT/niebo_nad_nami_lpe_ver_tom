import { expect, it } from 'vitest';
import { DEFAULT_OBSERVER } from '../../src/domain/probe';
import { barnardProperMotionArcmin, marsTrack, precessionModel } from '../../src/astronomy/movement';

it('EDU-08: okres 2024/25 zawiera zwrot ruchu Marsa na tle gwiazd', () => {
  const track = marsTrack(DEFAULT_OBSERVER);
  const between = (from: string, to: string) => track.filter((point) => point.instantUtc.slice(0, 10) >= from && point.instantUtc.slice(0, 10) <= to);
  const retrograde = between('2024-12-15', '2025-02-15');
  const direct = between('2025-03-01', '2025-04-15');
  expect(retrograde.at(-1)!.raHoursJ2000).toBeLessThan(retrograde[0]!.raHoursJ2000);
  expect(direct.at(-1)!.raHoursJ2000).toBeGreaterThan(direct[0]!.raHoursJ2000);
});

it('EDU-06/07: ruch własny i schemat precesji mają rozdzielone skale', () => {
  expect(barnardProperMotionArcmin('1950-01-01T00:00:00.000Z', '2050-01-01T00:00:00.000Z')).toBeGreaterThan(15);
  expect(precessionModel(0).x).toBeCloseTo(precessionModel(26000).x, 10);
  expect(precessionModel(6500).y).toBeCloseTo(1, 10);
});
