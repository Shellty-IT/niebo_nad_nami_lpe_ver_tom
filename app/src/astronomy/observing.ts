import { Body, Horizon, Illumination, Observer, SearchGlobalSolarEclipse, SearchLocalSolarEclipse,
  SearchLunarEclipse, SearchMoonQuarter, NextMoonQuarter, SearchRiseSet, SearchHourAngle, MoonPhase, Equator } from 'astronomy-engine';
import type { ObserverLocation } from '../domain/probe';

const DAY_MS = 86_400_000;
function observerAt(location: ObserverLocation) {
  return new Observer(location.latitudeDeg, location.longitudeDeg, location.heightM);
}
function withinDay(instant: Date, day: string) { return instant.toISOString().slice(0, 10) === day; }

export interface SolarDay {
  date: string;
  riseUtc: string | null;
  setUtc: string | null;
  transitUtc: string | null;
  transitAltitudeDeg: number | null;
}

export function solarDay(date: string, location: ObserverLocation): SolarDay {
  const start = new Date(`${date}T00:00:00.000Z`);
  if (!Number.isFinite(start.getTime()) || start.toISOString().slice(0, 10) !== date) throw new Error('invalid-day');
  const observer = observerAt(location);
  const rise = SearchRiseSet(Body.Sun, observer, +1, start, 1);
  const set = SearchRiseSet(Body.Sun, observer, -1, start, 1);
  const transit = SearchHourAngle(Body.Sun, observer, 0, start);
  return { date, riseUtc: rise && withinDay(rise.date, date) ? rise.date.toISOString() : null,
    setUtc: set && withinDay(set.date, date) ? set.date.toISOString() : null,
    transitUtc: withinDay(transit.time.date, date) ? transit.time.date.toISOString() : null,
    transitAltitudeDeg: withinDay(transit.time.date, date) ? transit.hor.altitude : null };
}

function horizontalVector(azimuthDeg: number, altitudeDeg: number): [number, number, number] {
  const az = azimuthDeg * Math.PI/180; const alt = altitudeDeg * Math.PI/180;
  return [Math.cos(alt)*Math.sin(az), Math.cos(alt)*Math.cos(az), Math.sin(alt)];
}
export interface MoonPhaseReading { instantUtc: string; elongationDeg: number; litFraction: number;
  phaseAngleDeg: number; brightLimbAngleDeg: number; moonAltitudeDeg: number }
export function moonPhaseReading(instantUtc: string, location: ObserverLocation): MoonPhaseReading {
  const time = new Date(instantUtc);
  const observer = observerAt(location);
  const moon = Equator(Body.Moon, time, observer, true, true);
  const sun = Equator(Body.Sun, time, observer, true, true);
  const moonRa = moon.ra * Math.PI / 12; const sunRa = sun.ra * Math.PI / 12;
  const moonDec = moon.dec * Math.PI / 180; const sunDec = sun.dec * Math.PI / 180;
  const dot = Math.sin(moonDec) * Math.sin(sunDec) + Math.cos(moonDec) * Math.cos(sunDec) * Math.cos(moonRa - sunRa);
  const elongationDeg = Math.acos(Math.max(-1, Math.min(1, dot))) * 180 / Math.PI;
  const moonHor = Horizon(time, observer, moon.ra, moon.dec);
  const sunHor = Horizon(time, observer, sun.ra, sun.dec);
  const m = horizontalVector(moonHor.azimuth, moonHor.altitude); const s = horizontalVector(sunHor.azimuth, sunHor.altitude);
  const dotMs = m[0]*s[0]+m[1]*s[1]+m[2]*s[2];
  const projected = [s[0]-dotMs*m[0], s[1]-dotMs*m[1], s[2]-dotMs*m[2]] as const;
  const up = [-m[2]*m[0], -m[2]*m[1], 1-m[2]*m[2]] as const;
  const right = [m[1], -m[0], 0] as const;
  const towardUp = projected[0]*up[0]+projected[1]*up[1]+projected[2]*up[2];
  const towardRight = projected[0]*right[0]+projected[1]*right[1];
  return { instantUtc, elongationDeg, litFraction: Illumination(Body.Moon, time).phase_fraction,
    phaseAngleDeg: MoonPhase(time), brightLimbAngleDeg: (Math.atan2(towardRight, towardUp)*180/Math.PI+360)%360,
    moonAltitudeDeg: moonHor.altitude };
}

export function sunPlanetSeparation(instantUtc: string, location: ObserverLocation, body: Body): number {
  if (body === Body.Sun || body === Body.Earth || body === Body.Moon) throw new Error('invalid-planet');
  const time = new Date(instantUtc); const observer = observerAt(location);
  const planet = Equator(body, time, observer, true, true);
  const sun = Equator(Body.Sun, time, observer, true, true);
  const ra = (planet.ra - sun.ra) * Math.PI / 12;
  const dec = planet.dec * Math.PI / 180; const sunDec = sun.dec * Math.PI / 180;
  const dot = Math.sin(dec) * Math.sin(sunDec) + Math.cos(dec) * Math.cos(sunDec) * Math.cos(ra);
  return Math.acos(Math.max(-1, Math.min(1, dot))) * 180 / Math.PI;
}

export function nextMoonQuarters(instantUtc: string) {
  const result: Array<{ instantUtc: string; quarter: number }> = [];
  let quarter = SearchMoonQuarter(new Date(instantUtc));
  for (let i = 0; i < 4; i++) {
    result.push({ instantUtc: quarter.time.date.toISOString(), quarter: quarter.quarter });
    quarter = NextMoonQuarter(quarter);
  }
  return result;
}

export interface EclipseExample {
  kind: 'solar' | 'lunar';
  peakUtc: string;
  type: string;
  localPeakAltitudeDeg: number;
  localSolarCoverage: number | null;
  localEvent: boolean;
  localVisibility: 'none' | 'part' | 'peak';
  contacts: Array<{ label: string; instantUtc: string; altitudeDeg: number }>;
}

function altitudeAt(body: Body, time: Date, observer: Observer) {
  const eq = Equator(body, time, observer, true, true);
  return Horizon(time, observer, eq.ra, eq.dec, 'normal').altitude;
}
function visibility(contacts: EclipseExample['contacts'], body: Body, observer: Observer, peakAltitude: number): EclipseExample['localVisibility'] {
  if (contacts.length === 0) return 'none';
  if (peakAltitude > 0) return 'peak';
  const start = new Date(contacts[0]!.instantUtc).getTime();
  const end = new Date(contacts[contacts.length-1]!.instantUtc).getTime();
  for (let stamp = start; stamp <= end; stamp += 10*60_000) if (altitudeAt(body, new Date(stamp), observer) > 0) return 'part';
  return altitudeAt(body, new Date(end), observer) > 0 ? 'part' : 'none';
}

export function eclipseExample(kind: 'solar' | 'lunar', location: ObserverLocation): EclipseExample {
  const observer = observerAt(location);
  if (kind === 'solar') {
    const global = SearchGlobalSolarEclipse(new Date('2024-04-01T00:00:00.000Z'));
    const local = SearchLocalSolarEclipse(new Date('2024-04-01T00:00:00.000Z'), observer);
    const sameEvent = Math.abs(local.peak.time.date.getTime() - global.peak.date.getTime()) < DAY_MS;
    const sun = Equator(Body.Sun, global.peak.date, observer, true, true);
    const altitude = Horizon(global.peak.date, observer, sun.ra, sun.dec).altitude;
    const contacts = sameEvent ? [
      ['Początek częściowy', local.partial_begin], ['Początek całkowity/obrączkowy', local.total_begin],
      ['Maksimum lokalne', local.peak], ['Koniec całkowity/obrączkowy', local.total_end],
      ['Koniec częściowy', local.partial_end],
    ].filter((item) => item[1]).map(([label, event]) => ({ label: label as string,
      instantUtc: (event as typeof local.peak).time.date.toISOString(), altitudeDeg: (event as typeof local.peak).altitude })) : [];
    const localVisibility = sameEvent ? visibility(contacts, Body.Sun, observer, local.peak.altitude) : 'none';
    return { kind, peakUtc: global.peak.date.toISOString(), type: global.kind,
      localPeakAltitudeDeg: sameEvent ? local.peak.altitude : altitude,
      localSolarCoverage: sameEvent ? local.obscuration : null,
      localEvent: localVisibility !== 'none', localVisibility, contacts };
  }
  const lunar = SearchLunarEclipse(new Date('2025-03-01T00:00:00.000Z'));
  const moon = Equator(Body.Moon, lunar.peak.date, observer, true, true);
  const altitude = Horizon(lunar.peak.date, observer, moon.ra, moon.dec).altitude;
  const contacts: EclipseExample['contacts'] = [];
  for (const [label, minutes] of [['Początek półcieniowy', -lunar.sd_penum], ['Początek częściowy', -lunar.sd_partial],
    ['Początek całkowity', -lunar.sd_total], ['Maksimum', 0], ['Koniec całkowity', lunar.sd_total],
    ['Koniec częściowy', lunar.sd_partial], ['Koniec półcieniowy', lunar.sd_penum]] as const) {
    if (minutes === 0 && label !== 'Maksimum') continue;
    const instant = new Date(lunar.peak.date.getTime() + minutes*60_000);
    contacts.push({ label, instantUtc: instant.toISOString(), altitudeDeg: altitudeAt(Body.Moon, instant, observer) });
  }
  const localVisibility = visibility(contacts, Body.Moon, observer, altitude);
  return { kind, peakUtc: lunar.peak.date.toISOString(), type: lunar.kind,
    localPeakAltitudeDeg: altitude, localSolarCoverage: null, localEvent: localVisibility !== 'none', localVisibility, contacts };
}

export function meteorStreaks(seed: number): Array<{ angleDeg: number; lengthDeg: number }> {
  if (!Number.isInteger(seed) || seed < 0 || seed > 100) throw new Error('invalid-seed');
  return Array.from({ length: 5 }, (_, index) => ({
    angleDeg: (seed * 37 + index * 73) % 360,
    lengthDeg: 8 + ((seed + index * 11) % 15),
  }));
}
