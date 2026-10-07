import type { HostAdapter, ContrastMode } from '../host-adapter';
import type { ZpeApi } from './api';

export class ZpeHostAdapter implements HostAdapter {
  constructor(private readonly api: ZpeApi, private readonly contrastMode: ContrastMode) {}
  resolveAsset(path: string, scope: 'engine' | 'lesson') {
    return scope === 'engine' ? this.api.enginePath(`dist/${path}`) : this.api.dataPath(path);
  }
  loadStyles(path: string) { return this.api.loadCss(this.resolveAsset(path, 'engine')); }
  notifyStateChanged() { return Promise.resolve().then(() => this.api.triggerStateSave()); }
  requestFullscreen(container: HTMLElement) {
    return Promise.resolve().then(() => this.api.requestFullscreen(container, () => {}));
  }
  getEnvironment() { return { kind: 'zpe' as const, contrastMode: this.contrastMode }; }
  createEphemerisWorker() { return new Worker(this.resolveAsset('ephemeris.worker.js', 'engine')); }
  dispose() {}
}
