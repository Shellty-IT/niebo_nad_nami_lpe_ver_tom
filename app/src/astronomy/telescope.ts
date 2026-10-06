export type Instrument = 'refractor' | 'reflector' | 'binoculars';
export interface TelescopeInput {
  instrument: Instrument;
  focalLengthMm: number;
  apertureMm: number;
  eyepieceFocalMm: number;
  apparentFieldDeg: number;
}
export interface TelescopeReading {
  magnification: number;
  trueFieldDeg: number;
  exitPupilMm: number;
  diffractionLimitArcsec: number;
}

export function telescopeReading(input: TelescopeInput): TelescopeReading {
  const { focalLengthMm, apertureMm, eyepieceFocalMm, apparentFieldDeg } = input;
  if (![focalLengthMm, apertureMm, eyepieceFocalMm, apparentFieldDeg].every(Number.isFinite) ||
      focalLengthMm <= 0 || apertureMm <= 0 || eyepieceFocalMm <= 0 || apparentFieldDeg <= 0 || apparentFieldDeg > 120) {
    throw new Error('invalid-telescope');
  }
  const magnification = focalLengthMm / eyepieceFocalMm;
  return { magnification, trueFieldDeg: apparentFieldDeg / magnification,
    exitPupilMm: apertureMm / magnification, diffractionLimitArcsec: 116 / apertureMm };
}

export function exposureSignalRatio(seconds: number, baseSeconds: number): number {
  if (!Number.isFinite(seconds) || !Number.isFinite(baseSeconds) || seconds <= 0 || baseSeconds <= 0) throw new Error('invalid-exposure');
  return seconds / baseSeconds;
}
