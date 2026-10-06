const radians = Math.PI / 180;

export function angularSeparationDeg(azimuthA: number, altitudeA: number, azimuthB: number, altitudeB: number): number {
  const a = altitudeA * radians;
  const b = altitudeB * radians;
  const delta = (azimuthA - azimuthB) * radians;
  const cosine = Math.sin(a) * Math.sin(b) + Math.cos(a) * Math.cos(b) * Math.cos(delta);
  return Math.acos(Math.max(-1, Math.min(1, cosine))) / radians;
}
