import { Body, Equator, Observer } from 'astronomy-engine';
import { starUnitVector, stars } from './stars';
import type { ObserverLocation } from '../domain/probe';

export interface MarsTrackPoint { instantUtc: string; raHoursJ2000: number; decDegJ2000: number }
export function marsTrack(location: ObserverLocation): MarsTrackPoint[] {
  const observer = new Observer(location.latitudeDeg, location.longitudeDeg, location.heightM);
  const start = Date.UTC(2024, 9, 1, 12);
  const points: MarsTrackPoint[] = [];
  for (let day = 0; day <= 210; day += 7) {
    const time = new Date(start + day * 86_400_000);
    const position = Equator(Body.Mars, time, observer, true, false);
    points.push({ instantUtc: time.toISOString(), raHoursJ2000: position.ra, decDegJ2000: position.dec });
  }
  return points;
}

export function barnardProperMotionArcmin(fromUtc: string, toUtc: string): number {
  const barnard = stars.find((star) => star.id === 87937);
  if (!barnard) throw new Error('missing-barnard');
  const a = starUnitVector(barnard, fromUtc);
  const b = starUnitVector(barnard, toUtc);
  return Math.acos(Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]))) * 180 / Math.PI * 60;
}

// Oddzielny schemat dydaktyczny: stały stożek o półkącie 23,4° i okresie ~26 tys. lat.
export function precessionModel(yearOffset: number) {
  if (!Number.isFinite(yearOffset) || yearOffset < 0 || yearOffset > 26000) throw new Error('invalid-model-year');
  const phase = 2 * Math.PI * yearOffset / 26000;
  return { yearOffset, phaseRad: phase, coneRadiusDeg: 23.4,
    x: Math.cos(phase), y: Math.sin(phase) };
}
