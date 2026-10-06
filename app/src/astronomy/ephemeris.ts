import { Body, Equator, Horizon, Illumination, Observer } from 'astronomy-engine';
import { parseObservation, type Observation, type ObjectId, type ObserverLocation } from '../domain/probe';

export const VALID_FROM = '1900-01-01T00:00:00.000Z';
export const VALID_TO = '2100-12-31T23:59:59.999Z';
export const BODY_IDS: readonly ObjectId[] = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune'];
// Średnice objętościowe NASA/NSSDC; dla olbrzymów gazowych odpowiadają w przybliżeniu wierzchołkom chmur.
const DIAMETER_KM: Record<ObjectId, number> = { Sun: 1_391_400, Moon: 3475, Mercury: 4879,
  Venus: 12104, Mars: 6792, Jupiter: 142984, Saturn: 120536, Uranus: 51118, Neptune: 49528 };
const AU_KM = 149_597_870.7;
export interface BodyPosition {
  objectId: ObjectId;
  raHours: number;
  decDeg: number;
  azimuthDeg: number;
  altitudeDeg: number;
  distanceAu: number;
  angularDiameterArcmin: number;
  phaseFraction: number | null;
  apparentMagnitude: number | null;
  aboveHorizon: boolean;
}
export interface ObservationSnapshot {
  instantUtc: string;
  observer: ObserverLocation;
  refraction: boolean;
  frame: 'topocentric-equator-of-date';
  azimuthConvention: 'north-through-east';
  validity: { validFrom: string; validTo: string; quality: 'prototype' };
  positions: BodyPosition[];
}

export function calculateSnapshot(input: Observation): ObservationSnapshot {
  const observation = parseObservation(input);
  if (observation.instantUtc < VALID_FROM || observation.instantUtc > VALID_TO) throw new Error('outside-validity');
  const time = new Date(observation.instantUtc);
  const location = observation.observer;
  const observer = new Observer(location.latitudeDeg, location.longitudeDeg, location.heightM);
  const positions = BODY_IDS.map((objectId): BodyPosition => {
    const equatorial = Equator(Body[objectId], time, observer, true, true);
    const horizontal = Horizon(time, observer, equatorial.ra, equatorial.dec, observation.refraction ? 'normal' : undefined);
    const illumination = objectId === 'Sun' ? null : Illumination(Body[objectId], time);
    return {
      objectId, raHours: equatorial.ra, decDeg: equatorial.dec,
      azimuthDeg: horizontal.azimuth, altitudeDeg: horizontal.altitude,
      distanceAu: equatorial.dist,
      angularDiameterArcmin: 2 * Math.atan(DIAMETER_KM[objectId] / 2 / (equatorial.dist * AU_KM)) * 180 / Math.PI * 60,
      phaseFraction: illumination?.phase_fraction ?? null,
      apparentMagnitude: illumination?.mag ?? null,
      aboveHorizon: horizontal.altitude >= 0,
    };
  });
  return {
    instantUtc: observation.instantUtc, observer: { ...location }, refraction: observation.refraction,
    frame: 'topocentric-equator-of-date', azimuthConvention: 'north-through-east',
    validity: { validFrom: VALID_FROM, validTo: VALID_TO, quality: 'prototype' }, positions,
  };
}
