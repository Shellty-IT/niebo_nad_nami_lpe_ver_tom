import type { HostAdapter } from '../host-adapter';

export class LocalHostAdapter implements HostAdapter {
  constructor(private readonly save: () => void | Promise<void>) {}
  resolveAsset(path: string, _scope: 'engine' | 'lesson') { return new URL(path, document.baseURI).href; }
  loadStyles(_path: string) { return Promise.resolve(); } // CSS dołączony przez Vite.
  notifyStateChanged() { return Promise.resolve().then(() => this.save()); }
  requestFullscreen(container: HTMLElement) {
    return Promise.resolve().then(() => container.requestFullscreen());
  }
  getEnvironment() { return { kind: 'local' as const, contrastMode: false as const }; }
  createEphemerisWorker() {
    return new Worker(new URL('../../workers/ephemeris.worker.ts', import.meta.url), { type: 'module' });
  }
  dispose() {}
}
