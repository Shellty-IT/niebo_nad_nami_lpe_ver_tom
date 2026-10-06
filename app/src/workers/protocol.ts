import type { Observation } from '../domain/probe';
import type { ObservationSnapshot } from '../astronomy/ephemeris';

export interface EphemerisRequest { revision: number; observation: Observation }
export type EphemerisResponse = { revision: number; snapshot: ObservationSnapshot } | { revision: number; error: string };
