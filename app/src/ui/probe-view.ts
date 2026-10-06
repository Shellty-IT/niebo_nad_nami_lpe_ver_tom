import type { ObjectId } from '../domain/probe';
import type { ProbeStore } from '../app/probe-store';
import type { HostAdapter } from '../hosts/host-adapter';
import { pl } from '../i18n/pl';
import { mountObservationPanel } from './observation-panel';
import { mountTimeControls } from './time-controls';
import { mountCoordinateTask } from './coordinate-task';
import { mountPracticalTasks } from './practical-tasks';
import { lessonSettings } from '../domain/lesson-settings';

function element<K extends keyof HTMLElementTagNameMap>(tag: K, text?: string) {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  return node;
}

export function mountProbe(container: HTMLElement, store: ProbeStore, host: HostAdapter, editor = false) {
  let disposed = false;
  const root = element('section');
  root.className = 'nnb nnb-probe';
  root.lang = 'pl';
  root.setAttribute('aria-label', editor ? pl.editor : pl.title);
  const environment = host.getEnvironment();
  root.dataset.contrast = environment.contrastMode || 'default';
  const tag = element('p', pl.stage);
  tag.className = 'nnb-stage';
  const heading = element(editor ? 'h1' : 'h2', editor ? pl.editor : pl.observatory);
  heading.tabIndex = -1;
  const description = element('p', pl.description);
  const coordinateIntro = element('p', 'Sfera niebieska porządkuje kierunki obserwacji. W układzie równikowym rektascensję (RA) mierzymy w godzinach od punktu równonocy, a deklinację w stopniach od równika niebieskiego. W lokalnym układzie horyzontalnym azymut liczymy od północy przez wschód, a wysokość od horyzontu. Te same obiekty mają jednocześnie oba zestawy współrzędnych.');
  const form = element('form');
  const fieldset = element('fieldset');
  fieldset.append(element('legend', editor ? pl.editor : pl.summary));
  const object = element('select');
  const lesson = lessonSettings(store.getConfig());
  (['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune'] as const).forEach((id) => {
    if (!lesson.visibleObjects.includes(id)) return;
    const option = element('option', pl.objects[id]);
    option.value = id;
    object.append(option);
  });
  const instant = element('input');
  instant.type = 'text';
  instant.required = true;
  instant.maxLength = 24;
  instant.spellcheck = false;
  instant.setAttribute('aria-description', `Dozwolony zakres UTC: ${lesson.dateFromUtc} – ${lesson.dateToUtc}`);
  const zone = element('input');
  zone.type = 'text';
  zone.required = true;
  zone.maxLength = 80;
  zone.spellcheck = false;
  for (const [text, input] of [[pl.object, object], [pl.instant, instant], [pl.zone, zone]] as const) {
    const label = element('label', text);
    label.append(input);
    if (input === zone) label.className = 'nnb-advanced';
    fieldset.append(label);
  }
  const placeLabel = element('label', 'Szybki wybór miejsca');
  const place = element('select'); place.append(new Option('Wybierz miasto lub ostatnie miejsce', ''));
  for (const [id, title] of [['warsaw', 'Warszawa'], ['cape-town', 'Kapsztad'], ['sydney', 'Sydney'], ['new-york', 'Nowy Jork']] as const) place.append(new Option(title, id));
  placeLabel.append(place); fieldset.append(placeLabel);
  const latitude = element('input');
  const longitude = element('input');
  const height = element('input');
  for (const [labelText, input, min, max] of [
    [pl.latitude, latitude, -90, 90], [pl.longitude, longitude, -180, 180], [pl.height, height, -500, 10000],
  ] as const) {
    input.type = 'number'; input.step = 'any'; input.min = String(min); input.max = String(max); input.required = true;
    const label = element('label', labelText); label.append(input); if (input === height) label.className = 'nnb-advanced'; fieldset.append(label);
  }
  const refraction = element('input');
  refraction.type = 'checkbox';
  const refractionLabel = element('label', pl.refraction);
  refractionLabel.className = 'nnb-checkbox';
  refractionLabel.classList.add('nnb-advanced');
  refractionLabel.prepend(refraction);
  fieldset.append(refractionLabel);
  const apply = element('button', pl.apply);
  apply.type = 'submit';
  fieldset.append(apply);
  form.append(fieldset);
  const summary = element('p');
  summary.className = 'nnb-summary';
  const status = element('p');
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  const fullscreen = element('button', pl.fullscreen);
  fullscreen.type = 'button';
  const note = element('p', environment.kind === 'local' ? pl.local : pl.zpe);
  note.className = 'nnb-note';
  root.append(tag, heading, description, coordinateIntro, form, summary, status);
  if (!editor) root.append(fullscreen);
  root.append(note);
  container.append(root);
  const observationPanel = editor ? undefined : mountObservationPanel(root, store, host);
  const timeControls = editor ? undefined : mountTimeControls(root, store, host);
  const coordinateTask = editor ? undefined : mountCoordinateTask(root, store, host);
  const practicalTasks = editor ? undefined : mountPracticalTasks(root, store, host);

  function setStatus(message: string) { if (!disposed) status.textContent = message; }
  let formatZone = '';
  let historyKey = '';
  function updateHistory() {
    const history = store.getState().locationHistory;
    const key = JSON.stringify(history);
    if (key === historyKey) return;
    historyKey = key;
    place.querySelectorAll('option[data-history]').forEach((option) => option.remove());
    [...history].reverse().forEach((item, index) => {
      const option = new Option(`Ostatnie ${index + 1}: ${item.latitudeDeg.toFixed(3)}°, ${item.longitudeDeg.toFixed(3)}°`, `history:${history.length - 1 - index}`);
      option.dataset.history = 'true'; place.append(option);
    });
  }
  function choosePlace() {
    const cities: Record<string, [number, number, number, string]> = {
      warsaw: [52.2297, 21.0122, 100, 'Europe/Warsaw'],
      'cape-town': [-33.9258, 18.4232, 25, 'Africa/Johannesburg'],
      sydney: [-33.8688, 151.2093, 58, 'Australia/Sydney'],
      'new-york': [40.7128, -74.0060, 10, 'America/New_York'],
    };
    const city = cities[place.value];
    const historyIndex = place.value.startsWith('history:') ? Number(place.value.slice(8)) : -1;
    const prior = store.getState().locationHistory[historyIndex];
    const selected = city ?? (prior && [prior.latitudeDeg, prior.longitudeDeg, prior.heightM, zone.value] as const);
    if (!selected) return;
    latitude.value = String(selected[0]); longitude.value = String(selected[1]); height.value = String(selected[2]);
    zone.value = selected[3]; place.value = '';
  }
  place.addEventListener('change', choosePlace);
  let dateFormat: Intl.DateTimeFormat;
  function render() {
    const value = store.getState().observation;
    root.dataset.level = store.getState().level;
    object.value = value.objectId;
    instant.value = value.instantUtc;
    zone.value = value.timeZone;
    latitude.value = String(value.observer.latitudeDeg);
    longitude.value = String(value.observer.longitudeDeg);
    height.value = String(value.observer.heightM);
    refraction.checked = value.refraction;
    updateHistory();
    fieldset.disabled = store.isFrozen();
    if (formatZone !== value.timeZone) {
      dateFormat = new Intl.DateTimeFormat('pl-PL', { timeZone: value.timeZone, dateStyle: 'long', timeStyle: 'long' });
      formatZone = value.timeZone;
    }
    summary.textContent = `${pl.objects[value.objectId]} · ${dateFormat.format(new Date(value.instantUtc))} · ${value.timeZone}`;
    status.setAttribute('aria-live', store.getState().playbackRate !== 0 && !store.isFrozen() ? 'off' : 'polite');
    const statusText = store.isFrozen() ? pl.frozen : pl.ready;
    if (status.textContent !== statusText) setStatus(statusText);
  }
  const unsubscribe = store.subscribe(render);
  function submit(event: Event) {
    event.preventDefault();
    try {
      const changed = store.change({
        objectId: object.value as ObjectId, instantUtc: instant.value.trim(), timeZone: zone.value.trim(),
        observer: { latitudeDeg: latitude.valueAsNumber, longitudeDeg: longitude.valueAsNumber, heightM: height.valueAsNumber },
        refraction: refraction.checked,
      });
      if (changed) {
        void host.notifyStateChanged().then(
          () => setStatus(store.isFrozen() ? pl.frozen : editor ? pl.editorSaved : pl.saved),
          () => setStatus(pl.saveError),
        );
      }
    } catch { setStatus(pl.invalid); }
  }
  function enterFullscreen() {
    void host.requestFullscreen(root).catch(() => setStatus(pl.fullscreenError));
  }
  function pauseForEditing() {
    if (!editor && store.setPlaybackRate(0)) void host.notifyStateChanged().catch(() => setStatus(pl.saveError));
  }
  form.addEventListener('submit', submit);
  form.addEventListener('focusin', pauseForEditing);
  fullscreen.addEventListener('click', enterFullscreen);
  render();
  return {
    setStatus,
    destroy() {
      disposed = true;
      unsubscribe();
      observationPanel?.destroy();
      timeControls?.destroy();
      coordinateTask?.destroy();
      practicalTasks?.destroy();
      form.removeEventListener('submit', submit);
      form.removeEventListener('focusin', pauseForEditing);
      fullscreen.removeEventListener('click', enterFullscreen);
      place.removeEventListener('change', choosePlace);
      root.remove();
    },
  };
}
