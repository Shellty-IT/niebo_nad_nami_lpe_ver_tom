import { calculateSnapshot, type ObservationSnapshot } from './ephemeris';
import { parseObservation, type Observation } from '../domain/probe';
import type { EphemerisResponse, EphemerisRequest } from '../workers/protocol';

interface Pending {
  request: EphemerisRequest;
  resolve(snapshot: ObservationSnapshot | null): void;
  reject(error: Error): void;
}

export class EphemerisClient {
  private worker: Worker | undefined;
  private pending: Pending | undefined;
  private revision = 0;
  private busy = false;
  private disposed = false;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private watchdog: ReturnType<typeof setTimeout> | undefined;
  constructor(createWorker: () => Worker | undefined) {
    try { this.worker = createWorker(); } catch { /* CSP lub brak API: wariant lokalny. */ }
    if (this.worker) {
      this.worker.onmessage = ({ data }: MessageEvent<EphemerisResponse>) => {
        if (this.disposed) return;
        clearTimeout(this.watchdog);
        this.busy = false;
        const pending = this.pending;
        if (!pending) return;
        if (data.revision !== pending.request.revision) { this.dispatch(); return; }
        this.pending = undefined;
        if ('error' in data) pending.reject(new Error(data.error));
        else pending.resolve(data.snapshot);
      };
      this.worker.onerror = (event) => { event.preventDefault(); this.useFallback(); };
      this.worker.onmessageerror = () => this.useFallback();
    }
  }
  getMode(): 'worker' | 'main-thread' { return this.worker ? 'worker' : 'main-thread'; }
  calculate(observation: Observation): Promise<ObservationSnapshot | null> {
    if (this.disposed) return Promise.reject(new Error('disposed'));
    const parsed = parseObservation(observation);
    this.pending?.resolve(null);
    return new Promise((resolve, reject) => {
      this.pending = { request: { revision: ++this.revision, observation: parsed }, resolve, reject };
      this.dispatch();
    });
  }
  private dispatch() {
    if (!this.pending || this.busy || this.disposed) return;
    if (this.worker) {
      this.busy = true;
      this.watchdog = setTimeout(() => this.useFallback(), 5000);
      try { this.worker.postMessage(this.pending.request); }
      catch { this.useFallback(); }
    } else {
      clearTimeout(this.timer);
      // Wariant bez Workera liczy jedną próbkę asynchronicznie. Wyszukiwania
      // zdarzeń będą wymagały osobnego porcjowania, zanim trafią do klienta.
      this.timer = setTimeout(() => {
        const pending = this.pending;
        if (!pending || this.disposed) return;
        this.pending = undefined;
        try { pending.resolve(calculateSnapshot(pending.request.observation)); }
        catch (error) { pending.reject(error instanceof Error ? error : new Error('calculation-failed')); }
      }, 0);
    }
  }
  private useFallback() {
    if (this.disposed) return;
    this.stopWorker();
    this.dispatch();
  }
  private stopWorker() {
    if (this.worker) {
      this.worker.onmessage = null;
      this.worker.onerror = null;
      this.worker.onmessageerror = null;
      this.worker.terminate();
      this.worker = undefined;
    }
    this.busy = false;
    clearTimeout(this.watchdog);
  }
  dispose() {
    this.disposed = true;
    this.stopWorker();
    clearTimeout(this.timer);
    this.pending?.resolve(null);
    this.pending = undefined;
  }
}
