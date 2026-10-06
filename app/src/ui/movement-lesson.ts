import { equatorialToHorizonMatrix, projectStar, stars } from '../astronomy/stars';
import { Body, Equator, Observer } from 'astronomy-engine';
import { barnardProperMotionArcmin, marsTrack, precessionModel } from '../astronomy/movement';
import { orbitPoint, orbitalPeriodYears, sweptAreaAu2 } from '../astronomy/kepler';
import type { ProbeStore } from '../app/probe-store';

const ns = 'http://www.w3.org/2000/svg';
function svg<K extends keyof SVGElementTagNameMap>(tag: K) { return document.createElementNS(ns, tag); }
function section(title: string) {
  const node = document.createElement('section');
  const heading = document.createElement('h3'); heading.textContent = title; node.append(heading); return node;
}
function range(labelText: string, min: number, max: number, step: number, value: number) {
  const label = document.createElement('label'); label.textContent = labelText;
  const input = document.createElement('input'); input.type = 'range'; input.min = String(min); input.max = String(max);
  input.step = String(step); input.value = String(value); label.append(input); return { label, input };
}
function text(value: string) { const node = document.createElement('p'); node.textContent = value; return node; }
function scrollTable(table: HTMLTableElement) {
  const wrapper = document.createElement('div'); wrapper.className = 'nnb-table-scroll'; wrapper.tabIndex = 0;
  wrapper.append(table); return wrapper;
}
function tableHead(labels: string[]) {
  const head = document.createElement('thead'); const row = document.createElement('tr');
  for (const label of labels) { const cell = document.createElement('th'); cell.scope = 'col'; cell.textContent = label; row.append(cell); }
  head.append(row); return head;
}

export function mountMovementLesson(container: HTMLElement, store: ProbeStore) {
  const root = document.createElement('div'); root.className = 'nnb-movement'; container.append(root);

  const stellar = section('4.1 · Ruch pozorny, własny i precesja');
  stellar.append(text('W ciągu doby gwiazdy zmieniają położenie względem lokalnego horyzontu głównie wskutek obrotu Ziemi. Ruch własny to powolna rzeczywista zmiana kierunku gwiazdy względem innych gwiazd.'));
  const daily = document.createElement('table');
  const dailyCaption = document.createElement('caption'); dailyCaption.textContent = 'Syriusz (HIP 32349) w czterech chwilach jednej doby — lokalny horyzont';
  const dailyBody = document.createElement('tbody'); daily.append(dailyCaption, tableHead(['Chwila UTC', 'Azymut', 'Wysokość']), dailyBody);
  const barnard = text(''); const precession = range('Model precesji: lata od umownej epoki', 0, 26000, 500, 0);
  const precessionReadout = text('');
  const precessionSvg = svg('svg'); precessionSvg.setAttribute('viewBox', '0 0 300 300');
  precessionSvg.setAttribute('role', 'img'); precessionSvg.setAttribute('aria-label', 'Schemat stożka precesji osi Ziemi; pozycja znacznika odpowiada wybranej fazie cyklu.');
  stellar.append(scrollTable(daily), barnard, text('Model długookresowy: oś Ziemi zatacza w przybliżeniu stożek w około 26 tysiącach lat. Schemat nie jest efemerydą planet ani dokładną prognozą położenia bieguna w odległej epoce.'), precession.label, precessionReadout, precessionSvg);

  const annual = section('4.1.2 · Ruch roczny i pory roku');
  annual.append(text('Przy tej samej godzinie UTC gwiazdy mają inny kierunek w kolejnych porach roku. Deklinacja Słońca zmienia się podczas obiegu Ziemi. Pory roku wynikają głównie z nachylenia osi Ziemi (około 23,4°), a na obu półkulach są przeciwne.'));
  const annualTable = document.createElement('table'); const annualCaption = document.createElement('caption');
  annualCaption.textContent = 'Cztery daty roku 2025, to samo miejsce; Syriusz o 20:00 UTC';
  const annualBody = document.createElement('tbody');
  annualTable.append(annualCaption, tableHead(['Data', 'Deklinacja Słońca (°)', 'Przybliżona wysokość górowania Słońca (°)', 'Wysokość Syriusza o 20:00 UTC (°)']), annualBody);
  const annualQuestion = document.createElement('fieldset');
  const annualLegend = document.createElement('legend'); annualLegend.textContent = 'Sprawdź cel: gdy półkula północna jest nachylona ku Słońcu, jaka pora roku trwa tam zwykle?';
  const annualAnswer = document.createElement('select');
  for (const [value, label] of [['', 'Wybierz odpowiedź'], ['summer', 'Lato'], ['winter', 'Zima']] as const) {
    const option = document.createElement('option'); option.value = value; option.textContent = label; annualAnswer.append(option);
  }
  const annualLabel = document.createElement('label'); annualLabel.textContent = 'Pora roku'; annualLabel.append(annualAnswer);
  const annualCheck = document.createElement('button'); annualCheck.type = 'button'; annualCheck.textContent = 'Sprawdź pory roku';
  const annualFeedback = text(''); annualFeedback.setAttribute('aria-live', 'polite');
  annualQuestion.append(annualLegend, annualLabel, annualCheck, annualFeedback);
  annual.append(scrollTable(annualTable), text('Wysokość górowania to wzór geometryczny 90° − |szerokość geograficzna − deklinacja|. Wysokość ujemna oznacza, że środek Słońca nie góruje nad horyzontem. Daty służą porównaniu, nie są dokładnymi chwilami równonocy i przesileń.'), annualQuestion);

  const retrograde = section('4.2.1 · Ruch prosty i wsteczny Marsa');
  retrograde.append(text('Ślad przedstawia topocentryczny kierunek Marsa na tle gwiazd w układzie J2000. Wsteczność to chwilowa zmiana kierunku ruchu kątowego wskutek zmieniającej się perspektywy Ziemi; Mars nie odwraca biegu wokół Słońca.'));
  const track = marsTrack(store.getState().observation.observer);
  const date = range('Krok śladu Marsa — od października 2024', 0, track.length - 1, 1, 0);
  const marsReadout = text('');
  const marsSvg = svg('svg'); marsSvg.setAttribute('viewBox', '0 0 600 260');
  marsSvg.setAttribute('role', 'img'); marsSvg.setAttribute('aria-label', 'Ślad rektascensji i deklinacji Marsa od października 2024 do kwietnia 2025; odpowiednik liczbowy znajduje się w tabeli.');
  const marsTable = document.createElement('table'); const marsCaption = document.createElement('caption');
  marsCaption.textContent = 'Ślad Marsa — RA i deklinacja J2000, co 7 dni';
  const marsBody = document.createElement('tbody'); marsTable.append(marsCaption, tableHead(['Data UTC', 'RA J2000 (h)', 'Deklinacja J2000 (°)']), marsBody);
  const retroQuestion = document.createElement('fieldset');
  const retroLegend = document.createElement('legend'); retroLegend.textContent = 'Sprawdź cel: w którym okresie Mars przesuwał się wstecz względem gwiazd?';
  const retroAnswer = document.createElement('select');
  for (const [id, label] of [['', 'Wybierz okres'], ['winter', 'Grudzień 2024 – luty 2025'], ['spring', 'Marzec – kwiecień 2025']] as const) {
    const option = document.createElement('option'); option.value = id; option.textContent = label; retroAnswer.append(option);
  }
  const retroLabel = document.createElement('label'); retroLabel.textContent = 'Okres'; retroLabel.append(retroAnswer);
  const retroCheck = document.createElement('button'); retroCheck.type = 'button'; retroCheck.textContent = 'Sprawdź okres';
  const retroFeedback = text(''); retroFeedback.setAttribute('aria-live', 'polite');
  retroQuestion.append(retroLegend, retroLabel, retroCheck, retroFeedback);
  retrograde.append(date.label, marsReadout, marsSvg, scrollTable(marsTable), retroQuestion);

  const kepler = section('4.2.2 · Trzy prawa Keplera');
  kepler.append(text('Schemat heliocentryczny pokazuje orbitę w płaszczyźnie. Odległości są w au i skalowane do widoku; punkt planety oraz rozmiar Słońca są symboliczne. Zmiana parametrów dotyczy wyłącznie eksperymentu, nie zmienia rzeczywistych efemeryd nieba.'));
  const axis = range('Półoś wielka a (au)', 0.5, 4, 0.1, 1.5);
  const eccentricity = range('Mimośród e', 0, 0.7, 0.05, 0.3);
  const phase = range('Faza orbity — część okresu', 0, 100, 1, 0);
  const orbitSvg = svg('svg'); orbitSvg.setAttribute('viewBox', '0 0 440 330');
  orbitSvg.setAttribute('role', 'img'); orbitSvg.setAttribute('aria-label', 'Elipsa z ogniskiem Słońca, położeniem planety i dwoma sektorami zakreślonymi w równym czasie.');
  const orbitReadout = text('');
  const orbitConclusion = text('');
  kepler.append(axis.label, eccentricity.label, phase.label, orbitSvg, orbitReadout, orbitConclusion);
  root.append(stellar, annual, retrograde, kepler);

  function drawStellar() {
    const observation = store.getState().observation;
    const sirius = stars.find((item) => item.id === 32349)!;
    dailyBody.replaceChildren();
    const start = Date.parse(observation.instantUtc);
    for (const hours of [0, 6, 12, 18]) {
      const instant = new Date(start + hours * 3_600_000).toISOString();
      const position = projectStar(sirius, instant, equatorialToHorizonMatrix(instant, observation.observer), false);
      const row = document.createElement('tr');
      for (const [index, value] of [instant, `${position.azimuthDeg.toFixed(1)}°`, `${position.altitudeDeg.toFixed(1)}°`].entries()) {
        const cell = document.createElement(index === 0 ? 'th' : 'td'); if (index === 0) cell.setAttribute('scope', 'row');
        cell.textContent = value; row.append(cell);
      }
      dailyBody.append(row);
    }
    barnard.textContent = `Gwiazda Barnarda (HIP 87937): kierunek wynikający z jej ruchu własnego zmienia się o ${barnardProperMotionArcmin('1950-01-01T00:00:00.000Z', '2050-01-01T00:00:00.000Z').toFixed(1)}′ między 1950 a 2050 r. To inna skala czasu niż dobowa zmiana kierunku Syriusza.`;
  }
  function drawPrecession() {
    const model = precessionModel(Number(precession.input.value));
    precessionReadout.textContent = `Rok modelu: +${model.yearOffset}; faza ${(model.phaseRad * 180 / Math.PI).toFixed(0)}°; półkąt stożka ${model.coneRadiusDeg}°. Po około 26 tys. lat schemat wraca do punktu początkowego.`;
    precessionSvg.replaceChildren();
    const ring = svg('circle'); ring.setAttribute('cx', '150'); ring.setAttribute('cy', '150'); ring.setAttribute('r', '100');
    ring.setAttribute('stroke', '#86caff'); ring.setAttribute('fill', 'none'); precessionSvg.append(ring);
    const marker = svg('circle'); marker.setAttribute('cx', String(150 + 100 * model.x)); marker.setAttribute('cy', String(150 - 100 * model.y));
    marker.setAttribute('r', '9'); marker.setAttribute('fill', '#ffd166'); precessionSvg.append(marker);
  }
  function drawAnnual() {
    const location = store.getState().observation.observer;
    const observer = new Observer(location.latitudeDeg, location.longitudeDeg, location.heightM);
    const sirius = stars.find((item) => item.id === 32349)!;
    annualBody.replaceChildren();
    for (const date of ['2025-03-20', '2025-06-21', '2025-09-22', '2025-12-21']) {
      const time = `${date}T20:00:00.000Z`;
      const solarDec = Equator(Body.Sun, new Date(time), observer, true, true).dec;
      const noonAltitude = 90 - Math.abs(location.latitudeDeg - solarDec);
      const siriusAltitude = projectStar(sirius, time, equatorialToHorizonMatrix(time, location), false).altitudeDeg;
      const row = document.createElement('tr');
      for (const [index, value] of [date, solarDec.toFixed(1), noonAltitude.toFixed(1), siriusAltitude.toFixed(1)].entries()) {
        const cell = document.createElement(index === 0 ? 'th' : 'td'); if (index === 0) cell.setAttribute('scope', 'row');
        cell.textContent = value; row.append(cell);
      }
      annualBody.append(row);
    }
  }
  function drawMars() {
    const points = marsTrack(store.getState().observation.observer);
    const index = Number(date.input.value); const chosen = points[index]!;
    marsReadout.textContent = `${chosen.instantUtc.slice(0, 10)}: RA ${chosen.raHoursJ2000.toFixed(3)} h, deklinacja ${chosen.decDegJ2000.toFixed(2)}°. Opozycja: 16.01.2025; od 07.12.2024 do 23.02.2025 NASA opisuje ruch wsteczny.`;
    marsSvg.replaceChildren();
    const ras = points.map((item) => item.raHoursJ2000); const decs = points.map((item) => item.decDegJ2000);
    const minRa = Math.min(...ras); const maxRa = Math.max(...ras); const minDec = Math.min(...decs); const maxDec = Math.max(...decs);
    const xy = (point: typeof chosen) => [30 + (point.raHoursJ2000 - minRa) / (maxRa - minRa) * 540,
      230 - (point.decDegJ2000 - minDec) / (maxDec - minDec) * 200] as const;
    const path = svg('path'); path.setAttribute('d', points.map((point, i) => `${i ? 'L' : 'M'}${xy(point)[0].toFixed(1)} ${xy(point)[1].toFixed(1)}`).join(' '));
    path.setAttribute('stroke', '#ffd166'); path.setAttribute('fill', 'none'); path.setAttribute('stroke-width', '3'); marsSvg.append(path);
    const marker = svg('circle'); marker.setAttribute('cx', String(xy(chosen)[0])); marker.setAttribute('cy', String(xy(chosen)[1]));
    marker.setAttribute('r', '7'); marker.setAttribute('fill', '#ff9c7a'); marsSvg.append(marker);
    marsBody.replaceChildren();
    for (const point of points) {
      const row = document.createElement('tr');
      for (const [index, value] of [point.instantUtc.slice(0, 10), point.raHoursJ2000.toFixed(3), point.decDegJ2000.toFixed(2)].entries()) {
        const cell = document.createElement(index === 0 ? 'th' : 'td'); if (index === 0) cell.setAttribute('scope', 'row');
        cell.textContent = value; row.append(cell);
      }
      marsBody.append(row);
    }
  }
  function drawOrbit() {
    const a = Number(axis.input.value); const e = Number(eccentricity.input.value); const m = Number(phase.input.value) / 100 * 2 * Math.PI;
    const period = orbitalPeriodYears(a); const point = orbitPoint(a, e, m);
    const scale = 130 / (a * (1 + e)); const x = (value: number) => 220 + value * scale; const y = (value: number) => 165 - value * scale;
    orbitSvg.replaceChildren();
    function orbitPath(start: number, end: number, step: number) {
      const values: string[] = [];
      for (let value = start; value <= end + 1e-8; value += step) {
        const item = orbitPoint(a, e, value); values.push(`${values.length ? 'L' : 'M'}${x(item.xAu).toFixed(2)} ${y(item.yAu).toFixed(2)}`);
      }
      return values.join(' ');
    }
    for (const [start, fill] of [[0, '#345779'], [Math.PI, '#5d5265']] as const) {
      const sector = svg('path'); sector.setAttribute('d', `M220 165 ${orbitPath(start, start + Math.PI / 6, Math.PI / 72)} Z`);
      sector.setAttribute('fill', fill); orbitSvg.append(sector);
    }
    const curve = svg('path'); curve.setAttribute('d', orbitPath(0, 2 * Math.PI, Math.PI / 90));
    curve.setAttribute('fill', 'none'); curve.setAttribute('stroke', '#86caff'); curve.setAttribute('stroke-width', '2'); orbitSvg.append(curve);
    for (const [cx, cy, radius, fill] of [[220, 165, 8, '#ffd166'], [x(point.xAu), y(point.yAu), 7, '#ff9c7a']] as const) {
      const marker = svg('circle'); marker.setAttribute('cx', String(cx)); marker.setAttribute('cy', String(cy));
      marker.setAttribute('r', String(radius)); marker.setAttribute('fill', fill); orbitSvg.append(marker);
    }
    const areaA = sweptAreaAu2(a, e, 0, Math.PI / 6); const areaB = sweptAreaAu2(a, e, Math.PI, Math.PI + Math.PI / 6);
    orbitReadout.textContent = `I. Elipsa: a=${a.toFixed(1)} au, e=${e.toFixed(2)}, Słońce w ognisku; odległość planety ${point.radiusAu.toFixed(2)} au. II. Równe odstępy czasu T/12: pola ${areaA.toFixed(3)} i ${areaB.toFixed(3)} au². III. T=${period.toFixed(2)} lat; T²=${(period ** 2).toFixed(2)}, a³=${(a ** 3).toFixed(2)}.`;
    orbitConclusion.textContent = 'Zmień mimośród, aby porównać kształt i prędkość przy Słońcu; zmień półosię, aby porównać okres. Równe pola wynikają z równych części okresu mimo różnej długości łuku.';
  }
  precession.input.addEventListener('input', drawPrecession);
  date.input.addEventListener('input', drawMars);
  for (const input of [axis.input, eccentricity.input, phase.input]) input.addEventListener('input', drawOrbit);
  retroCheck.addEventListener('click', () => { retroFeedback.textContent = retroAnswer.value === 'winter'
    ? 'Tak. W tym okresie rektascensja Marsa maleje względem gwiazd; to zmiana pozornego kierunku.'
    : 'Sprawdź, w której części śladu rektascensja przez kolejne tygodnie maleje.'; });
  annualCheck.addEventListener('click', () => { annualFeedback.textContent = annualAnswer.value === 'summer'
    ? 'Tak. Na półkuli południowej w tym samym czasie jest zima.'
    : 'Sprawdź, która półkula otrzymuje wtedy bardziej bezpośrednie promienie Słońca.'; });
  function update() {
    drawStellar(); drawAnnual(); drawMars();
    const frozen = store.isFrozen();
    root.querySelectorAll('input, select, button').forEach((control) => { (control as HTMLInputElement).disabled = frozen; });
  }
  const unsubscribe = store.subscribe(update);
  update(); drawPrecession(); drawOrbit();
  return { destroy() { unsubscribe(); root.remove(); } };
}
