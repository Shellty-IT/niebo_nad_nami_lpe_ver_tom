import { parseConfig, type ProbeConfig } from '../domain/probe';
import { ALL_LEVELS, ALL_OBJECTS, ALL_SCENES, lessonSettings, validateLessonSettings, type LessonQuestion, type LessonTask } from '../domain/lesson-settings';
import { pl } from '../i18n/pl';

function input(labelText: string, value: string, change: (value: string) => void, type = 'text') {
  const label = document.createElement('label'); label.textContent = labelText;
  const control = document.createElement('input'); control.type = type; control.value = value;
  control.addEventListener('change', () => change(control.value.trim())); label.append(control);
  return label;
}

function select<T extends string>(labelText: string, values: readonly T[], value: T, title: (value: T) => string, change: (value: T) => void) {
  const label = document.createElement('label'); label.textContent = labelText;
  const control = document.createElement('select');
  for (const item of values) control.append(new Option(title(item), item));
  control.value = value; control.addEventListener('change', () => change(control.value as T)); label.append(control);
  return label;
}

function button(label: string, action: () => void) {
  const control = document.createElement('button'); control.type = 'button'; control.textContent = label;
  control.addEventListener('click', action); return control;
}

export function mountLessonEditor(container: HTMLElement, initial: ProbeConfig, onValid?: (value: ProbeConfig) => void) {
  let draft: ProbeConfig = parseConfig(initial);
  draft.lesson = lessonSettings(draft);
  const root = document.createElement('section'); root.className = 'nnb nnb-lesson-editor'; root.lang = 'pl';
  const heading = document.createElement('h2'); heading.textContent = 'Konfiguracja lekcji';
  const help = document.createElement('p');
  help.textContent = 'Wybierz sceny i ich kolejność, poziomy, obiekty oraz daty. Możesz dodać pytania i zadania. Konfiguracja jest plikiem JSON bez kodu wykonywalnego.';
  const status = document.createElement('p'); status.setAttribute('role', 'status');
  const main = document.createElement('div'); root.append(heading, help, status, main); container.append(root);
  function validate() {
    const errors = validateLessonSettings(draft.lesson!, draft);
    try { parseConfig(draft); } catch { if (!errors.length) errors.push('Sprawdź datę, miejsce i pozostałe pola konfiguracji.'); }
    status.textContent = errors.length ? errors.join(' ') : 'Konfiguracja poprawna i gotowa do eksportu.';
    if (!errors.length) onValid?.(parseConfig(draft));
    return errors.length === 0;
  }
  function update() { validate(); }
  function render() {
    const settings = draft.lesson!; main.replaceChildren();
    const sceneSection = document.createElement('fieldset'); sceneSection.append(document.createElement('legend'));
    sceneSection.firstElementChild!.textContent = 'Sceny i kolejność';
    for (const sceneId of ALL_SCENES) {
      const row = document.createElement('div'); row.className = 'nnb-actions';
      const toggle = document.createElement('label');
      const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.checked = settings.sceneOrder.includes(sceneId);
      checkbox.addEventListener('change', () => { settings.sceneOrder = checkbox.checked ? [...settings.sceneOrder, sceneId] : settings.sceneOrder.filter((id) => id !== sceneId); render(); });
      toggle.append(checkbox, document.createTextNode(` ${sceneId}`)); row.append(toggle);
      if (settings.sceneOrder.includes(sceneId)) {
        row.append(button('W górę', () => { const index = settings.sceneOrder.indexOf(sceneId); if (index > 0) {
          [settings.sceneOrder[index - 1], settings.sceneOrder[index]] = [settings.sceneOrder[index]!, settings.sceneOrder[index - 1]!]; render();
        } }), button('W dół', () => { const index = settings.sceneOrder.indexOf(sceneId); if (index < settings.sceneOrder.length - 1) {
          [settings.sceneOrder[index + 1], settings.sceneOrder[index]] = [settings.sceneOrder[index]!, settings.sceneOrder[index + 1]!]; render();
        } }));
      }
      sceneSection.append(row);
    }
    const levelSection = document.createElement('fieldset'); const levelLegend = document.createElement('legend'); levelLegend.textContent = 'Poziomy'; levelSection.append(levelLegend);
    for (const level of ALL_LEVELS) {
      const label = document.createElement('label'); const check = document.createElement('input'); check.type = 'checkbox'; check.checked = settings.levels.includes(level);
      check.addEventListener('change', () => { settings.levels = check.checked ? [...settings.levels, level] : settings.levels.filter((item) => item !== level); update(); });
      label.append(check, document.createTextNode(` ${level}`)); levelSection.append(label);
    }
    levelSection.append(select('Poziom domyślny', ALL_LEVELS, settings.defaultLevel, (value) => value, (value) => { settings.defaultLevel = value; update(); }));
    const objectSection = document.createElement('fieldset'); const objectLegend = document.createElement('legend'); objectLegend.textContent = 'Widoczne obiekty'; objectSection.append(objectLegend);
    for (const objectId of ALL_OBJECTS) {
      const label = document.createElement('label'); const check = document.createElement('input'); check.type = 'checkbox'; check.checked = settings.visibleObjects.includes(objectId);
      check.addEventListener('change', () => { settings.visibleObjects = check.checked ? [...settings.visibleObjects, objectId] : settings.visibleObjects.filter((item) => item !== objectId); update(); });
      label.append(check, document.createTextNode(` ${pl.objects[objectId]}`)); objectSection.append(label);
    }
    const layerSection = document.createElement('fieldset'); const layerLegend = document.createElement('legend'); layerLegend.textContent = 'Warstwy gwiazdozbiorów'; layerSection.append(layerLegend);
    for (const [key, title] of [['stars','Gwiazdy'],['figure','Figura'],['boundary','Granica IAU'],['name','Nazwa']] as const) {
      const label = document.createElement('label'); const check = document.createElement('input'); check.type = 'checkbox'; check.checked = settings.layers[key];
      check.addEventListener('change', () => { settings.layers[key] = check.checked; update(); });
      label.append(check, document.createTextNode(` ${title}`)); layerSection.append(label);
    }
    const observation = document.createElement('fieldset'); const observationLegend = document.createElement('legend'); observationLegend.textContent = 'Obserwacja początkowa i zakres dat UTC'; observation.append(observationLegend);
    observation.append(
      input('Data i czas początkowy (ISO UTC)', draft.initialObservation.instantUtc, (value) => { draft.initialObservation.instantUtc = value; update(); }),
      input('Początek zakresu (ISO UTC)', settings.dateFromUtc, (value) => { settings.dateFromUtc = value; update(); }),
      input('Koniec zakresu (ISO UTC)', settings.dateToUtc, (value) => { settings.dateToUtc = value; update(); }),
      input('Strefa IANA', draft.initialObservation.timeZone, (value) => { draft.initialObservation.timeZone = value; update(); }),
      input('Szerokość geograficzna', String(draft.initialObservation.observer.latitudeDeg), (value) => { draft.initialObservation.observer.latitudeDeg = Number(value); update(); }, 'number'),
      input('Długość geograficzna', String(draft.initialObservation.observer.longitudeDeg), (value) => { draft.initialObservation.observer.longitudeDeg = Number(value); update(); }, 'number'),
      input('Wysokość n.p.m. (m)', String(draft.initialObservation.observer.heightM), (value) => { draft.initialObservation.observer.heightM = Number(value); update(); }, 'number'),
      select('Obiekt początkowy', ALL_OBJECTS, draft.initialObservation.objectId, (value) => pl.objects[value], (value) => { draft.initialObservation.objectId = value; update(); }),
    );
    const questionSection = document.createElement('fieldset'); const questionLegend = document.createElement('legend'); questionLegend.textContent = 'Własne pytania'; questionSection.append(questionLegend);
    settings.questions.forEach((question, index) => {
      const block = document.createElement('section'); const title = document.createElement('h3'); title.textContent = question.id;
      block.append(title,
        select('Scena', ALL_SCENES, question.sceneId, (value) => value, (value) => { question.sceneId = value; update(); }),
        select('Poziom', ALL_LEVELS, question.level, (value) => value, (value) => { question.level = value; update(); }),
        input('Pytanie', question.stem, (value) => { question.stem = value; update(); }));
      question.choices.forEach((choice, choiceIndex) => block.append(input(`Odpowiedź ${choiceIndex + 1}`, choice, (value) => { question.choices[choiceIndex] = value; update(); })));
      block.append(select('Poprawna odpowiedź', ['0','1','2'] as const, String(question.correctIndex) as '0'|'1'|'2', (value) => String(Number(value) + 1), (value) => { question.correctIndex = Number(value); update(); }),
        input('Podpowiedź', question.hint, (value) => { question.hint = value; update(); }),
        input('Wyjaśnienie', question.explanation, (value) => { question.explanation = value; update(); }),
        button('Usuń pytanie', () => { settings.questions.splice(index, 1); render(); })); questionSection.append(block);
    });
    questionSection.append(button('Dodaj pytanie', () => {
      const next = Math.max(0, ...settings.questions.map((item) => Number(item.id.slice(2)))) + 1;
      settings.questions.push({ id: `TQ${String(next).padStart(2,'0')}`, sceneId: 'E7', level: settings.defaultLevel,
        stem: '', choices: ['', '', ''], correctIndex: 0, hint: '', explanation: '' } satisfies LessonQuestion); render();
    }));
    const taskSection = document.createElement('fieldset'); const taskLegend = document.createElement('legend'); taskLegend.textContent = 'Własne zadania w obserwatorium E2'; taskSection.append(taskLegend);
    settings.tasks.forEach((task, index) => {
      const block = document.createElement('section'); const title = document.createElement('h3'); title.textContent = task.id;
      block.append(title,
        select('Rodzaj', ['object','coordinate'] as const, task.kind, (value) => value === 'object' ? 'Wskaż obiekt' : 'Odczytaj współrzędne', (value) => { task.kind = value; render(); }),
        input('Tytuł', task.title, (value) => { task.title = value; update(); }),
        input('Polecenie', task.instruction, (value) => { task.instruction = value; update(); }),
        input('Podpowiedź', task.hint, (value) => { task.hint = value; update(); }));
      if (task.kind === 'object') block.append(select('Obiekt docelowy', ALL_OBJECTS, task.targetObjectId ?? 'Mars', (value) => pl.objects[value], (value) => { task.targetObjectId = value; update(); }));
      else block.append(
        input('Azymut celu (°)', String(task.azimuthDeg ?? ''), (value) => { task.azimuthDeg = Number(value); update(); }, 'number'),
        input('Wysokość celu (°)', String(task.altitudeDeg ?? ''), (value) => { task.altitudeDeg = Number(value); update(); }, 'number'),
        input('Tolerancja (°)', String(task.toleranceDeg ?? ''), (value) => { task.toleranceDeg = Number(value); update(); }, 'number'));
      block.append(button('Usuń zadanie', () => { settings.tasks.splice(index, 1); render(); })); taskSection.append(block);
    });
    taskSection.append(button('Dodaj zadanie', () => {
      const next = Math.max(0, ...settings.tasks.map((item) => Number(item.id.slice(2)))) + 1;
      settings.tasks.push({ id: `TZ${String(next).padStart(2,'0')}`, sceneId: 'E2', kind: 'object', title: '', instruction: '', hint: '',
        targetObjectId: 'Mars', azimuthDeg: null, altitudeDeg: null, toleranceDeg: null } satisfies LessonTask); render();
    }));
    main.append(sceneSection, levelSection, objectSection, layerSection, observation, questionSection, taskSection); validate();
  }
  render();
  return {
    getConfig(): ProbeConfig { if (!validate()) throw new Error('invalid-lesson'); return parseConfig(draft); },
    setConfig(value: ProbeConfig) { draft = parseConfig(value); draft.lesson = lessonSettings(draft); render(); },
    destroy() { root.remove(); },
  };
}
