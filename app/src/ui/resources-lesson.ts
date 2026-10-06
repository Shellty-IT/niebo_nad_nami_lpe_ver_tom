import resources from '../../.generated/resources.json';
import type { SceneId } from '../domain/probe';

export function mountResourcesLesson(container: HTMLElement, openScene: (scene: SceneId) => void, allowedScenes?: readonly SceneId[]) {
  const root = document.createElement('div'); root.className = 'nnb-resources';
  const groups = [
    ['film', '8.1 · Filmy'],
    ['simulation', '8.2 · Symulacje'],
    ['literature', '8.3 · Literatura i zasoby internetowe'],
  ] as const;
  for (const [group, name] of groups) {
    const section = document.createElement('section'); const heading = document.createElement('h3'); heading.textContent = name;
    section.append(heading);
    const entries = resources.resources.filter((item) => item.group === group);
    if (group === 'film') {
      const note = document.createElement('p');
      note.textContent = 'Filmy są dodatkowymi odsyłaczami do YouTube. Otwierają się dopiero po wybraniu linku i wymagają internetu; lekcja oraz jej wyjaśnienia działają bez nich.';
      section.append(note);
    }
    if (!entries.length) {
      const pending = document.createElement('p');
      pending.textContent = 'Brak dostępnych pozycji w tej grupie.';
      section.append(pending);
    }
    for (const entry of entries) {
      const article = document.createElement('article'); const title = document.createElement('h4'); title.textContent = entry.title;
      const description = document.createElement('p'); description.textContent = entry.description;
      const metadata = document.createElement('p'); metadata.className = 'nnb-note';
      metadata.textContent = `${entry.offline ? 'Dostępne offline' : 'Pełny zasób wymaga internetu'} · Źródło: ${entry.source} · Prawa: ${entry.license}.`;
      article.append(title, description, metadata);
      if (entry.sceneId && (!allowedScenes || allowedScenes.includes(entry.sceneId as SceneId))) {
        const local = document.createElement('button'); local.type = 'button'; local.textContent = `Otwórz lokalną scenę ${entry.sceneId}`;
        local.addEventListener('click', () => openScene(entry.sceneId as SceneId)); article.append(local);
      }
      if (entry.url) {
        const external = document.createElement('a'); external.href = entry.url; external.target = '_blank'; external.rel = 'noopener noreferrer';
        external.textContent = 'Otwórz zewnętrzne źródło w nowej karcie (wymaga internetu)'; article.append(external);
      }
      section.append(article);
    }
    root.append(section);
  }
  container.append(root);
  return { destroy() { root.remove(); } };
}
