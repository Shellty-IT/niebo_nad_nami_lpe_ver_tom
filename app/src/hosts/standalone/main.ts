import config from '../../../.generated/probe.json';
import { createProbeStore } from '../../app/probe-store';
import { parseConfig } from '../../domain/probe';
import { mountLocalShell } from '../../ui/local-shell';
import { LocalHostAdapter } from './local-host';
import { pl } from '../../i18n/pl';
import { LocalSession } from '../../persistence/local-session';
import { BrowserSession } from '../../persistence/browser-session';
import { loadLessonConfig } from '../../persistence/lesson-config';
import { lessonSettings } from '../../domain/lesson-settings';
import '../../styles/probe.css';

async function start() {
  const container = document.querySelector<HTMLElement>('#app');
  if (!container) throw new Error('Brak kontenera aplikacji.');
  let lessonInvalid = false;
  let lesson = parseConfig(config);
  try { lesson = loadLessonConfig(lesson, localStorage); } catch { lessonInvalid = true; }
  const store = createProbeStore(lesson);
  const settings = lessonSettings(lesson);
  store.setLevel(settings.defaultLevel);
  store.navigate(settings.sceneOrder[0]!);
  const session = new LocalSession(store, () => sessionStorage);
  const browserSession = new BrowserSession(store, session, localStorage);
  const restored = await browserSession.load();
  const host = new LocalHostAdapter(() => browserSession.save());
  const view = mountLocalShell(container, store, host, browserSession, lesson);
  if (!restored) view.setStatus(pl.restoreError);
  if (lessonInvalid) view.setStatus('Zapisana konfiguracja lekcji jest niepoprawna; użyto domyślnej. Sprawdź plik w narzędziach nauczyciela.');
  if (import.meta.hot) import.meta.hot.dispose(() => { view.destroy(); host.dispose(); });
}
void start();
