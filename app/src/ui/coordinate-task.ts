import type { ProbeStore } from '../app/probe-store';
import type { HostAdapter } from '../hosts/host-adapter';

export function mountCoordinateTask(container: HTMLElement, store: ProbeStore, host: HostAdapter) {
  const degrees = new Intl.NumberFormat('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const section = document.createElement('section');
  section.className = 'nnb-coordinate-task';
  section.setAttribute('aria-label', 'Z02 — wysokość i azymut');
  const heading = document.createElement('h2'); heading.textContent = 'Z02 · Ustaw kierunek';
  const instruction = document.createElement('p');
  instruction.textContent = 'Ustaw środek mapy na azymut 90° i wysokość 30°. Azymut liczymy od północy przez wschód. Użyj przycisków kierunku przy mapie; cel można osiągnąć bez myszy.';
  const hypothesisLabel = document.createElement('label'); hypothesisLabel.textContent = 'Moja hipoteza: jak zmienię kierunek patrzenia?';
  const hypothesis = document.createElement('textarea'); hypothesis.maxLength = 500; hypothesis.rows = 2; hypothesisLabel.append(hypothesis);
  const conclusionLabel = document.createElement('label'); conclusionLabel.textContent = 'Mój wniosek po pomiarze';
  const conclusion = document.createElement('textarea'); conclusion.maxLength = 500; conclusion.rows = 2; conclusionLabel.append(conclusion);
  const controls = document.createElement('div'); controls.className = 'nnb-actions';
  const start = document.createElement('button'); start.type = 'button'; start.textContent = 'Rozpocznij zadanie';
  const check = document.createElement('button'); check.type = 'button'; check.textContent = 'Sprawdź kierunek';
  const leave = document.createElement('button'); leave.type = 'button'; leave.textContent = 'Wróć do swobodnej obserwacji';
  controls.append(start, check, leave);
  const feedback = document.createElement('p'); feedback.setAttribute('aria-live', 'polite');
  const report = document.createElement('p'); report.className = 'nnb-task-report';
  section.append(heading, instruction, hypothesisLabel, controls, feedback, conclusionLabel, report); container.append(section);
  function save() { void host.notifyStateChanged().catch(() => { feedback.textContent = 'Nie udało się zapisać wyniku. Wyeksportuj stan przed zamknięciem.'; }); }
  function render() {
    const state = store.getState();
    const task = state.coordinateTask;
    if (document.activeElement !== hypothesis) hypothesis.value = task.hypothesis;
    if (document.activeElement !== conclusion) conclusion.value = task.conclusion;
    hypothesis.disabled = store.isFrozen(); conclusion.disabled = store.isFrozen();
    start.disabled = store.isFrozen() || task.active;
    check.disabled = store.isFrozen() || !task.active || state.playbackRate !== 0;
    leave.disabled = store.isFrozen() || !task.active;
    const reading = task.lastReading;
    report.textContent = `Raport Z02: ${task.completedAtUtc ? 'cel osiągnięty' : 'cel nieukończony'}; próby: ${task.attempts}; najlepsza odległość kątowa: ${task.bestSeparationDeg === null ? 'brak pomiaru' : `${degrees.format(task.bestSeparationDeg)}°`}${task.completedAtUtc ? `; ukończono: ${task.completedAtUtc}` : ''}. ` +
      `Hipoteza: ${task.hypothesis || 'nie zapisana'}. Ostatni odczyt: ${reading ? `azymut ${degrees.format(reading.azimuthDeg)}°, wysokość ${degrees.format(reading.altitudeDeg)}°, odległość ${degrees.format(reading.separationDeg)}° (${reading.instantUtc})` : 'brak'}. Wniosek: ${task.conclusion || 'nie zapisany'}.`;
  }
  function saveNotes() { if (store.setTaskNotes(hypothesis.value.trim(), conclusion.value.trim())) save(); }
  hypothesis.addEventListener('change', saveNotes); conclusion.addEventListener('change', saveNotes);
  start.addEventListener('click', () => {
    if (store.startCoordinateTask()) { feedback.textContent = 'Zadanie rozpoczęte. Tolerancja: 2° od celu.'; save(); }
  });
  check.addEventListener('click', () => {
    const result = store.checkCoordinateTask();
    if (!result) return;
    feedback.textContent = result.completed
      ? `Cel osiągnięty. Odległość od celu: ${degrees.format(result.separationDeg)}°.`
      : `Jeszcze nie. Odległość od celu: ${degrees.format(result.separationDeg)}°. Zmień kierunek i spróbuj ponownie.`;
    save();
  });
  leave.addEventListener('click', () => {
    if (store.leaveCoordinateTask()) { feedback.textContent = 'Przywrócono poprzedni kierunek mapy.'; save(); }
  });
  const unsubscribe = store.subscribe(render); render();
  return { destroy() { unsubscribe(); section.remove(); } };
}
