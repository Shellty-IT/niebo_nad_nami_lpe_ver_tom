import defaults from '../../../.generated/probe.json';
import { createProbeStore } from '../../app/probe-store';
import { initialState, parseConfig, type ProbeConfig } from '../../domain/probe';
import { mountProbe } from '../../ui/probe-view';
import { mountLessonEditor } from '../../ui/lesson-editor';
import { pl } from '../../i18n/pl';
import type { ZpeEditorApi } from './api';
import { ZpeHostAdapter } from './zpe-host';

export default function createEditor() {
  let config: ProbeConfig = parseConfig(defaults);
  const store = createProbeStore(config);
  let view: { destroy(): void } | undefined;
  let lessonEditor: ReturnType<typeof mountLessonEditor> | undefined;
  let host: ZpeHostAdapter | undefined;
  let generation = 0;
  function destroyTab() {
    generation++;
    view?.destroy();
    lessonEditor = undefined;
    host?.dispose();
    view = undefined;
    host = undefined;
  }
  return {
    init(api: ZpeEditorApi) {
      api.addEditorTab('initial-observation', pl.editor);
      api.addEditorTab('lesson-settings', 'Konfiguracja lekcji');
    },
    async initTab(tab: string, container: HTMLElement, api: ZpeEditorApi) {
      if (tab !== 'initial-observation' && tab !== 'lesson-settings') throw new Error('Unknown editor tab');
      destroyTab();
      const current = generation;
      const nextHost = new ZpeHostAdapter({
        enginePath: (path) => api.enginePath(path),
        dataPath: (path) => api.dataPath(path),
        loadCss: (path) => api.loadCss(path),
        triggerStateSave: () => api.triggerStateSave(),
        requestFullscreen: () => Promise.reject(new Error('Not part of editor API')),
      }, false);
      host = nextHost;
      await nextHost.loadStyles('entry.css');
      if (current === generation) {
        if (tab === 'lesson-settings') {
          lessonEditor = mountLessonEditor(container, config, (value) => {
            config = value;
            store.restore(initialState(config));
            void nextHost.notifyStateChanged().catch(() => {});
          });
          view = lessonEditor;
        } else view = mountProbe(container, store, nextHost, true);
      }
    },
    setState(value: unknown) {
      config = parseConfig(value === null ? defaults : value);
      store.restore(initialState(config));
      lessonEditor?.setConfig(config);
    },
    getState(): ProbeConfig {
      if (lessonEditor) return lessonEditor.getConfig();
      return parseConfig({ ...config, initialObservation: store.getState().observation });
    },
    destroyTab,
    destroy: destroyTab,
  };
}
