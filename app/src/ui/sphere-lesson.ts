import type { ProbeStore } from '../app/probe-store';
import { referenceCircles, type SkyPoint } from '../astronomy/sky-grids';

const ns = 'http://www.w3.org/2000/svg';
function svg<K extends keyof SVGElementTagNameMap>(tag: K) { return document.createElementNS(ns, tag); }
function project(point: SkyPoint) {
  const r = (90 - point.altitudeDeg) / 90 * 170;
  const angle = point.azimuthDeg * Math.PI / 180;
  return [200 + r * Math.sin(angle), 200 - r * Math.cos(angle)] as const;
}
function visiblePath(points: SkyPoint[]) {
  let path = ''; let drawing = false;
  for (const point of points) {
    if (point.altitudeDeg < 0) { drawing = false; continue; }
    const [x, y] = project(point);
    path += `${drawing ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)} `;
    drawing = true;
  }
  return path;
}

export function mountSphereLesson(container: HTMLElement, store: ProbeStore) {
  const section = document.createElement('section'); section.className = 'nnb-sphere-lesson';
  const intro = document.createElement('p');
  intro.textContent = 'Sfera niebieska jest umowną powierzchnią kierunków widzianych z miejsca obserwacji. Schemat pokazuje całą półkulę nad horyzontem: środek to zenit, brzeg to horyzont. Krzywe wynikają z wybranej chwili i miejsca; ich odległości na rysunku są umowne.';
  const lecture = document.createElement('details');
  const lectureTitle = document.createElement('summary'); lectureTitle.textContent = 'Krótki wykład — tekst do czytania';
  const lectureText = document.createElement('p');
  lectureText.textContent = 'Wyobraź sobie ogromną sferę ze środkiem w miejscu obserwacji. Zenit leży dokładnie nad głową, nadir pod stopami, a horyzont oddziela kierunki nad nami od tych pod ziemią. Równik niebieski to przedłużenie równika Ziemi, a ekliptyka wyznacza pozorną drogę Słońca w ciągu roku. Oś obrotu Ziemi wskazuje bieguny niebieskie. Przełącz warstwy i porównaj te kierunki; po zmianie czasu lub miejsca ich położenie względem horyzontu się zmienia.';
  lecture.append(lectureTitle, lectureText);
  const controls = document.createElement('div'); controls.className = 'nnb-sphere-layers';
  const descriptions = [
    ['horizon', 'Horyzont', 'Granica półkuli widocznej nad miejscem obserwacji.'],
    ['zenith', 'Zenit', 'Kierunek dokładnie nad głową; wysokość 90°. Nadir leży dokładnie pod obserwatorem.'],
    ['equator', 'Równik niebieski', 'Przedłużenie ziemskiego równika na sferę niebieską.'],
    ['ecliptic', 'Ekliptyka', 'Pozorna roczna droga środka Słońca na tle gwiazd.'],
    ['poles', 'Bieguny niebieskie', 'Kierunki osi obrotu Ziemi; na mapie widać tylko biegun nad horyzontem.'],
  ] as const;
  const layers = new Map<string, HTMLInputElement>();
  for (const [id, name, detail] of descriptions) {
    const label = document.createElement('label');
    const input = document.createElement('input'); input.type = 'checkbox'; input.checked = true;
    label.append(input, document.createTextNode(` ${name} — ${detail}`)); controls.append(label); layers.set(id, input);
  }
  const diagram = svg('svg'); diagram.setAttribute('viewBox', '0 0 400 400');
  diagram.setAttribute('role', 'img'); diagram.setAttribute('aria-label', 'Schemat półkuli nieba: zenit w środku, horyzont na brzegu; równik i ekliptyka zależą od czasu i miejsca.');
  const caption = document.createElement('p'); caption.className = 'nnb-note';
  const question = document.createElement('fieldset');
  const legend = document.createElement('legend'); legend.textContent = 'Sprawdź cel E1: który kierunek leży dokładnie nad głową?';
  const answer = document.createElement('select');
  for (const [value, title] of [['', 'Wybierz odpowiedź'], ['zenith', 'Zenit'], ['horizon', 'Horyzont'], ['nadir', 'Nadir']] as const) {
    const option = document.createElement('option'); option.value = value; option.textContent = title; answer.append(option);
  }
  const answerLabel = document.createElement('label'); answerLabel.textContent = 'Kierunek'; answerLabel.append(answer);
  const check = document.createElement('button'); check.type = 'button'; check.textContent = 'Sprawdź odpowiedź';
  const feedback = document.createElement('p'); feedback.setAttribute('aria-live', 'polite');
  question.append(legend, answerLabel, check, feedback);
  section.append(intro, lecture, controls, diagram, caption, question); container.append(section);
  function draw() {
    const state = store.getState(); const observation = state.observation;
    const grid = referenceCircles(observation.instantUtc, observation.observer);
    diagram.replaceChildren();
    function circle(radius: number, color: string) {
      const node = svg('circle'); node.setAttribute('cx', '200'); node.setAttribute('cy', '200');
      node.setAttribute('r', String(radius)); node.setAttribute('fill', 'none'); node.setAttribute('stroke', color); diagram.append(node);
    }
    function curve(points: SkyPoint[], color: string) {
      const node = svg('path'); node.setAttribute('d', visiblePath(points)); node.setAttribute('fill', 'none');
      node.setAttribute('stroke', color); node.setAttribute('stroke-width', '3'); diagram.append(node);
    }
    function label(point: SkyPoint, name: string, color: string) {
      if (point.altitudeDeg < 0) return;
      const [x, y] = project(point);
      const marker = svg('circle'); marker.setAttribute('cx', String(x)); marker.setAttribute('cy', String(y));
      marker.setAttribute('r', '5'); marker.setAttribute('fill', color); diagram.append(marker);
      const text = svg('text'); text.setAttribute('x', String(x + 8)); text.setAttribute('y', String(y - 8));
      text.setAttribute('fill', color); text.textContent = name; diagram.append(text);
    }
    if (layers.get('horizon')!.checked) circle(170, '#86caff');
    if (layers.get('equator')!.checked) curve(grid.equator, '#ffd166');
    if (layers.get('ecliptic')!.checked) curve(grid.ecliptic, '#ff9c7a');
    if (layers.get('zenith')!.checked) label({ azimuthDeg: 0, altitudeDeg: 90 }, 'Zenit', '#ffffff');
    if (layers.get('poles')!.checked) { label(grid.northPole, 'Biegun N', '#a8e2ff'); label(grid.southPole, 'Biegun S', '#a8e2ff'); }
    caption.textContent = `Obserwator: ${observation.observer.latitudeDeg.toFixed(2)}° szerokości, ${observation.observer.longitudeDeg.toFixed(2)}° długości; chwila ${observation.instantUtc}. Żółta krzywa: równik; pomarańczowa: ekliptyka. Nadir znajduje się pod horyzontem i nie jest rysowany.`;
    controls.querySelectorAll('input').forEach((input) => { input.disabled = store.isFrozen(); });
    answer.disabled = store.isFrozen(); check.disabled = store.isFrozen();
  }
  controls.addEventListener('change', draw);
  check.addEventListener('click', () => { feedback.textContent = answer.value === 'zenith'
    ? 'Tak. Zenit leży dokładnie nad głową; horyzont ma wysokość 0°.'
    : 'Spróbuj ponownie. Szukamy kierunku o wysokości 90°.'; });
  const unsubscribe = store.subscribe(draw); draw();
  return { destroy() { unsubscribe(); section.remove(); } };
}
