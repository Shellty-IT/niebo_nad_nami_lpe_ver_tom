export interface OrbitPoint { xAu: number; yAu: number; radiusAu: number; eccentricAnomalyRad: number }

export function solveKepler(meanAnomalyRad: number, eccentricity: number): number {
  if (!Number.isFinite(meanAnomalyRad) || !Number.isFinite(eccentricity) || eccentricity < 0 || eccentricity >= 1) throw new Error('invalid-orbit');
  let anomaly = meanAnomalyRad;
  for (let step = 0; step < 20; step++) {
    const correction = (anomaly - eccentricity * Math.sin(anomaly) - meanAnomalyRad) / (1 - eccentricity * Math.cos(anomaly));
    anomaly -= correction;
    if (Math.abs(correction) < 1e-12) break;
  }
  return anomaly;
}

export function orbitPoint(semiMajorAu: number, eccentricity: number, meanAnomalyRad: number): OrbitPoint {
  if (!Number.isFinite(semiMajorAu) || semiMajorAu <= 0) throw new Error('invalid-orbit');
  const anomaly = solveKepler(meanAnomalyRad, eccentricity);
  const minor = semiMajorAu * Math.sqrt(1 - eccentricity * eccentricity);
  const xAu = semiMajorAu * (Math.cos(anomaly) - eccentricity);
  const yAu = minor * Math.sin(anomaly);
  return { xAu, yAu, radiusAu: Math.hypot(xAu, yAu), eccentricAnomalyRad: anomaly };
}

export function orbitalPeriodYears(semiMajorAu: number): number {
  if (!Number.isFinite(semiMajorAu) || semiMajorAu <= 0) throw new Error('invalid-orbit');
  return Math.sqrt(semiMajorAu ** 3);
}

export function sweptAreaAu2(semiMajorAu: number, eccentricity: number, meanAnomalyStart: number, meanAnomalyEnd: number): number {
  if (meanAnomalyEnd < meanAnomalyStart) throw new Error('invalid-interval');
  solveKepler(meanAnomalyStart, eccentricity);
  return 0.5 * semiMajorAu ** 2 * Math.sqrt(1 - eccentricity ** 2) * (meanAnomalyEnd - meanAnomalyStart);
}
