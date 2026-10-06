import type { ProbeStore } from '../app/probe-store';
import { parseState, type ProbeState } from '../domain/probe';

export const MAX_SESSION_BYTES = 1_000_000;
export function parseSessionImport(raw: string): ProbeState {
  if (new TextEncoder().encode(raw).byteLength > MAX_SESSION_BYTES) throw new Error('import-too-large');
  return parseState(JSON.parse(raw) as unknown);
}

export class LocalSession {
  private readonly key = 'nnb:p0-host-probe:0.1.0';
  private corrupt = false;
  constructor(private readonly store: ProbeStore, private readonly storage: () => Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>) {}
  load(): boolean {
    try {
      const raw = this.storage().getItem(this.key);
      if (raw !== null) this.store.restore(parseSessionImport(raw));
      return true;
    } catch { this.corrupt = true; return false; }
  }
  save() {
    if (this.corrupt) throw new Error('corrupt-session');
    this.storage().setItem(this.key, JSON.stringify(this.store.getState()));
  }
  exportJson(): string { return JSON.stringify(this.store.getState(), null, 2) + '\n'; }
  clearStored() { this.storage().removeItem(this.key); }
  importJson(raw: string) {
    const parsed = parseSessionImport(raw);
    // Walidacja i zapis przed zmianą pamięci aplikacji: błędny plik lub odmowa zapisu
    // pozostawia poprzedni stan bez zmian.
    this.storage().setItem(this.key, JSON.stringify(parsed));
    this.store.restore(parsed);
    this.corrupt = false;
  }
  reset() {
    this.storage().removeItem(this.key);
    this.store.restore(null);
    this.corrupt = false;
  }
}
