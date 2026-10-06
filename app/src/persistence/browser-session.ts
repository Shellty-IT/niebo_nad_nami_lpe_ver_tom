import type { ProbeStore } from '../app/probe-store';
import { LocalSession, parseSessionImport } from './local-session';

const DATABASE = 'nnb-local-session';
const STORE = 'snapshots';
const KEY = 'current';
const PREFERENCE = 'nnb:durable-session:v1';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => { request.result.createObjectStore(STORE); };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('indexeddb-open'));
    request.onblocked = () => reject(new Error('indexeddb-blocked'));
  });
}

async function databaseOperation<T>(mode: IDBTransactionMode, operation: (store: IDBObjectStore, done: (value: T) => void) => void): Promise<T> {
  const db = await openDatabase();
  try {
    return await new Promise<T>((resolve, reject) => {
      const transaction = db.transaction(STORE, mode);
      let result: T;
      transaction.oncomplete = () => resolve(result);
      transaction.onerror = () => reject(transaction.error ?? new Error('indexeddb-transaction'));
      transaction.onabort = () => reject(transaction.error ?? new Error('indexeddb-abort'));
      operation(transaction.objectStore(STORE), (value) => { result = value; });
    });
  } finally { db.close(); }
}

const readSnapshot = () => databaseOperation<string | undefined>('readonly', (store, done) => {
  const request = store.get(KEY);
  request.onsuccess = () => done(request.result as string | undefined);
});
const writeSnapshot = (value: string) => databaseOperation<void>('readwrite', (store, done) => {
  store.put(value, KEY); done();
});
const clearSnapshot = () => databaseOperation<void>('readwrite', (store, done) => {
  store.delete(KEY); done();
});

export class BrowserSession {
  private durable: boolean;
  private corrupt = false;
  private pending: Promise<void> = Promise.resolve();
  constructor(private readonly store: ProbeStore, private readonly session: LocalSession,
    private readonly preferences: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>) {
    try { this.durable = preferences.getItem(PREFERENCE) === 'true'; }
    catch { this.durable = false; }
  }
  isDurable() { return this.durable; }
  async load(): Promise<boolean> {
    try {
      if (!this.durable) { const loaded = this.session.load(); this.corrupt = !loaded; return loaded; }
      const raw = await readSnapshot();
      if (raw !== undefined) this.store.restore(parseSessionImport(raw));
      return true;
    } catch { this.corrupt = true; return false; }
  }
  private enqueue(action: () => Promise<void>): Promise<void> {
    const result = this.pending.then(action);
    this.pending = result.catch(() => {});
    return result;
  }
  save(): Promise<void> {
    const snapshot = JSON.stringify(this.store.getState());
    return this.enqueue(async () => {
      if (this.corrupt) throw new Error('corrupt-session');
      if (this.durable) await writeSnapshot(snapshot);
      else this.session.save();
    });
  }
  exportJson() { return this.session.exportJson(); }
  importJson(raw: string): Promise<void> {
    const parsed = parseSessionImport(raw);
    return this.enqueue(async () => {
      if (this.durable) { await writeSnapshot(JSON.stringify(parsed)); this.store.restore(parsed); }
      else this.session.importJson(raw);
      this.corrupt = false;
    });
  }
  reset(): Promise<void> {
    return this.enqueue(async () => {
      if (this.durable) { await clearSnapshot(); this.store.restore(null); }
      else this.session.reset();
      this.corrupt = false;
    });
  }
  setDurable(value: boolean): Promise<void> {
    return this.enqueue(async () => {
      if (value === this.durable) return;
      if (value) {
        if (this.corrupt) throw new Error('corrupt-session');
        await writeSnapshot(JSON.stringify(this.store.getState()));
        this.preferences.setItem(PREFERENCE, 'true');
        this.durable = true;
        try { this.session.clearStored(); } catch { /* Odtwarzanie używa już wyłącznie IndexedDB. */ }
      } else {
        this.session.save();
        await clearSnapshot();
        this.preferences.removeItem(PREFERENCE);
        this.durable = false;
      }
      this.corrupt = false;
    });
  }
}
