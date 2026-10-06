import { AstroTime, CombineRotation, Observer, RotateVector, Rotation_ECT_EQD, Rotation_EQD_HOR, Vector } from 'astronomy-engine';
import type { ObserverLocation } from '../domain/probe';

export interface SkyPoint { azimuthDeg: number; altitudeDeg: number }
const radians = Math.PI / 180;

function fromHorizonVector(x: number, y: number, z: number): SkyPoint {
  return { azimuthDeg: ((Math.atan2(-y, x) / radians) + 360) % 360,
    altitudeDeg: Math.asin(Math.max(-1, Math.min(1, z))) / radians };
}

export function referenceCircles(instantUtc: string, location: ObserverLocation) {
  const time = new AstroTime(new Date(instantUtc));
  const observer = new Observer(location.latitudeDeg, location.longitudeDeg, location.heightM);
  const equatorRotation = Rotation_EQD_HOR(time, observer);
  const eclipticRotation = CombineRotation(Rotation_ECT_EQD(time), equatorRotation);
  function circle(rotation: typeof equatorRotation) {
    const points: SkyPoint[] = [];
    for (let longitudeDeg = 0; longitudeDeg <= 360; longitudeDeg += 2) {
      const angle = longitudeDeg * radians;
      const vector = RotateVector(rotation, new Vector(Math.cos(angle), Math.sin(angle), 0, time));
      points.push(fromHorizonVector(vector.x, vector.y, vector.z));
    }
    return points;
  }
  const north = RotateVector(equatorRotation, new Vector(0, 0, 1, time));
  const south = RotateVector(equatorRotation, new Vector(0, 0, -1, time));
  return { equator: circle(equatorRotation), ecliptic: circle(eclipticRotation),
    northPole: fromHorizonVector(north.x, north.y, north.z), southPole: fromHorizonVector(south.x, south.y, south.z) };
}

export function equatorialGrid(instantUtc: string, location: ObserverLocation): SkyPoint[][] {
  const time = new AstroTime(new Date(instantUtc));
  const rotation = Rotation_EQD_HOR(time, new Observer(location.latitudeDeg, location.longitudeDeg, location.heightM));
  const point = (raDeg: number, decDeg: number) => {
    const ra = raDeg * radians; const dec = decDeg * radians;
    const vector = RotateVector(rotation, new Vector(Math.cos(dec) * Math.cos(ra), Math.cos(dec) * Math.sin(ra), Math.sin(dec), time));
    return fromHorizonVector(vector.x, vector.y, vector.z);
  };
  const circles: SkyPoint[][] = [];
  for (const dec of [-60, -30, 0, 30, 60]) {
    const path: SkyPoint[] = []; for (let ra = 0; ra <= 360; ra += 3) path.push(point(ra, dec)); circles.push(path);
  }
  for (let ra = 0; ra < 360; ra += 45) {
    const path: SkyPoint[] = []; for (let dec = -90; dec <= 90; dec += 3) path.push(point(ra, dec)); circles.push(path);
  }
  return circles;
}
