import { collectionCsv, MAX_REPORT_BYTES, parseSessionReport, reportKey } from '../../education/report-collection';
import { sessionReportRows } from '../../education/session-report';
import type { ProbeState } from '../../domain/probe';
import defaults from '../../../.generated/probe.json';
import { parseConfig } from '../../domain/probe';
import { LESSON_CONFIG_KEY, loadLessonConfig, MAX_LESSON_CONFIG_BYTES, parseLessonConfigJson } from '../../persistence/lesson-config';
import { mountLessonEditor } from '../../ui/lesson-editor';
import '../../styles/probe.css';

const mount = document.querySelector<HTMLElement>('#teacher');
if (!mount) throw new Error('Brak kontenera narzędzi nauczyciela.');
const root = document.createElement('section'); root.className = 'nnb nnb-teacher'; root.lang = 'pl';
const title = document.createElement('h1'); title.textContent = 'Narzędzia nauczyciela';
const intro = document.createElement('p');
intro.textContent = 'Raporty są wczytywane wyłącznie po wybraniu plików na tym urządzeniu. To narzędzie organizacyjne bez logowania i synchronizacji klasy. Nie dodawaj do notatek danych osobowych.';
const localLink = document.createElement('a'); localLink.href = './'; localLink.textContent = 'Wróć do aplikacji ucznia';
const reportSection = document.createElement('section');
const reportHeading = document.createElement('h2'); reportHeading.textContent = 'Raporty uczniów';
const fileLabel = document.createElement('label'); fileLabel.textContent = 'Wczytaj raporty JSON z E7';
const files = document.createElement('input'); files.type = 'file'; files.accept = '.json,application/json'; files.multiple = true; fileLabel.append(files);
const status = document.createElement('p'); status.setAttribute('role', 'status');
const summary = document.createElement('p');
const actions = document.createElement('div'); actions.className = 'nnb-actions';
const csv = document.createElement('button'); csv.type = 'button'; csv.textContent = 'Pobierz zbiorczy CSV'; csv.disabled = true;
const print = document.createElement('button'); print.type = 'button'; print.textContent = 'Drukuj raporty'; print.disabled = true;
actions.append(csv, print);
const reportList = document.createElement('div');
reportSection.append(reportHeading, fileLabel, status, summary, actions, reportList);
const configSection = document.createElement('section');
const configHeading = document.createElement('h2'); configHeading.textContent = 'Edytor lekcji';
const configIntro = document.createElement('p'); configIntro.textContent = 'Wyeksportowany plik konfiguracji można zastosować w aplikacji lokalnej albo przekazać jako dane instancji ZPE.';
const editorMount = document.createElement('div');
const configActions = document.createElement('div'); configActions.className = 'nnb-actions';
const configImport = document.createElement('input'); configImport.type = 'file'; configImport.accept = '.json,application/json';
const configImportLabel = document.createElement('label'); configImportLabel.textContent = 'Wczytaj konfigurację JSON'; configImportLabel.append(configImport);
const configExport = document.createElement('button'); configExport.type = 'button'; configExport.textContent = 'Pobierz konfigurację JSON';
const configApply = document.createElement('button'); configApply.type = 'button'; configApply.textContent = 'Zastosuj na tym urządzeniu';
const configStatus = document.createElement('p'); configStatus.setAttribute('role', 'status');
configActions.append(configImportLabel, configExport, configApply);
configSection.append(configHeading, configIntro, editorMount, configActions, configStatus);
root.append(title, intro, localLink, configSection, reportSection); mount.append(root);

let initialConfig = parseConfig(defaults);
try { initialConfig = loadLessonConfig(initialConfig, localStorage); }
catch { configStatus.textContent = 'Zapisana konfiguracja jest niepoprawna. Otworzono ustawienia domyślne.'; }
const editor = mountLessonEditor(editorMount, initialConfig);
configImport.addEventListener('change', () => {
  const file = configImport.files?.[0]; if (!file) return;
  void (async () => {
    if (file.size > MAX_LESSON_CONFIG_BYTES) throw new Error('lesson-too-large');
    editor.setConfig(parseLessonConfigJson(await file.text()));
    configStatus.textContent = 'Wczytano konfigurację do edytora. Zastosuj ją lub pobierz po sprawdzeniu.';
  })().catch(() => { configStatus.textContent = 'Niepoprawny plik konfiguracji. Wcześniejsze ustawienia pozostają w edytorze.'; })
    .finally(() => { configImport.value = ''; });
});
configExport.addEventListener('click', () => {
  try {
    const content = JSON.stringify(editor.getConfig(), null, 2) + '\n';
    const url = URL.createObjectURL(new Blob([content], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = 'niebo-nad-nami-konfiguracja.json'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    configStatus.textContent = 'Pobrano konfigurację lekcji.';
  } catch { configStatus.textContent = 'Popraw wskazane pola przed eksportem.'; }
});
configApply.addEventListener('click', () => {
  try {
    localStorage.setItem(LESSON_CONFIG_KEY, JSON.stringify(editor.getConfig()));
    configStatus.textContent = 'Zapisano konfigurację. Otwórz aplikację ucznia w nowej karcie, aby jej użyć.';
  } catch { configStatus.textContent = 'Nie udało się zapisać konfiguracji. Pobierz plik i zachowaj go.'; }
});

const reports = new Map<string, ProbeState>();
function render() {
  const states = [...reports.values()];
  summary.textContent = `Zaimportowane unikatowe sesje: ${states.length}. Ponowny import tej samej sesji i wersji zastępuje poprzedni podgląd.`;
  csv.disabled = states.length === 0; print.disabled = states.length === 0;
  reportList.replaceChildren();
  for (const state of states) {
    const section = document.createElement('section'); section.className = 'nnb-teacher-report';
    const heading = document.createElement('h3'); heading.textContent = `Sesja ${state.sessionId.slice(0, 8)} · wersja ${state.contentVersion}`;
    const tableWrap = document.createElement('div'); tableWrap.className = 'nnb-table-scroll';
    const table = document.createElement('table'); const caption = document.createElement('caption');
    caption.textContent = `Wyniki sesji ${state.sessionId.slice(0, 8)}`;
    const thead = document.createElement('thead'); const tr = document.createElement('tr');
    for (const name of ['Sekcja', 'Pole', 'Wartość']) { const th = document.createElement('th'); th.scope = 'col'; th.textContent = name; tr.append(th); }
    thead.append(tr); const tbody = document.createElement('tbody');
    for (const row of sessionReportRows(state)) {
      const bodyRow = document.createElement('tr');
      for (const value of [row.section, row.item, row.value || '—']) { const td = document.createElement('td'); td.textContent = value; bodyRow.append(td); }
      tbody.append(bodyRow);
    }
    table.append(caption, thead, tbody); tableWrap.append(table); section.append(heading, tableWrap); reportList.append(section);
  }
}
files.addEventListener('change', () => {
  const selected = [...(files.files ?? [])];
  void (async () => {
    let imported = 0; let rejected = 0;
    for (const file of selected) {
      try {
        if (file.size > MAX_REPORT_BYTES) throw new Error('report-too-large');
        const state = parseSessionReport(await file.text());
        if (reports.size >= 200 && !reports.has(reportKey(state))) throw new Error('report-limit');
        reports.set(reportKey(state), state); imported++;
      } catch { rejected++; }
    }
    status.textContent = `Wczytano: ${imported}. Odrzucono: ${rejected}. Błędne pliki nie zmieniły wcześniej wczytanych raportów.`;
    files.value = ''; render();
  })();
});
csv.addEventListener('click', () => {
  const url = URL.createObjectURL(new Blob([collectionCsv([...reports.values()])], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url; link.download = 'niebo-nad-nami-raporty.csv'; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
print.addEventListener('click', () => window.print());
render();
