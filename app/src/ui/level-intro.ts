import levelTexts from '../../.generated/level-texts.json';
import type { ProbeStore } from '../app/probe-store';
import type { HostAdapter } from '../hosts/host-adapter';
import type { SceneId } from '../domain/probe';

const levelNames = { basic: 'podstawowy', extended: 'rozszerzony', expert: 'ekspercki' } as const;

export function mountLevelIntro(container: HTMLElement, sceneId: SceneId, store: ProbeStore, host: HostAdapter) {
  const scene = levelTexts.scenes.find((item) => item.id === sceneId);
  if (!scene) throw new Error(`Brak tekstu sceny ${sceneId}`);
  const text = scene;
  const section = document.createElement('section'); section.className = 'nnb-level-intro';
  const heading = document.createElement('h3'); heading.textContent = 'Wprowadzenie do sceny';
  const transcript = document.createElement('p'); transcript.className = 'nnb-transcript';
  const audio = document.createElement('audio'); audio.controls = true; audio.preload = 'none';
  const note = document.createElement('p'); note.className = 'nnb-note';
  note.textContent = 'Przykładowa narracja syntetyczna. Pełny tekst nagrania znajduje się powyżej.';
  section.append(heading, transcript, audio, note); container.append(section);
  let currentLevel = '';
  function render() {
    const level = store.getState().level;
    if (level === currentLevel) return;
    currentLevel = level;
    transcript.textContent = text[level];
    const suffix = level === 'basic' ? '' : `-${level}`;
    audio.pause();
    audio.src = host.resolveAsset(`media/p4/${sceneId.toLowerCase()}${suffix}-narracja.mp3`, 'engine');
    audio.setAttribute('aria-label', `Przykładowa narracja sceny ${sceneId}, poziom ${levelNames[level]}`);
  }
  const unsubscribe = store.subscribe(render);
  render();
  return { destroy() { unsubscribe(); audio.pause(); section.remove(); } };
}
