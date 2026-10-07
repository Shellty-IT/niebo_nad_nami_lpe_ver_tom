import { createProbeStore, type ProbeStore } from '../../app/probe-store';
import { parseConfig, parseState, type ProbeState } from '../../domain/probe';
import { mountProbe } from '../../ui/probe-view';
import { mountLocalShell } from '../../ui/local-shell';
import { lessonSettings } from '../../domain/lesson-settings';
import type { ZpeApi, ZpeOptions } from './api';
import { ZpeHostAdapter } from './zpe-host';

export default function createEngine() {
  let store: ProbeStore | undefined;
  let view: { destroy(): void; refresh?(): void } | undefined;
  let host: ZpeHostAdapter | undefined;
  let pendingState: ProbeState | null | undefined;
  let frozen = false;
  let generation = 0;

  return {
    async init(container: HTMLElement, api: ZpeApi, options: ZpeOptions) {
      if (store) throw new Error('Engine already initialized');
      const config = parseConfig(options.data);
      const current = ++generation;
      const nextStore = createProbeStore(config);
      if (config.lesson) {
        const settings = lessonSettings(config);
        nextStore.setLevel(settings.defaultLevel);
        nextStore.navigate(settings.sceneOrder[0]!);
      }
      if (pendingState !== undefined) nextStore.restore(pendingState);
      nextStore.setFrozen(frozen);
      store = nextStore;
      const nextHost = new ZpeHostAdapter(api, options.contrastMode);
      host = nextHost;
      try {
        await nextHost.loadStyles('entry.css');
        if (current !== generation) return;
        if (config.lesson) {
          const shellSession = {
            exportJson: () => JSON.stringify(nextStore.getState()),
            importJson: async (raw: string) => { nextStore.restore(parseState(JSON.parse(raw) as unknown)); },
            reset: async () => { nextStore.restore(null); },
            isDurable: () => true,
            setDurable: async (_value: boolean) => {},
          };
          view = mountLocalShell(container, nextStore, nextHost, shellSession, config);
        } else view = mountProbe(container, nextStore, nextHost);
      } catch (error) {
        if (current === generation) { store = undefined; host = undefined; }
        nextHost.dispose();
        throw error;
      }
    },
    getState(): ProbeState | null {
      return store ? store.getState() : pendingState ? parseState(pendingState) : null;
    },
    setState(value: unknown) {
      const parsed = value === null ? null : parseState(value);
      if (store) { store.restore(parsed); view?.refresh?.(); }
      pendingState = parsed;
    },
    setStateFrozen(value: boolean) {
      frozen = value;
      store?.setFrozen(value);
    },
    destroy(_container?: Element) {
      generation++;
      view?.destroy();
      host?.dispose();
      view = undefined;
      host = undefined;
      store = undefined;
      pendingState = undefined;
      frozen = false;
    },
  };
}
