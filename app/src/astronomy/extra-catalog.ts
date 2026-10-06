import { Body, GeoVector, JupiterMoons, Observer, ObserverVector, Refraction } from 'astronomy-engine';
import data from '../../.generated/p3-small-bodies.json';
import type { Observation } from '../domain/probe';
import { equatorialToHorizonMatrix } from './stars';

export type CatalogId = 'M31' | 'M42' | 'Ceres' | '67P' | 'Io' | 'Europa' | 'Ganymede' | 'Callisto';
export interface CatalogPosition {
  id: CatalogId; name: string; category: string; azimuthDeg: number; altitudeDeg: number;
  distanceAu: number | null; validFrom: string | null; validTo: string | null;
  source: string; description: string; quality: string;
  apparentMagnitude: number | null; angularSize: string; imageId: 'm31' | 'm42' | null;
  occultedByJupiter: boolean;
}
type Vector = [number, number, number];
type Row = [number, number, number, number, number, number];
const dayMs = 86_400_000;
const CATALOG: Record<CatalogId, Pick<CatalogPosition, 'name' | 'category' | 'source' | 'description' | 'quality' | 'apparentMagnitude' | 'angularSize' | 'imageId'>> = {
  M31: { name: 'Galaktyka Andromedy (M31)', category: 'galaktyka', source: 'https://science.nasa.gov/mission/hubble/science/explore-the-night-sky/hubble-messier-catalog/messier-31/', description: 'Duża galaktyka spiralna, około 2,5 mln lat świetlnych od nas; kierunek środka jest przybliżony.', quality: 'Kierunek katalogowy, bez modelu ruchu własnego.', apparentMagnitude: 3.1, angularSize: 'około 3° wzdłuż osi długiej (NASA: około sześć średnic Księżyca)', imageId: 'm31' },
  M42: { name: 'Mgławica Oriona (M42)', category: 'mgławica', source: 'https://science.nasa.gov/mission/hubble/science/explore-the-night-sky/hubble-messier-catalog/messier-42/', description: 'Obszar powstawania gwiazd w Orionie, około 1500 lat świetlnych od nas.', quality: 'Kierunek reprezentuje środek obrazu NASA; obiekt rozciągły o nieostrej granicy.', apparentMagnitude: 4.0, angularSize: 'granica mgławicy nieostra; centralne pole zdjęcia NASA ma 30′', imageId: 'm42' },
  Ceres: { name: 'Ceres', category: 'planetoida', source: 'https://ssd.jpl.nasa.gov/horizons/', description: 'Największy obiekt pasa planetoid; pozycja interpolowana z próbek JPL Horizons.', quality: 'Pozorna pozycja geocentryczna JPL LT+S, poprawka topocentryczna; interpolacja Hermite’a.', apparentMagnitude: null, angularSize: 'tarcza zbyt mała dla uproszczonego widoku; szczegóły niedostępne', imageId: null },
  '67P': { name: '67P/Czuriumow–Gierasimienko', category: 'kometa', source: 'https://ssd.jpl.nasa.gov/horizons/', description: 'Kometa badana przez misję Rosetta; pozycja interpolowana z próbek JPL Horizons.', quality: 'Pozorna pozycja geocentryczna JPL LT+S, poprawka topocentryczna; interpolacja Hermite’a.', apparentMagnitude: null, angularSize: 'zmienna koma; brak stałego rozmiaru kątowego', imageId: null },
  Io: { name: 'Io', category: 'księżyc Jowisza', source: 'https://science.nasa.gov/jupiter/jupiter-moons/io/facts/', description: 'Jeden z czterech księżyców galileuszowych; aktywność wulkaniczna.', quality: 'Model orbitalny Astronomy Engine; przybliżona poprawka czasu biegu światła.', apparentMagnitude: null, angularSize: 'punkt w skali mapy nieba', imageId: null },
  Europa: { name: 'Europa', category: 'księżyc Jowisza', source: 'https://science.nasa.gov/jupiter/jupiter-moons/europa/europa-facts/', description: 'Księżyc galileuszowy z lodową powierzchnią.', quality: 'Model orbitalny Astronomy Engine; przybliżona poprawka czasu biegu światła.', apparentMagnitude: null, angularSize: 'punkt w skali mapy nieba', imageId: null },
  Ganymede: { name: 'Ganimedes', category: 'księżyc Jowisza', source: 'https://science.nasa.gov/jupiter/jupiter-moons/', description: 'Największy księżyc Jowisza.', quality: 'Model orbitalny Astronomy Engine; przybliżona poprawka czasu biegu światła.', apparentMagnitude: null, angularSize: 'punkt w skali mapy nieba', imageId: null },
  Callisto: { name: 'Kallisto', category: 'księżyc Jowisza', source: 'https://science.nasa.gov/jupiter/jupiter-moons/', description: 'Zewnętrzny z czterech głównych księżyców Jowisza.', quality: 'Model orbitalny Astronomy Engine; przybliżona poprawka czasu biegu światła.', apparentMagnitude: null, angularSize: 'punkt w skali mapy nieba', imageId: null },
};
export const CATALOG_IDS = Object.keys(CATALOG) as CatalogId[];
export function catalogInfo(id: CatalogId) {
  const source = id === 'Ceres' ? data.ceres : id === '67P' ? data['67p'] : null;
  return { id, ...CATALOG[id], validFrom: source?.startUtc ?? null, validTo: source?.endUtc ?? null };
}
function norm(v: Vector) { return Math.hypot(...v); }
function unit(raDeg: number, decDeg: number): Vector {
  const ra = raDeg * Math.PI / 180; const dec = decDeg * Math.PI / 180;
  return [Math.cos(dec) * Math.cos(ra), Math.cos(dec) * Math.sin(ra), Math.sin(dec)];
}
function interpolate(rows: number[][], start: string, instant: string): Vector | null {
  const day = (new Date(instant).getTime() - new Date(start).getTime()) / dayMs;
  if (day < 0 || day > rows.length - 1) return null;
  const index = Math.min(Math.floor(day), rows.length - 2); const t = day - index;
  const a = rows[index] as Row; const b = rows[index + 1] as Row;
  const h00 = 2*t*t*t - 3*t*t + 1; const h10 = t*t*t - 2*t*t + t;
  const h01 = -2*t*t*t + 3*t*t; const h11 = t*t*t - t*t;
  return [0, 1, 2].map((axis) => h00*a[axis]! + h10*a[axis + 3]! + h01*b[axis]! + h11*b[axis + 3]!) as Vector;
}
export function calculateCatalog(observation: Observation): CatalogPosition[] {
  const { instantUtc, observer: location, refraction } = observation;
  const time = new Date(instantUtc);
  const observer = new Observer(location.latitudeDeg, location.longitudeDeg, location.heightM);
  const obs = ObserverVector(time, observer, false);
  const obsVector: Vector = [obs.x, obs.y, obs.z];
  const matrix = equatorialToHorizonMatrix(instantUtc, location);
  const jupiter = GeoVector(Body.Jupiter, time, true);
  const jupiterTopocentric: Vector = [jupiter.x-obsVector[0], jupiter.y-obsVector[1], jupiter.z-obsVector[2]];
  const jupiterDistance = norm(jupiterTopocentric);
  const travelDays = Math.hypot(jupiter.x, jupiter.y, jupiter.z) * 499.004783836 / 86400;
  const moons = JupiterMoons(new Date(time.getTime() - travelDays * dayMs));
  const moonVectors: Record<string, {x:number;y:number;z:number}> = { Io: moons.io, Europa: moons.europa, Ganymede: moons.ganymede, Callisto: moons.callisto };
  const positions: CatalogPosition[] = [];
  for (const id of CATALOG_IDS) {
    let vector: Vector | null;
    let range: { validFrom: string | null; validTo: string | null } = { validFrom: null, validTo: null };
    if (id === 'M31') vector = unit((0 + 42/60 + 44.3/3600)*15, 41 + 16/60 + 9.4/3600);
    else if (id === 'M42') vector = unit((5 + 35/60 + 17/3600)*15, -(5 + 23/60 + 27.99/3600));
    else if (id === 'Ceres' || id === '67P') {
      const source = data[id === 'Ceres' ? 'ceres' : '67p'];
      range = { validFrom: source.startUtc, validTo: source.endUtc };
      const geocentric = interpolate(source.rows, source.startUtc, instantUtc);
      vector = geocentric && [geocentric[0]-obsVector[0], geocentric[1]-obsVector[1], geocentric[2]-obsVector[2]];
    } else {
      const moon = moonVectors[id]!;
      vector = [jupiter.x + moon.x - obsVector[0], jupiter.y + moon.y - obsVector[1], jupiter.z + moon.z - obsVector[2]];
    }
    if (!vector) continue;
    const distance = norm(vector); const [x, y, z] = vector.map((value) => value / distance) as Vector;
    const moonOfJupiter = Boolean(moonVectors[id]);
    const cosSeparation = (vector[0]*jupiterTopocentric[0]+vector[1]*jupiterTopocentric[1]+vector[2]*jupiterTopocentric[2])/(distance*jupiterDistance);
    const angularSeparation = Math.acos(Math.max(-1,Math.min(1,cosSeparation)));
    const jupiterAngularRadius = Math.atan(71492/(jupiterDistance*149_597_870.7));
    const occultedByJupiter = moonOfJupiter && distance > jupiterDistance && angularSeparation < jupiterAngularRadius;
    const north = matrix[0]![0]! * x + matrix[1]![0]! * y + matrix[2]![0]! * z;
    const west = matrix[0]![1]! * x + matrix[1]![1]! * y + matrix[2]![1]! * z;
    const up = matrix[0]![2]! * x + matrix[1]![2]! * y + matrix[2]![2]! * z;
    const geometricAltitude = Math.asin(Math.max(-1, Math.min(1, up))) * 180 / Math.PI;
    positions.push({ id, ...CATALOG[id], azimuthDeg: (Math.atan2(-west, north) * 180/Math.PI + 360)%360,
      altitudeDeg: geometricAltitude + (refraction ? Refraction('normal', geometricAltitude) : 0),
      distanceAu: id === 'M31' || id === 'M42' ? null : distance, occultedByJupiter, ...range });
  }
  return positions;
}
