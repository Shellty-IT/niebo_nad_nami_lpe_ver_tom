import type { ProbeStore } from '../app/probe-store';
import type { SceneId } from '../domain/probe';
import type { HostAdapter } from '../hosts/host-adapter';
import { reportCsv, reportJson, sessionReportRows } from '../education/session-report';
import { mountAssessment } from './assessment';

function download(name: string, content: string, mime: string) {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const link = document.createElement('a'); link.href = url; link.download = name; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function mountSummaryLesson(container: HTMLElement, store: ProbeStore, host: HostAdapter, openScene: (scene: SceneId) => void) {
  const section = document.createElement('div'); section.className = 'nnb-summary-lesson';
  const overview = document.createElement('section');
  const heading = document.createElement('h3'); heading.textContent = '7.1 · Co już potrafisz?';
  const intro = document.createElement('p');
  intro.textContent = 'Sprawdź, jak miejsce i czas zmieniają widok nieba; odczytaj kierunek, rozpoznaj wzory gwiazd i wyjaśnij pozorny ruch ciał. Wynik zadania pokazuje wykonane pomiary, a otwarte wnioski wymagają rozmowy z nauczycielem.';
  const goals = document.createElement('ul');
  const items: Array<[SceneId, string]> = [
    ['E1', 'Sfera niebieska: horyzont, zenit i ekliptyka'],
    ['E2', 'Współrzędne: azymut, wysokość, rektascensja i deklinacja'],
    ['E3', 'Gwiazdozbiory i widok z obu półkul'],
    ['E4', 'Ruch dzienny, roczny, wsteczny i prawa Keplera'],
    ['E5', 'Planowanie obserwacji, fazy Księżyca i zaćmienia'],
    ['E6', 'Dobór narzędzia i odróżnienie obrazu fotograficznego od widoku przez okular'],
  ];
  for (const [id, label] of items) {
    const li = document.createElement('li'); const button = document.createElement('button');
    button.type = 'button'; button.textContent = label; button.addEventListener('click', () => openScene(id));
    li.append(button); goals.append(li);
  }
  overview.append(heading, intro, goals);

  const discussion = document.createElement('section');
  const discussionHeading = document.createElement('h3'); discussionHeading.textContent = '7.2 · Do dyskusji';
  const discussionText = document.createElement('p');
  discussionText.textContent = 'Jak obserwacje nieba pomagały mierzyć czas i orientować się w terenie? Które wyjaśnienie ruchu Marsa wymaga zmiany punktu widzenia? Czym różni się naukowy model od opowieści o gwiazdozbiorze? Porównaj odpowiedzi z innymi i wskaż obserwację, która je wspiera.';
  discussion.append(discussionHeading, discussionText);

  const results = document.createElement('section');
  const resultsHeading = document.createElement('h3'); resultsHeading.textContent = 'Moje wyniki i historia';
  const resultsDescription = document.createElement('p');
  resultsDescription.textContent = 'Raport zawiera zapisane próby, pomiary i wnioski. Puste pole oznacza brak zapisu; samo przejście do sceny nie oznacza ukończenia celu.';
  const summary = document.createElement('p'); summary.setAttribute('aria-live', 'polite');
  const tableWrap = document.createElement('div'); tableWrap.className = 'nnb-table-scroll';
  const table = document.createElement('table');
  const caption = document.createElement('caption'); caption.textContent = 'Zapisane wyniki sesji';
  const thead = document.createElement('thead'); const headerRow = document.createElement('tr');
  for (const title of ['Sekcja', 'Pole', 'Wartość']) { const th = document.createElement('th'); th.scope = 'col'; th.textContent = title; headerRow.append(th); }
  thead.append(headerRow); const tbody = document.createElement('tbody'); table.append(caption, thead, tbody); tableWrap.append(table);
  const actions = document.createElement('div'); actions.className = 'nnb-actions';
  const json = document.createElement('button'); json.type = 'button'; json.textContent = 'Pobierz raport JSON';
  json.addEventListener('click', () => download('niebo-nad-nami-raport.json', reportJson(store.getState()), 'application/json'));
  const csv = document.createElement('button'); csv.type = 'button'; csv.textContent = 'Pobierz raport CSV';
  csv.addEventListener('click', () => download('niebo-nad-nami-raport.csv', reportCsv(sessionReportRows(store.getState())), 'text/csv;charset=utf-8'));
  const print = document.createElement('button'); print.type = 'button'; print.textContent = 'Drukuj podsumowanie';
  print.addEventListener('click', () => window.print()); actions.append(json, csv, print);
  results.append(resultsHeading, resultsDescription, summary, tableWrap, actions);
  section.append(overview, discussion, results); container.append(section);
  const assessment = mountAssessment(section, store, host, openScene);
  function render() {
    const state = store.getState(); const rows = sessionReportRows(state);
    summary.textContent = `Z01: ${state.taskAttempts.some((attempt) => attempt.taskId === 'Z01' && attempt.correct) ? 'ukończone' : 'nieukończone'}. Planety nad horyzontem: ${state.taskAttempts.some((attempt) => attempt.taskId === 'VisiblePlanets' && attempt.correct) ? 'ukończone' : 'nieukończone'}. Z02: ${state.coordinateTask.completedAtUtc ? 'ukończone' : 'nieukończone'}, ${state.coordinateTask.attempts} prób. Z03: ${state.p3Tasks.sunRecords.length}/4 pomiary. Z04: ${state.p3Tasks.moonRecords.length}/4 pomiary. Z06: ${state.p3Tasks.telescope ? 'wynik zapisany' : 'brak wyniku'}. Obserwacje w dzienniku: ${state.observationJournal.length}.`;
    tbody.replaceChildren();
    for (const row of rows) {
      const tr = document.createElement('tr');
      for (const value of [row.section, row.item, row.value || '—']) {
        const td = document.createElement('td'); td.textContent = value; tr.append(td);
      }
      tbody.append(tr);
    }
  }
  const unsubscribe = store.subscribe(render); render();
  return { destroy() { unsubscribe(); assessment.destroy(); section.remove(); } };
}
