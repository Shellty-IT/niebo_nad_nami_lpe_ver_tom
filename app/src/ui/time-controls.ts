import type { ProbeStore } from '../app/probe-store';
import type { HostAdapter } from '../hosts/host-adapter';
import { SimulationClock } from '../simulation/clock';
import { VALID_FROM, VALID_TO } from '../astronomy/ephemeris';
import { pl } from '../i18n/pl';
import { lessonSettings } from '../domain/lesson-settings';

export function mountTimeControls(container: HTMLElement, store: ProbeStore, host: HostAdapter) {
  const settings = lessonSettings(store.getConfig());
  const minTime = Math.max(Date.parse(VALID_FROM), Date.parse(settings.dateFromUtc));
  const maxTime = Math.min(Date.parse(VALID_TO), Date.parse(settings.dateToUtc));
  const root = document.createElement('fieldset'); root.className = 'nnb-time-controls';
  const legend = document.createElement('legend'); legend.textContent = pl.timeControls;
  const label = document.createElement('label'); label.textContent = pl.playbackRate;
  const select = document.createElement('select');
  for (const rate of [-86400, -3600, -60, -1, -0.1, 0, 0.1, 1, 60, 3600, 86400]) {
    const option = document.createElement('option'); option.value = String(rate);
    option.textContent = rate === 0 ? pl.paused : `${rate}×${Math.abs(rate) === 86400 ? ` · ${pl.dayPerSecond}` : ''}`;
    select.append(option);
  }
  label.append(select);
  const pause = document.createElement('button'); pause.type = 'button'; pause.textContent = pl.pause;
  const now = document.createElement('button'); now.type = 'button'; now.textContent = pl.now;
  const backward = document.createElement('button'); backward.type = 'button'; backward.textContent = pl.previousDay;
  const forward = document.createElement('button'); forward.type = 'button'; forward.textContent = pl.nextDay;
  const message = document.createElement('p'); message.setAttribute('aria-live', 'polite');
  root.append(legend, label, pause, now, backward, forward, message); container.append(root);
  const clock = new SimulationClock();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let tickChange = false;
  let disposed = false;
  let lastSavedAt = performance.now();
  let previous = store.getState();
  let previouslyFrozen = store.isFrozen();
  clock.set(Date.parse(previous.observation.instantUtc), previous.playbackRate, performance.now());
  function save() {
    if (store.isFrozen() || disposed) return;
    lastSavedAt = performance.now();
    void host.notifyStateChanged().catch(() => { if (!disposed) message.textContent = pl.saveError; });
  }
  function schedule() {
    clearTimeout(timer);
    if (!disposed && !document.hidden && !store.isFrozen() && store.getState().playbackRate !== 0) timer = setTimeout(tick, 100);
  }
  function tick() {
    if (disposed || store.isFrozen() || document.hidden) return;
    const sample = clock.sample(performance.now());
    const instantMs = Math.min(maxTime, Math.max(minTime, sample));
    tickChange = true;
    store.change({ ...store.getState().observation, instantUtc: new Date(instantMs).toISOString() });
    tickChange = false;
    if (instantMs !== sample) { store.setPlaybackRate(0); message.textContent = pl.reachedBoundary; save(); }
    else if (performance.now() - lastSavedAt >= 5000) save();
    schedule();
  }
  function update() {
    const state = store.getState();
    if ((!tickChange && state.observation.instantUtc !== previous.observation.instantUtc) ||
      state.playbackRate !== previous.playbackRate || store.isFrozen() !== previouslyFrozen) {
      clock.set(Date.parse(state.observation.instantUtc), state.playbackRate, performance.now());
    }
    select.value = String(state.playbackRate); root.disabled = store.isFrozen();
    pause.disabled = store.isFrozen() || state.playbackRate === 0;
    previous = state; previouslyFrozen = store.isFrozen(); schedule();
  }
  function setRate() { if (store.setPlaybackRate(Number(select.value))) { message.textContent = pl.motionReading; save(); } }
  function stop() { if (store.setPlaybackRate(0)) { message.textContent = pl.paused; save(); } }
  function changeInstant(instantMs: number, rate: number) {
    if (store.isFrozen()) return;
    store.setPlaybackRate(0);
    store.change({ ...store.getState().observation, instantUtc: new Date(instantMs).toISOString() });
    store.setPlaybackRate(rate); save();
  }
  function setNow() { changeInstant(Math.min(maxTime, Math.max(minTime, Date.now())), 1); }
  function step(amount: number) {
    const value = Date.parse(store.getState().observation.instantUtc) + amount;
    changeInstant(Math.max(minTime, Math.min(maxTime, value)), 0);
  }
  const back = () => step(-86400000); const next = () => step(86400000);
  select.addEventListener('change', setRate); pause.addEventListener('click', stop); now.addEventListener('click', setNow);
  backward.addEventListener('click', back); forward.addEventListener('click', next);
  function visibility() {
    // Rzeczywisty czas nadrabia przerwę; eksperyment dydaktyczny czeka na użytkownika.
    if (document.hidden && store.getState().playbackRate !== 1) stop();
    schedule();
  }
  document.addEventListener('visibilitychange', visibility);
  const unsubscribe = store.subscribe(update); update();
  return { destroy() {
    disposed = true; clearTimeout(timer); unsubscribe(); document.removeEventListener('visibilitychange', visibility);
    select.removeEventListener('change', setRate); pause.removeEventListener('click', stop); now.removeEventListener('click', setNow);
    backward.removeEventListener('click', back); forward.removeEventListener('click', next); root.remove();
  } };
}
