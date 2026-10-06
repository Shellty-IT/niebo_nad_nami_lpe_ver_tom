import type createEngine from '../../src/hosts/zpe/entry';
import type createEditor from '../../src/hosts/zpe/editor';
import type { ZpeApi, ZpeEditorApi } from '../../src/hosts/zpe/api';
import type { ProbeConfig } from '../../src/domain/probe';

type Engine = ReturnType<typeof createEngine>;
type Editor = ReturnType<typeof createEditor>;
type Factory = typeof createEngine | typeof createEditor;
declare global {
  interface Window {
    define?: (dependencies: string[] | (() => Factory), factory?: () => Factory) => void;
    probeHarness: {
      first: Engine; second: Engine; editor: Editor; config: ProbeConfig;
      factory: typeof createEngine; apiFor: (index: number) => ZpeApi; editorApi: ZpeEditorApi; full?: Engine;
      saves: number[]; fullscreen: number[]; cssPaths: string[]; tabs: string[];
      globalsAdded: string[];
    };
  }
}

// Testowy loader AMD należy do hosta, nigdy nie trafia do paczki silnika.
async function loadAmd<T extends Factory>(path: string): Promise<T> {
  let result: Factory | undefined;
  window.define = (dependencies, factory) => {
    if (typeof dependencies === 'function') { result = dependencies(); return; }
    if (dependencies.length || !factory) throw new Error('Unexpected external AMD dependency');
    result = factory();
  };
  const script = document.createElement('script');
  script.src = path;
  try {
    await new Promise<void>((resolve, reject) => {
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Cannot load ${path}`));
      document.head.append(script);
    });
    if (!result) throw new Error('AMD did not export a factory');
    return result as T;
  } finally { script.remove(); delete window.define; }
}
const saves = [0, 0, 0];
const fullscreen = [0, 0];
const cssPaths: string[] = [];
const tabs: string[] = [];
function apiFor(index: number): ZpeApi {
  return {
    enginePath: (path) => `/dist/zpe-engine/${path}`,
    dataPath: (path) => `/test-lesson/${path}`,
    async loadCss(path) {
      cssPaths.push(path);
      await new Promise<void>((resolve, reject) => {
        const link = document.createElement('link');
        link.rel = 'stylesheet'; link.href = path;
        link.onload = () => resolve(); link.onerror = () => reject(new Error('CSS failed'));
        document.head.append(link);
      });
    },
    async triggerStateSave() { saves[index] = (saves[index] ?? 0) + 1; },
    async requestFullscreen() { fullscreen[index] = (fullscreen[index] ?? 0) + 1; },
  };
}
const before = new Set(Object.getOwnPropertyNames(window));
const factory = await loadAmd<typeof createEngine>('/dist/zpe-engine/entry.js');
const editorFactory = await loadAmd<typeof createEditor>('/dist/zpe-engine/editor.js');
const manifest = await (await fetch('/dist/zpe-engine/engine.json')).json() as { editor: { defaultData: ProbeConfig } };
const config = manifest.editor.defaultData;
const legacyConfig: ProbeConfig = { ...config }; delete legacyConfig.lesson;
const first = factory();
const second = factory();
await Promise.all([
  first.init(document.getElementById('first')!, apiFor(0), { data: legacyConfig, contrastMode: false }),
  second.init(document.getElementById('second')!, apiFor(1), { data: legacyConfig, contrastMode: 'yellowOnBlack' }),
]);
const editor = editorFactory();
const editorApi: ZpeEditorApi = {
  ...apiFor(2),
  addEditorTab(id) { tabs.push(id); return editorApi; },
};
editor.init(editorApi);
editor.setState(null);
await editor.initTab('initial-observation', document.getElementById('editor')!, editorApi);
const globalsAdded = Object.getOwnPropertyNames(window).filter((key) => !before.has(key));
window.probeHarness = { first, second, editor, config, factory, apiFor, editorApi, saves, fullscreen, cssPaths, tabs, globalsAdded };
