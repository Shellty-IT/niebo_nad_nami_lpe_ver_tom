import { Observer, Refraction, Rotation_EQJ_HOR } from 'astronomy-engine';
import data from '../../.generated/catalogs.json';
import type { ObserverLocation } from '../domain/probe';

export interface StarRecord {
  id: number; magnitude: number; raDeg: number; decDeg: number;
  pmRaCosDecMasYr: number | null; pmDecMasYr: number | null; parallaxMas: number | null;
  btMag: number | null; vtMag: number | null;
}
export interface StarDirection { id: number; magnitude: number; azimuthDeg: number; altitudeDeg: number }
export const stars: readonly StarRecord[] = data.stars;
export const constellations = data.constellations;
export const allConstellations = data.allConstellations;
const radians = Math.PI / 180;
const masToRad = radians / 3_600_000;
const epochMs = Date.UTC(1991, 0, 1) + (365.25 * 0.25 * 86_400_000);
const julianYearMs = 365.25 * 86_400_000;

export function starUnitVector(star: StarRecord, instantUtc: string): readonly [number, number, number] {
  const ra = star.raDeg * radians; const dec = star.decDeg * radians;
  const cosDec = Math.cos(dec); const sinDec = Math.sin(dec);
  const x = cosDec * Math.cos(ra); const y = cosDec * Math.sin(ra); const z = sinDec;
  const years = (Date.parse(instantUtc) - epochMs) / julianYearMs;
  const east = (star.pmRaCosDecMasYr ?? 0) * years * masToRad;
  const north = (star.pmDecMasYr ?? 0) * years * masToRad;
  const movedX = x - east * Math.sin(ra) - north * sinDec * Math.cos(ra);
  const movedY = y + east * Math.cos(ra) - north * sinDec * Math.sin(ra);
  const movedZ = z + north * cosDec;
  const length = Math.hypot(movedX, movedY, movedZ);
  return [movedX / length, movedY / length, movedZ / length];
}

export function equatorialToHorizonMatrix(instantUtc: string, location: ObserverLocation) {
  return Rotation_EQJ_HOR(new Date(instantUtc), new Observer(location.latitudeDeg, location.longitudeDeg, location.heightM)).rot;
}

export function projectStar(star: StarRecord, instantUtc: string, matrix: number[][], refraction: boolean): StarDirection {
  const [x, y, z] = starUnitVector(star, instantUtc);
  const north = matrix[0]![0]! * x + matrix[1]![0]! * y + matrix[2]![0]! * z;
  const west = matrix[0]![1]! * x + matrix[1]![1]! * y + matrix[2]![1]! * z;
  const up = matrix[0]![2]! * x + matrix[1]![2]! * y + matrix[2]![2]! * z;
  const altitude = Math.asin(Math.max(-1, Math.min(1, up))) / radians;
  return { id: star.id, magnitude: star.magnitude,
    azimuthDeg: ((Math.atan2(-west, north) / radians) + 360) % 360,
    altitudeDeg: altitude + (refraction ? Refraction('normal', altitude) : 0) };
}

export function calculateStarDirections(instantUtc: string, location: ObserverLocation, refraction: boolean): StarDirection[] {
  const matrix = equatorialToHorizonMatrix(instantUtc, location);
  return stars.map((star) => projectStar(star, instantUtc, matrix, refraction));
}
