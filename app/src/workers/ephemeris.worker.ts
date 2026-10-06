import { calculateSnapshot } from '../astronomy/ephemeris';
import type { EphemerisRequest, EphemerisResponse } from './protocol';

const scope = self as unknown as {
  onmessage: (event: MessageEvent<EphemerisRequest>) => void;
  postMessage(message: EphemerisResponse): void;
};
scope.onmessage = ({ data }) => {
  if (!data || !Number.isSafeInteger(data.revision)) return;
  try { scope.postMessage({ revision: data.revision, snapshot: calculateSnapshot(data.observation) }); }
  catch (error) { scope.postMessage({ revision: data.revision, error: error instanceof Error ? error.message : 'calculation-failed' }); }
};
