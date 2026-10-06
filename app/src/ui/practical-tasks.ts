import type { ProbeStore } from '../app/probe-store';
import { lessonSettings } from '../domain/lesson-settings';
import type { HostAdapter } from '../hosts/host-adapter';
import { PLANET_IDS } from '../domain/probe';
import { pl } from '../i18n/pl';

export function mountPracticalTasks(container: HTMLElement, store: ProbeStore, host: HostAdapter) {
  const settings = lessonSettings(store.getConfig());
  const root = document.createElement('section'); root.className = 'nnb-practical-tasks';
  const unsubscribers: Array<() => void> = [];
  const heading = document.createElement('h2'); heading.textContent = 'Zadania rozpoznawania i pomiaru'; root.append(heading);
  const marsAvailable = settings.visibleObjects.includes('Mars') && settings.visibleObjects.some((id) => id !== 'Mars') &&
    settings.dateFromUtc <= '2025-01-16T20:00:00.000Z' && settings.dateToUtc >= '2025-01-16T20:00:00.000Z';
  const tasks = [
    ...(marsAvailable ? [{ id: 'Z01', title: 'Gdzie jest Mars?', instruction: 'Ustaw widok zadania: Warszawa, 16 stycznia 2025, 20:00 UTC. Mars jest wtedy nad horyzontem. Wybierz go na mapie lub z listy obiektów i sprawdź odpowiedź.',
      hint: 'Sprawdź, które planety są nad horyzontem. Wybór z listy jest równoważny kliknięciu na mapie.', kind: 'object' as const },
    ] : []),
    ...settings.tasks.filter((task) => task.sceneId === 'E2'),
  ];
  for (const task of tasks) {
    const section = document.createElement('section'); const title = document.createElement('h3'); title.textContent = `${task.id} · ${task.title}`;
    const instruction = document.createElement('p'); instruction.textContent = task.instruction;
    const hint = document.createElement('details'); const summary = document.createElement('summary'); summary.textContent = 'Podpowiedź';
    const hintText = document.createElement('p'); hintText.textContent = task.hint; hint.append(summary, hintText);
    const actions = document.createElement('div'); actions.className = 'nnb-actions';
    const feedback = document.createElement('p'); feedback.setAttribute('aria-live', 'polite');
    if (task.id === 'Z01') {
      const start = document.createElement('button'); start.type = 'button'; start.textContent = 'Ustaw widok Z01';
      start.addEventListener('click', () => {
        if (store.startMarsTask()) {
          feedback.textContent = 'Widok gotowy. Wybierz obiekt i sprawdź odpowiedź.';
          void host.notifyStateChanged().catch(() => { feedback.textContent = 'Nie udało się zapisać widoku zadania.'; });
        } else feedback.textContent = 'Nie można ustawić Z01 przy aktualnym zakresie dat lub ukrytych obiektach.';
      }); actions.append(start);
      const unsubscribe = store.subscribe(() => { start.disabled = store.isFrozen(); });
      start.disabled = store.isFrozen();
      unsubscribers.push(unsubscribe);
    }
    const check = document.createElement('button'); check.type = 'button'; check.textContent = 'Sprawdź zadanie';
    check.addEventListener('click', () => {
      const attempt = store.checkPracticalTask(task.id);
      if (!attempt) { feedback.textContent = 'Zatrzymaj czas i ustaw wymagany widok albo sprawdź dostępność zadania.'; return; }
      feedback.textContent = attempt.correct ? 'Cel osiągnięty. Wynik zapisany.' : 'Jeszcze nie. Skorzystaj z podpowiedzi i spróbuj ponownie.';
      void host.notifyStateChanged().catch(() => { feedback.textContent = 'Nie udało się zapisać wyniku. Wyeksportuj sesję.'; });
    }); actions.append(check);
    const result = document.createElement('p'); result.className = 'nnb-task-report';
    const renderResult = () => {
      const attempts = store.getState().taskAttempts.filter((item) => item.taskId === task.id);
      check.disabled = store.isFrozen() || store.getState().taskAttempts.length >= 500;
      result.textContent = `Próby: ${attempts.length}; cel: ${attempts.some((item) => item.correct) ? 'osiągnięty' : 'nieukończony'}.`;
    };
    unsubscribers.push(store.subscribe(renderResult)); renderResult();
    section.append(title, instruction, hint, actions, feedback, result); root.append(section);
  }
  if (PLANET_IDS.every((id) => settings.visibleObjects.includes(id)) &&
      settings.dateFromUtc <= '2025-01-16T20:00:00.000Z' && settings.dateToUtc >= '2025-01-16T20:00:00.000Z') {
    const section = document.createElement('section');
    const title = document.createElement('h3'); title.textContent = 'Planety nad horyzontem';
    const instruction = document.createElement('p');
    instruction.textContent = 'Warszawa, 16 stycznia 2025, 20:00 UTC. Zaznacz wszystkie planety, których środek tarczy jest nad lokalnym horyzontem. To kryterium geometryczne; nie oznacza, że każdą z nich widać gołym okiem.';
    const start = document.createElement('button'); start.type = 'button'; start.textContent = 'Ustaw widok planet';
    const choices = document.createElement('fieldset'); const legend = document.createElement('legend'); legend.textContent = 'Planety nad horyzontem'; choices.append(legend);
    const checks = PLANET_IDS.map((id) => {
      const label = document.createElement('label'); label.className = 'nnb-checkbox';
      const check = document.createElement('input'); check.type = 'checkbox'; check.value = id;
      label.append(check, document.createTextNode(pl.objects[id])); choices.append(label);
      return check;
    });
    const hint = document.createElement('details'); const hintTitle = document.createElement('summary'); hintTitle.textContent = 'Podpowiedź';
    const hintText = document.createElement('p'); hintText.textContent = 'Porównaj wysokość każdej planety w tabeli odczytów z 0°. Wartość dodatnia oznacza położenie nad horyzontem.'; hint.append(hintTitle, hintText);
    const checkButton = document.createElement('button'); checkButton.type = 'button'; checkButton.textContent = 'Sprawdź planety';
    const feedback = document.createElement('p'); feedback.setAttribute('aria-live', 'polite');
    const result = document.createElement('p'); result.className = 'nnb-task-report';
    start.addEventListener('click', () => {
      if (!store.startVisiblePlanetsTask()) { feedback.textContent = 'Nie można ustawić widoku planet w tej lekcji.'; return; }
      feedback.textContent = 'Widok gotowy. Porównaj wysokości planet i zaznacz odpowiedzi.';
      void host.notifyStateChanged().catch(() => { feedback.textContent = 'Nie udało się zapisać widoku zadania.'; });
    });
    checkButton.addEventListener('click', () => {
      const selected = checks.filter((check) => check.checked).map((check) => check.value as typeof PLANET_IDS[number]);
      const attempt = store.checkVisiblePlanetsTask(selected);
      if (!attempt) { feedback.textContent = 'Ustaw widok planet i zatrzymaj czas przed sprawdzeniem.'; return; }
      feedback.textContent = attempt.correct ? 'Wszystkie planety wskazane poprawnie. Wynik zapisany.' : 'Odpowiedź jest niepełna lub zawiera planetę pod horyzontem. Spróbuj ponownie.';
      void host.notifyStateChanged().catch(() => { feedback.textContent = 'Nie udało się zapisać wyniku. Wyeksportuj sesję.'; });
    });
    const renderResult = () => {
      const state = store.getState(); const attempts = state.taskAttempts.filter((item) => item.taskId === 'VisiblePlanets');
      start.disabled = state.taskAttempts.length >= 500 || store.isFrozen();
      checkButton.disabled = state.taskAttempts.length >= 500 || store.isFrozen();
      checks.forEach((check) => { check.disabled = store.isFrozen(); });
      result.textContent = `Próby: ${attempts.length}; cel: ${attempts.some((item) => item.correct) ? 'osiągnięty' : 'nieukończony'}.`;
    };
    unsubscribers.push(store.subscribe(renderResult)); renderResult();
    section.append(title, instruction, start, choices, hint, checkButton, feedback, result); root.append(section);
  }
  container.append(root);
  return { destroy() { unsubscribers.forEach((unsubscribe) => unsubscribe()); root.remove(); } };
}
