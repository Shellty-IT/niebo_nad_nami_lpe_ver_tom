import type { ProbeStore } from '../app/probe-store';
import type { HostAdapter } from '../hosts/host-adapter';
import { applyPreferences, defaultPreferences, PreferenceStorage } from '../accessibility/preferences';
import { mountPreferences } from '../accessibility/preferences-view';
import type { mountProbe } from './probe-view';
import type { mountSphereLesson } from './sphere-lesson';
import type { mountConstellationLesson } from './constellation-lesson';
import type { mountMovementLesson } from './movement-lesson';
import type { mountObservingLesson } from './observing-lesson';
import type { mountInstrumentsLesson } from './instruments-lesson';
import type { mountSummaryLesson } from './summary-lesson';
import type { mountResourcesLesson } from './resources-lesson';
import { mountGlossary } from './glossary';
import { mountLevelIntro } from './level-intro';
import { pl } from '../i18n/pl';
import scenesData from '../../.generated/scenes.json';
import type { SceneId } from '../domain/probe';
import { MAX_SESSION_BYTES } from '../persistence/local-session';
import type { BrowserSession } from '../persistence/browser-session';
import { lessonSettings } from '../domain/lesson-settings';
import type { ProbeConfig } from '../domain/probe';

export function mountLocalShell(container: HTMLElement, store: ProbeStore, host: HostAdapter,
  session: Pick<BrowserSession, 'exportJson' | 'importJson' | 'reset' | 'isDurable' | 'setDurable'>, config: ProbeConfig) {
  const local = host.getEnvironment().kind === 'local';
  const lesson = lessonSettings(config);
  const activeScenes = lesson.sceneOrder.map((id) => scenesData.scenes.find((scene) => scene.id === id)!);
  if (!lesson.levels.includes(store.getState().level)) store.setLevel(lesson.defaultLevel);
  if (!lesson.sceneOrder.includes(store.getState().sceneId)) store.navigate(lesson.sceneOrder[0]!);
  const root = document.createElement('section'); root.className = 'nnb nnb-shell'; root.lang = 'pl';
  root.dataset.host = local ? 'local' : 'zpe';
  const header = document.createElement('header');
  const heading = document.createElement('h1'); heading.textContent = pl.title;
  const stage = document.createElement('p'); stage.textContent = local ? pl.localPreview : pl.zpe; stage.className = 'nnb-stage';
  const status = document.createElement('p'); status.className = 'nnb-shell-status'; status.setAttribute('aria-live', 'polite');
  const navigation = document.createElement('nav'); navigation.setAttribute('aria-label', pl.applicationMenu);
  const levelLabel = document.createElement('label'); levelLabel.className = 'nnb-level'; levelLabel.textContent = pl.level;
  const level = document.createElement('select');
  for (const [id, title] of [['basic', pl.levelBasic], ['extended', pl.levelExtended], ['expert', pl.levelExpert]] as const) {
    if (!lesson.levels.includes(id)) continue;
    const option = document.createElement('option'); option.value = id; option.textContent = title; level.append(option);
  }
  level.value = store.getState().level;
  level.addEventListener('change', () => {
    if (store.setLevel(level.value as 'basic' | 'extended' | 'expert')) saveState();
    root.dataset.level = store.getState().level;
  });
  levelLabel.append(level); root.dataset.level = store.getState().level;
  function button(text: string, action: () => void) {
    const control = document.createElement('button'); control.type = 'button'; control.textContent = text;
    control.addEventListener('click', action); return control;
  }
  const home = button(pl.home, () => showWelcome(true));
  const help = button(pl.repeatTutorial, () => enter(0));
  const saveFile = button(pl.exportSession, () => {
    const blob = new Blob([session.exportJson()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href = url; link.download = 'niebo-nad-nami-stan.json';
    link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    status.textContent = pl.exported;
  });
  const upload = document.createElement('input'); upload.type = 'file'; upload.accept = '.json,application/json'; upload.hidden = true;
  const importButton = button(pl.importSession, () => upload.click());
  upload.addEventListener('change', () => {
    const file = upload.files?.[0]; if (!file) return;
    if (file.size > MAX_SESSION_BYTES) { status.textContent = pl.importTooLarge; upload.value = ''; return; }
    void file.text().then(async (raw) => {
      await session.importJson(raw);
      level.value = store.getState().level; root.dataset.level = level.value;
      tutorialStep = null; content.querySelector('.nnb-tutorial')?.remove();
      sceneNav.hidden = false; shownScene = undefined; showScene(true); remember(true);
      status.textContent = pl.imported;
    }).catch(() => { status.textContent = pl.importError; }).finally(() => { upload.value = ''; });
  });
  const reset = button(pl.resetSession, () => {
    if (!window.confirm(pl.resetConfirm)) return;
    void session.reset().then(() => {
      level.value = store.getState().level; root.dataset.level = level.value; showWelcome(true); status.textContent = pl.resetDone;
    }).catch(() => { status.textContent = pl.resetError; });
  });
  const durableLabel = document.createElement('label'); durableLabel.className = 'nnb-checkbox';
  const durable = document.createElement('input'); durable.type = 'checkbox'; durable.checked = session.isDurable();
  const durableText = document.createElement('span'); durableText.textContent = 'Zachowaj sesję po zamknięciu przeglądarki (na tym urządzeniu)';
  durableLabel.append(durable, durableText);
  durable.addEventListener('change', () => {
    const next = durable.checked;
    if (!next && !window.confirm('Usunąć trwały zapis z tego urządzenia? Bieżąca karta zachowa stan sesyjny.')) {
      durable.checked = true; return;
    }
    durable.disabled = true;
    void session.setDurable(next).then(() => { status.textContent = next ? 'Włączono trwały zapis na tym urządzeniu.' : 'Usunięto trwały zapis. Pozostał zapis sesyjny.'; })
      .catch(() => { durable.checked = !next; status.textContent = 'Nie udało się zmienić sposobu zapisu. Wyeksportuj stan przed zamknięciem.'; })
      .finally(() => { durable.disabled = false; });
  });
  const teacherLink = document.createElement('a'); teacherLink.href = './teacher.html'; teacherLink.textContent = 'Narzędzia nauczyciela';
  navigation.append(home, help);
  if (local) navigation.append(saveFile, importButton, reset, teacherLink, upload);
  header.append(stage, heading, levelLabel, navigation);
  if (local) header.append(durableLabel);
  root.append(header);
  const sceneNav = document.createElement('nav'); sceneNav.className = 'nnb-scene-nav';
  sceneNav.setAttribute('aria-label', pl.sceneMenu);
  const sceneButtons = activeScenes.map((scene) => {
    const control = button(`${scene.id} · ${scene.title}`, () => {
      tutorialStep = null; content.querySelector('.nnb-tutorial')?.remove(); remember(true);
      if (store.navigate(scene.id as SceneId)) saveState();
      showScene(true);
    });
    sceneNav.append(control); return control;
  });
  root.append(sceneNav);
  const storage = new PreferenceStorage(() => sessionStorage, () => localStorage);
  const loaded = storage.load(defaultPreferences(matchMedia('(prefers-reduced-motion: reduce)').matches));
  let preferences = loaded.value;
  applyPreferences(root, preferences);
  const settings = mountPreferences(root, preferences, (value, future) => {
    preferences = value; applyPreferences(root, value);
    if (value.reducedMotion) { store.setPlaybackRate(0); saveState(); }
    try { storage.save(value, future); return true; } catch { return false; }
  });
  const content = document.createElement('div');
  const glossary = mountGlossary(root, store, (next) => {
    if (!lesson.sceneOrder.includes(next)) return;
    clearView(); tutorialStep = null; sceneNav.hidden = false; remember(true);
    if (store.navigate(next)) saveState(); showScene(true);
  });
  root.append(status, content); container.append(root);
  let view: ReturnType<typeof mountProbe> | undefined;
  let sphere: ReturnType<typeof mountSphereLesson> | undefined;
  let constellationLesson: ReturnType<typeof mountConstellationLesson> | undefined;
  let movementLesson: ReturnType<typeof mountMovementLesson> | undefined;
  let observingLesson: ReturnType<typeof mountObservingLesson> | undefined;
  let instrumentsLesson: ReturnType<typeof mountInstrumentsLesson> | undefined;
  let summaryLesson: ReturnType<typeof mountSummaryLesson> | undefined;
  let resourcesLesson: ReturnType<typeof mountResourcesLesson> | undefined;
  let levelIntro: ReturnType<typeof mountLevelIntro> | undefined;
  let tutorialStep: number | null = null;
  let shownScene: SceneId | undefined;
  let sceneGeneration = 0;
  let disposed = false;
  const entryKey = local ? 'nnb:entry:v1' : null;
  function saveState() { void host.notifyStateChanged().catch(() => { if (!disposed) status.textContent = pl.saveError; }); }
  function remember(entered: boolean) {
    if (!entryKey) return;
    try { sessionStorage.setItem(entryKey, JSON.stringify({ entered, tutorialStep })); }
    catch { status.textContent = pl.entrySaveError; }
  }
  function clearView() { sceneGeneration++; view?.destroy(); view = undefined; sphere?.destroy(); sphere = undefined;
    levelIntro?.destroy(); levelIntro = undefined;
    constellationLesson?.destroy(); constellationLesson = undefined; movementLesson?.destroy(); movementLesson = undefined;
    observingLesson?.destroy(); observingLesson = undefined; instrumentsLesson?.destroy(); instrumentsLesson = undefined;
    summaryLesson?.destroy(); summaryLesson = undefined;
    resourcesLesson?.destroy(); resourcesLesson = undefined;
    shownScene = undefined; content.replaceChildren(); }
  function showWelcome(focus = false) {
    if (store.setPlaybackRate(0)) saveState();
    clearView(); tutorialStep = null; sceneNav.hidden = true; remember(false);
    const title = document.createElement('h2'); title.textContent = pl.welcome; title.tabIndex = -1;
    const intro = document.createElement('p'); intro.textContent = pl.welcomeText;
    const skyFigure = document.createElement('figure'); skyFigure.className = 'nnb-welcome-sky';
    const skyImage = document.createElement('img');
    skyImage.src = host.resolveAsset('media/onboarding/nocne-niebo-nasa.jpg', 'engine');
    skyImage.alt = pl.welcomeSkyAlt; skyImage.width = 1024; skyImage.height = 373;
    skyImage.decoding = 'async';
    const skyCredit = document.createElement('figcaption'); skyCredit.textContent = pl.welcomeSkyCredit;
    skyFigure.append(skyImage, skyCredit);
    const instructions = document.createElement('p'); instructions.textContent = pl.beforeStart;
    const actions = document.createElement('div'); actions.className = 'nnb-actions';
    actions.append(button(pl.begin, () => enter(0)), button(pl.skipTutorial, () => enter(null)));
    content.append(title, intro, skyFigure, instructions, actions); if (focus) title.focus();
  }
  function enter(step: number | null) {
    clearView(); tutorialStep = step; sceneNav.hidden = false;
    if (preferences.reducedMotion || step !== null) store.setPlaybackRate(0);
    if (step !== null && store.navigate('E2')) saveState();
    const tutorial = document.createElement('section'); tutorial.className = 'nnb-tutorial';
    tutorial.setAttribute('aria-label', pl.tutorial);
    content.append(tutorial);
    showScene(false);
    function renderTutorial(focus: boolean) {
      tutorial.replaceChildren(); tutorial.hidden = tutorialStep === null;
      if (tutorialStep === null) return;
      const title = document.createElement('h2'); title.textContent = `${pl.step} ${tutorialStep + 1}/6: ${pl.tutorialSteps[tutorialStep]![0]}`;
      title.tabIndex = -1;
      const text = document.createElement('p'); text.textContent = pl.tutorialSteps[tutorialStep]![1]!;
      const controls = document.createElement('div'); controls.className = 'nnb-actions';
      const previous = button(pl.previousStep, () => { tutorialStep = Math.max(0, tutorialStep! - 1); renderTutorial(true); remember(true); });
      previous.disabled = tutorialStep === 0;
      const finish = () => {
        tutorialStep = null; renderTutorial(false); remember(true);
        content.querySelector<HTMLElement>('.nnb-scene h2')?.focus();
      };
      controls.append(previous, button(tutorialStep === 5 ? pl.finishTutorial : pl.nextStep, () => {
        if (tutorialStep === 5) finish(); else { tutorialStep = tutorialStep! + 1; renderTutorial(true); remember(true); }
      }), button(pl.skipTutorial, finish));
      tutorial.append(title, text, controls); if (focus) title.focus();
    }
    renderTutorial(true); remember(true);
    if (step === null) content.querySelector<HTMLElement>('.nnb-scene h2')?.focus();
  }
  function showScene(focus: boolean) {
    const sceneId = lesson.sceneOrder.includes(store.getState().sceneId) ? store.getState().sceneId : lesson.sceneOrder[0]!;
    if (sceneId !== 'E2' && store.setPlaybackRate(0)) saveState();
    if (shownScene === sceneId) {
      if (focus) content.querySelector<HTMLElement>('.nnb-scene h2')?.focus();
      return;
    }
    shownScene = sceneId;
    const generation = ++sceneGeneration;
    view?.destroy(); view = undefined; sphere?.destroy(); sphere = undefined;
    levelIntro?.destroy(); levelIntro = undefined;
    constellationLesson?.destroy(); constellationLesson = undefined;
    movementLesson?.destroy(); movementLesson = undefined;
    observingLesson?.destroy(); observingLesson = undefined; instrumentsLesson?.destroy(); instrumentsLesson = undefined;
    summaryLesson?.destroy(); summaryLesson = undefined;
    resourcesLesson?.destroy(); resourcesLesson = undefined;
    content.querySelector('.nnb-scene')?.remove();
    const scene = scenesData.scenes.find((item) => item.id === sceneId)!;
    const section = document.createElement('section'); section.className = 'nnb-scene';
    section.setAttribute('aria-label', `${scene.id} ${scene.title}`);
    const title = document.createElement('h2'); title.textContent = `${scene.id} · ${scene.title}`; title.tabIndex = -1;
    const outline = document.createElement('p'); outline.textContent = scene.outline;
    const source = document.createElement('p'); source.className = 'nnb-note'; source.textContent = `Zakres: ${scene.source}.`;
    const statusText = document.createElement('p'); statusText.className = 'nnb-note';
    statusText.textContent = scene.status === 'sample' ? pl.sceneSample : scene.status === 'prototype' ? pl.scenePrototype : pl.sceneSkeleton;
    section.append(title, outline, source, statusText);
    levelIntro = mountLevelIntro(section, sceneId, store, host);
    if (sceneId === 'E1') {
      const lesson = document.createElement('div'); section.append(lesson);
      void import('./sphere-lesson').then(({ mountSphereLesson: mount }) => {
        if (disposed || generation !== sceneGeneration) return;
        sphere = mount(lesson, store);
      }).catch(() => { if (!disposed && generation === sceneGeneration) status.textContent = pl.loadingError; });
    }
    if (sceneId === 'E2') {
      const observatory = document.createElement('div'); section.append(observatory);
      const loading = document.createElement('p'); loading.textContent = pl.loadingObservatory; observatory.append(loading);
      void import('./probe-view').then(({ mountProbe: mount }) => {
        if (disposed || generation !== sceneGeneration) return;
        loading.remove(); view = mount(observatory, store, host);
      }).catch(() => { if (!disposed && generation === sceneGeneration) status.textContent = pl.loadingError; });
    }
    if (sceneId === 'E3') {
      const lesson = document.createElement('div'); section.append(lesson);
      void import('./constellation-lesson').then(({ mountConstellationLesson: mount }) => {
        if (disposed || generation !== sceneGeneration) return;
        constellationLesson = mount(lesson, store, host, config.lesson?.layers);
      }).catch(() => { if (!disposed && generation === sceneGeneration) status.textContent = pl.loadingError; });
    }
    if (sceneId === 'E4') {
      const lesson = document.createElement('div'); section.append(lesson);
      void import('./movement-lesson').then(({ mountMovementLesson: mount }) => {
        if (disposed || generation !== sceneGeneration) return;
        movementLesson = mount(lesson, store);
      }).catch(() => { if (!disposed && generation === sceneGeneration) status.textContent = pl.loadingError; });
    }
    if (sceneId === 'E5') {
      const lesson = document.createElement('div'); section.append(lesson);
      void import('./observing-lesson').then(({ mountObservingLesson: mount }) => {
        if (disposed || generation !== sceneGeneration) return;
        observingLesson = mount(lesson, store, host);
      }).catch(() => { if (!disposed && generation === sceneGeneration) status.textContent = pl.loadingError; });
    }
    if (sceneId === 'E6') {
      const lesson = document.createElement('div'); section.append(lesson);
      void import('./instruments-lesson').then(({ mountInstrumentsLesson: mount }) => {
        if (disposed || generation !== sceneGeneration) return;
        instrumentsLesson = mount(lesson, store);
      }).catch(() => { if (!disposed && generation === sceneGeneration) status.textContent = pl.loadingError; });
    }
    if (sceneId === 'E7') {
      const lesson = document.createElement('div'); section.append(lesson);
      void import('./summary-lesson').then(({ mountSummaryLesson: mount }) => {
        if (disposed || generation !== sceneGeneration) return;
        summaryLesson = mount(lesson, store, host, (next) => {
          if (!config.lesson?.sceneOrder.includes(next) && config.lesson) return;
          if (store.navigate(next)) saveState();
          showScene(true);
        });
      }).catch(() => { if (!disposed && generation === sceneGeneration) status.textContent = pl.loadingError; });
    }
    if (sceneId === 'E8') {
      const lesson = document.createElement('div'); section.append(lesson);
      void import('./resources-lesson').then(({ mountResourcesLesson: mount }) => {
        if (disposed || generation !== sceneGeneration) return;
        resourcesLesson = mount(lesson, (next) => {
          if (!config.lesson?.sceneOrder.includes(next) && config.lesson) return;
          if (store.navigate(next)) saveState();
          showScene(true);
        }, lessonSettings(config).sceneOrder);
      }).catch(() => { if (!disposed && generation === sceneGeneration) status.textContent = pl.loadingError; });
    }
    content.append(section);
    sceneButtons.forEach((control, index) => {
      if (activeScenes[index]!.id === sceneId) control.setAttribute('aria-current', 'page');
      else control.removeAttribute('aria-current');
    });
    if (focus) title.focus();
  }
  let restoredEntry = false;
  try {
    const raw = entryKey ? sessionStorage.getItem(entryKey) : null;
    if (raw) {
      const saved = JSON.parse(raw) as { entered?: unknown; tutorialStep?: unknown };
      if (saved.entered === true && (saved.tutorialStep === null || (Number.isInteger(saved.tutorialStep) && Number(saved.tutorialStep) >= 0 && Number(saved.tutorialStep) < 6))) {
        enter(saved.tutorialStep as number | null); restoredEntry = true;
      }
    }
  } catch { status.textContent = pl.entrySaveError; }
  if (!restoredEntry) showWelcome();
  if (loaded.failed) status.textContent = pl.preferencesReadError;
  const syncFrozen = () => {
    level.disabled = store.isFrozen();
    sceneButtons.forEach((control) => { control.disabled = store.isFrozen(); });
  };
  const unsubscribeShell = store.subscribe(syncFrozen); syncFrozen();
  return {
    setStatus(message: string) { status.textContent = message; },
    refresh() { level.value = store.getState().level; root.dataset.level = level.value; showScene(false); syncFrozen(); },
    destroy() { disposed = true; sceneGeneration++; unsubscribeShell(); levelIntro?.destroy(); view?.destroy(); sphere?.destroy(); constellationLesson?.destroy(); movementLesson?.destroy(); observingLesson?.destroy(); instrumentsLesson?.destroy(); summaryLesson?.destroy(); resourcesLesson?.destroy(); glossary.destroy(); settings.destroy(); root.remove(); },
  };
}
