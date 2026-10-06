import { expect, it } from 'vitest';
import defaults from '../../.generated/probe.json';
import createEngine from '../../src/hosts/zpe/entry';
import { initialState, parseConfig } from '../../src/domain/probe';
import type { ZpeApi } from '../../src/hosts/zpe/api';

it('buforuje stan przed init i blokadę podczas oczekiwania na CSS; destroy anuluje montaż', async () => {
  let resolveCss!: () => void;
  const api: ZpeApi = {
    enginePath: (path) => path, dataPath: (path) => path,
    loadCss: () => new Promise<void>((resolve) => { resolveCss = resolve; }),
    triggerStateSave: () => Promise.resolve(), requestFullscreen: () => Promise.resolve(),
  };
  const engine = createEngine();
  const state = initialState(parseConfig(defaults));
  state.observation.objectId = 'Mars';
  engine.setState(state);
  engine.setStateFrozen(true);
  const init = engine.init({} as HTMLElement, api, { data: defaults, contrastMode: false });
  expect(engine.getState()?.observation.objectId).toBe('Mars');
  state.observation.objectId = 'Sun';
  engine.setState(state);
  expect(engine.getState()?.observation.objectId).toBe('Sun');
  engine.destroy();
  resolveCss();
  await init; // Próba montażu po destroy rzuciłaby błąd w środowisku bez DOM.
  expect(engine.getState()).toBe(null);
});
