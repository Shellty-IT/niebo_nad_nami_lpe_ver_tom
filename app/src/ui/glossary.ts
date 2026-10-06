import glossary from '../../.generated/glossary.json';
import type { ProbeStore } from '../app/probe-store';
import type { SceneId } from '../domain/probe';

export function mountGlossary(container: HTMLElement, store: ProbeStore, openScene: (scene: SceneId) => void) {
  const details = document.createElement('details'); details.className = 'nnb-glossary';
  const summary = document.createElement('summary'); summary.textContent = 'Słownik pojęć';
  const searchLabel = document.createElement('label'); searchLabel.textContent = 'Szukaj pojęcia';
  const search = document.createElement('input'); search.type = 'search'; search.maxLength = 80;
  searchLabel.append(search);
  const list = document.createElement('dl'); details.append(summary, searchLabel, list); container.append(details);
  function render() {
    const query = search.value.trim().toLocaleLowerCase('pl');
    const basic = store.getState().level === 'basic';
    list.replaceChildren();
    for (const entry of glossary.terms) {
      if (!entry.term.toLocaleLowerCase('pl').includes(query) && !entry.simple.toLocaleLowerCase('pl').includes(query)) continue;
      const term = document.createElement('dt'); term.textContent = entry.term;
      const description = document.createElement('dd'); description.textContent = basic ? entry.simple : entry.extended;
      const source = document.createElement('button'); source.type = 'button'; source.textContent = `Otwórz ${entry.sceneId}`;
      source.addEventListener('click', () => openScene(entry.sceneId as SceneId));
      description.append(document.createTextNode(' '), source); list.append(term, description);
    }
    if (!list.childElementCount) { const empty = document.createElement('p'); empty.textContent = 'Brak pojęć dla tego wyszukiwania.'; list.append(empty); }
  }
  search.addEventListener('input', render);
  const unsubscribe = store.subscribe(render); render();
  return { destroy() { unsubscribe(); details.remove(); } };
}
