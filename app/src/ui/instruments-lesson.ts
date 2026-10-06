import { telescopeReading, exposureSignalRatio, type Instrument } from '../astronomy/telescope';
import type { ProbeStore } from '../app/probe-store';
import type { mountInstrumentModel } from '../rendering/telescope/model';
import { p3Images } from '../../.generated/p3-images.js';
import { calculateSnapshot } from '../astronomy/ephemeris';

const ns = 'http://www.w3.org/2000/svg';
let fieldInstance = 0;
function svg<K extends keyof SVGElementTagNameMap>(tag: K) { return document.createElementNS(ns, tag); }
function section(title: string) { const node = document.createElement('section'); const h = document.createElement('h3'); h.textContent = title; node.append(h); return node; }
function paragraph(value = '') { const node = document.createElement('p'); node.textContent = value; return node; }
function range(label: string, min: number, max: number, step: number, value: number) {
  const labelNode = document.createElement('label'); labelNode.textContent = label;
  const input = document.createElement('input'); input.type = 'range'; input.min = String(min); input.max = String(max);
  input.step = String(step); input.value = String(value); labelNode.append(input);
  return { label: labelNode, input };
}

export function mountInstrumentsLesson(container: HTMLElement, store: ProbeStore) {
  const root = document.createElement('div'); root.className = 'nnb-instruments'; container.append(root);
  const optics = section('6.1 · Lornetka, refraktor i reflektor');
  optics.append(paragraph('Lornetka korzysta z dwóch torów optycznych. Refraktor skupia światło soczewką, a reflektor zwierciadłem. W każdym przykładzie powiększenie to ogniskowa instrumentu podzielona przez ogniskową okularu.'));
  const typeLabel = document.createElement('label'); typeLabel.textContent = 'Instrument';
  const type = document.createElement('select');
  for (const [id, label] of [['binoculars', 'Lornetka'], ['refractor', 'Refraktor'], ['reflector', 'Reflektor']] as const) {
    const option = document.createElement('option'); option.value = id; option.textContent = label; type.append(option);
  }
  typeLabel.append(type);
  const focal = range('Ogniskowa instrumentu (mm)', 200, 2000, 50, 900);
  const aperture = range('Apertura (mm)', 40, 300, 10, 90);
  const eyepiece = range('Ogniskowa okularu (mm)', 5, 50, 1, 25);
  const apparent = range('Pozorne pole okularu (°)', 40, 100, 5, 60);
  const targetLabel = document.createElement('label'); targetLabel.textContent = 'Cel w polu widzenia';
  const target = document.createElement('select');
  for (const [id, label] of [['Moon', 'Księżyc'], ['Jupiter', 'Jowisz'], ['M31', 'Galaktyka Andromedy (M31)'],
    ['M42', 'Centralne pole Mgławicy Oriona (M42)']] as const) {
    const option = document.createElement('option'); option.value = id; option.textContent = label; target.append(option);
  }
  targetLabel.append(target);
  const readout = paragraph(); readout.className = 'nnb-telescope-readout'; readout.setAttribute('aria-live', 'polite');
  const diagram = svg('svg'); diagram.setAttribute('viewBox', '0 0 420 190'); diagram.setAttribute('role', 'img');
  diagram.setAttribute('aria-label', 'Schemat toru światła: soczewka w refraktorze lub zwierciadło w reflektorze. Odczyty modelu są dostępne tekstowo.');
  const field = svg('svg'); field.setAttribute('viewBox', '0 0 300 300'); field.setAttribute('role', 'img');
  const fieldClipId = `nnb-field-${++fieldInstance}`;
  field.setAttribute('aria-label', 'Schemat pola widzenia okularu i rozmiaru kątowego wybranego celu. Wartości są w odczycie tekstowym.');
  const fieldNote = paragraph();
  const modelHeading = document.createElement('h4'); modelHeading.textContent = 'Model przestrzenny instrumentu';
  const modelContainer = document.createElement('div'); modelContainer.className = 'nnb-instrument-model';
  const modelStatus = paragraph('Ładowanie modelu przestrzennego…');
  const rotation = paragraph();
  const rotateLeft = document.createElement('button'); rotateLeft.type = 'button'; rotateLeft.textContent = 'Obróć model w lewo';
  const rotateRight = document.createElement('button'); rotateRight.type = 'button'; rotateRight.textContent = 'Obróć model w prawo';
  const modelControls = document.createElement('div'); modelControls.className = 'nnb-actions'; modelControls.append(rotateLeft, rotateRight);
  optics.append(typeLabel, focal.label, aperture.label, eyepiece.label, apparent.label, targetLabel, modelHeading, modelContainer, modelStatus, modelControls, rotation, diagram, readout, field, fieldNote,
    paragraph('Model pola to przybliżenie pozornego pola okularu podzielonego przez powiększenie. Limit dyfrakcyjny jest wartością idealną; atmosfera, optyka i jasność obiektu zwykle pogarszają obraz. Zwiększenie powiększenia nie ujawnia szczegółów, których model nie zawiera.'));

  const task = document.createElement('fieldset'); const legend = document.createElement('legend');
  legend.textContent = 'Sprawdź cel: co stanie się z polem widzenia, gdy przy tym samym instrumencie wybierzesz okular o krótszej ogniskowej?';
  const answerLabel = document.createElement('label'); answerLabel.textContent = 'Odpowiedź';
  const answer = document.createElement('select');
  for (const [value, label] of [['', 'Wybierz'], ['smaller', 'Pole się zmniejszy'], ['larger', 'Pole się zwiększy']] as const) {
    const option = document.createElement('option'); option.value = value; option.textContent = label; answer.append(option);
  }
  answerLabel.append(answer);
  const feedback = paragraph(); feedback.setAttribute('aria-live', 'polite');
  const priorTelescope = store.getState().p3Tasks.telescope;
  if (priorTelescope) feedback.textContent = `Z06 zapisane: okular ${priorTelescope.eyepieceMm} mm, ${priorTelescope.magnification.toFixed(1)}×, pole ${priorTelescope.fieldDeg.toFixed(2)}°. Wniosek: ${priorTelescope.conclusion || 'nie podano'}.`;
  const taskConclusionLabel = document.createElement('label'); taskConclusionLabel.textContent = 'Wniosek o polu i limicie szczegółowości';
  const taskConclusion = document.createElement('textarea'); taskConclusion.rows = 2; taskConclusion.maxLength = 500;
  taskConclusion.value = store.getState().p3Tasks?.telescope?.conclusion ?? ''; taskConclusionLabel.append(taskConclusion);
  const check = document.createElement('button'); check.type = 'button'; check.textContent = 'Sprawdź dobór okularu';
  check.addEventListener('click', () => {
    const selectedMm = Number(eyepiece.input.value);
    if (selectedMm >= 25) { feedback.textContent = 'Wybierz okular o ogniskowej krótszej niż 25 mm i porównaj z wartością początkową.'; return; }
    if (answer.value !== 'smaller') { feedback.textContent = 'Porównaj pole rzeczywiste dla 25 mm i wybranego krótszego okularu.'; return; }
    const result = telescopeReading({ instrument: type.value as Instrument, focalLengthMm: Number(focal.input.value),
      apertureMm: Number(aperture.input.value), eyepieceFocalMm: selectedMm, apparentFieldDeg: Number(apparent.input.value) });
    const tasks = store.getState().p3Tasks!;
    if (store.saveP3Tasks({ ...tasks, telescope: { eyepieceMm: selectedMm, magnification: result.magnification,
      fieldDeg: result.trueFieldDeg, prediction: 'smaller', conclusion: taskConclusion.value.trim() } })) {
      feedback.textContent = `Z06 zapisane: okular ${selectedMm} mm, ${result.magnification.toFixed(1)}×, pole ${result.trueFieldDeg.toFixed(2)}°. Krótsza ogniskowa zwiększa powiększenie i zmniejsza pole; limit szczegółowości wyznaczają także apertura i warunki.`;
    }
  });
  task.append(legend, answerLabel, taskConclusionLabel, check, feedback); optics.append(task);

  const photo = section('6.2 · Fotografia i analiza obrazu');
  photo.append(paragraph('Oko i okular pokazują obraz bieżący. Zdjęcie może zbierać światło przez dłuższy czas, a obróbka może uwydatnić barwy i słabe struktury. Symulacja poniżej pokazuje tylko proporcję zebranego sygnału przy niezmienionych pozostałych warunkach; nie wytwarza realistycznego zdjęcia.'));
  const exposure = range('Czas ekspozycji (s)', 1, 120, 1, 10);
  const exposureReadout = paragraph(); exposureReadout.setAttribute('aria-live', 'polite');
  const photoQuestion = paragraph('Wynik liczbowy opisuje zebrany sygnał, nie liczbę widocznych szczegółów. W prawdziwym zdjęciu znaczenie mają również szum, prowadzenie, czułość i obróbka.');
  photo.append(exposure.label, exposureReadout, photoQuestion);
  const images = [
    { path: p3Images.m31, title: 'M31 · obraz w ultrafiolecie', alt: 'Galaktyka Andromedy w przetworzonych barwach ultrafioletu; jasne centrum i rozległe ramiona.',
      method: 'GALEX: mozaika 10 obserwacji z września 2003. Bliski ultrafiolet pokazano czerwienią, daleki — błękitem. Kolory są przypisane danym, nie odpowiadają widokowi przez okular.',
      source: 'https://science.nasa.gov/photojournal/andromeda-galaxy/', credit: 'NASA/JPL/California Institute of Technology · PIA04921' },
    { path: p3Images.m42, title: 'M42 · obraz w podczerwieni', alt: 'Mgławica Oriona w przypisanych barwach podczerwieni; gwiazdy i ciemniejsze struktury pyłu.',
      method: 'Spitzer/IRAC: długość fali 3,6 µm oznaczono błękitem, a 4,5 µm pomarańczą. To kompozycja danych podczerwonych, nie widok gołym okiem.',
      source: 'https://science.nasa.gov/photojournal/orions-dreamy-stars/', credit: 'NASA/JPL-Caltech · PIA13005' },
  ];
  for (const item of images) {
    const figure = document.createElement('figure');
    const image = document.createElement('img'); image.src = item.path; image.alt = item.alt; image.loading = 'lazy';
    const caption = document.createElement('figcaption'); caption.textContent = `${item.title}. ${item.method} Źródło: ${item.credit}. `;
    const source = document.createElement('a'); source.href = item.source; source.textContent = 'Karta NASA/JPL';
    source.target = '_blank'; source.rel = 'noopener noreferrer'; caption.append(source); figure.append(image, caption); photo.append(figure);
  }
  const analysisTask = document.createElement('fieldset');
  const analysisLegend = document.createElement('legend'); analysisLegend.textContent = 'Analiza obrazu: czego dowiesz się z porównania M31 i M42?';
  const analysisLabel = document.createElement('label'); analysisLabel.textContent = 'Wybierz trafne stwierdzenie';
  const analysisAnswer = document.createElement('select');
  for (const [value,label] of [['', 'Wybierz'], ['bands', 'Różne pasma i przypisane barwy pokazują różne struktury'],
    ['eyepiece', 'Barwy na zdjęciach są dokładnie tym, co widać przez okular']] as const) {
    const option = document.createElement('option'); option.value = value; option.textContent = label; analysisAnswer.append(option);
  }
  analysisLabel.append(analysisAnswer); const analysisFeedback = paragraph(); analysisFeedback.setAttribute('aria-live', 'polite');
  const analysisCheck = document.createElement('button'); analysisCheck.type = 'button'; analysisCheck.textContent = 'Sprawdź analizę';
  analysisCheck.addEventListener('click', () => { analysisFeedback.textContent = analysisAnswer.value === 'bands'
    ? 'Tak. M31 pokazuje ultrafiolet, M42 podczerwień; obie ilustracje mają umownie przypisane barwy i ujawniają różne struktury.'
    : 'Sprawdź pasma i opis barw pod obydwoma obrazami.'; });
  analysisTask.append(analysisLegend, analysisLabel, analysisCheck, analysisFeedback); photo.append(analysisTask);

  const software = section('6.3 · Programy do planowania obserwacji');
  software.append(paragraph('Stellarium i SkySafari to przykłady programów do sprawdzania nieba dla miejsca i chwili. W tej lekcji możesz wykonać porównania w E2 i E5 bez instalowania żadnego z nich. Przed wyjściem w teren porównaj plan z aktualną pogodą i warunkami horyzontu.'));
  root.append(optics, photo, software);
  let model: ReturnType<typeof mountInstrumentModel> | null = null;
  let destroyed = false; let modelAngle = 25;
  void import('../rendering/telescope/model').then(({ mountInstrumentModel: mount }) => {
    if (destroyed) return;
    model = mount(modelContainer, () => { modelStatus.textContent = 'Utracono WebGL2; schemat 2D i odczyty pozostają dostępne.'; });
    modelStatus.textContent = model ? 'Model 3D jest schematem budowy, nie symulacją obrazu w okularze.' : 'Brak WebGL2; użyj schematu 2D i odczytów poniżej.';
    model?.update(type.value as Instrument, modelAngle);
  }).catch(() => { if (!destroyed) modelStatus.textContent = 'Model 3D niedostępny; użyj schematu 2D i odczytów poniżej.'; });
  function rotate(delta: number) {
    modelAngle = (modelAngle + delta + 360) % 360;
    model?.update(type.value as Instrument, modelAngle);
    diagram.style.transform = `rotate(${modelAngle - 25}deg)`;
    rotation.textContent = `Obrót modelu: ${modelAngle}°.`;
  }
  rotateLeft.addEventListener('click', () => rotate(-15)); rotateRight.addEventListener('click', () => rotate(15));
  rotation.textContent = `Obrót modelu: ${modelAngle}°.`;

  function draw() {
    const instrument = type.value as Instrument;
    model?.update(instrument, modelAngle);
    const result = telescopeReading({ instrument, focalLengthMm: Number(focal.input.value), apertureMm: Number(aperture.input.value),
      eyepieceFocalMm: Number(eyepiece.input.value), apparentFieldDeg: Number(apparent.input.value) });
    readout.textContent = `Ogniskowa ${focal.input.value} mm; apertura ${aperture.input.value} mm; okular ${eyepiece.input.value} mm; pole pozorne ${apparent.input.value}°. Powiększenie ${result.magnification.toFixed(1)}×; pole rzeczywiste około ${result.trueFieldDeg.toFixed(2)}°; źrenica wyjściowa ${result.exitPupilMm.toFixed(1)} mm; idealny limit dyfrakcyjny ${result.diffractionLimitArcsec.toFixed(1)}″.`;
    diagram.replaceChildren();
    const tube = svg('rect'); tube.setAttribute('x', '35'); tube.setAttribute('y', '55'); tube.setAttribute('width', '320'); tube.setAttribute('height', '80');
    tube.setAttribute('fill', '#234d79'); tube.setAttribute('stroke', '#86caff'); diagram.append(tube);
    const objective = svg('line'); objective.setAttribute('x1', instrument === 'reflector' ? '345' : '55');
    objective.setAttribute('x2', instrument === 'reflector' ? '345' : '55'); objective.setAttribute('y1', '65'); objective.setAttribute('y2', '125');
    objective.setAttribute('stroke', '#ffd166'); objective.setAttribute('stroke-width', '8'); diagram.append(objective);
    const eyepieceMark = svg('circle'); eyepieceMark.setAttribute('cx', instrument === 'reflector' ? '160' : '345');
    eyepieceMark.setAttribute('cy', instrument === 'reflector' ? '45' : '95'); eyepieceMark.setAttribute('r', '12');
    eyepieceMark.setAttribute('fill', '#dce6f0'); diagram.append(eyepieceMark);
    field.replaceChildren();
    const defs = svg('defs'); const clip = svg('clipPath'); clip.setAttribute('id', fieldClipId);
    const clipCircle = svg('circle'); clipCircle.setAttribute('cx', '150'); clipCircle.setAttribute('cy', '150'); clipCircle.setAttribute('r', '139');
    clip.append(clipCircle); defs.append(clip); field.append(defs);
    const circle = svg('circle'); circle.setAttribute('cx', '150'); circle.setAttribute('cy', '150'); circle.setAttribute('r', '140');
    circle.setAttribute('fill', '#081426'); circle.setAttribute('stroke', '#86caff'); circle.setAttribute('stroke-width', '3'); field.append(circle);
    const body = target.value === 'Jupiter' ? calculateSnapshot(store.getState().observation).positions.find((item) => item.objectId === 'Jupiter') : null;
    const angularSizeDeg = target.value === 'M31' ? 3 : target.value === 'M42' ? 0.5
      : target.value === 'Jupiter' ? (body?.angularDiameterArcmin ?? 0)/60 : 0.5;
    const diameter = 280 * angularSizeDeg / result.trueFieldDeg;
    const moon = svg('circle'); moon.setAttribute('cx', '150'); moon.setAttribute('cy', '150'); moon.setAttribute('r', String(diameter / 2));
    moon.setAttribute('fill', '#dce6f0'); moon.setAttribute('clip-path', `url(#${fieldClipId})`); field.append(moon);
    const targetName = target.selectedOptions[0]?.textContent ?? target.value;
    fieldNote.textContent = `Porównanie skali: ${targetName}, ${angularSizeDeg < 0.01 ? (angularSizeDeg*60*60).toFixed(1) + '″' : angularSizeDeg.toFixed(2) + '°'}; pole instrumentu ${result.trueFieldDeg.toFixed(2)}°. ${angularSizeDeg > result.trueFieldDeg ? 'Cel wykracza poza pole widzenia. ' : ''}To tylko schemat rozmiaru kątowego, bez struktury, jasności i orientacji obiektu.`;
  }
  function drawExposure() {
    const seconds = Number(exposure.input.value);
    exposureReadout.textContent = `Ekspozycja ${seconds} s: model zbiera ${exposureSignalRatio(seconds, 10).toFixed(1)} razy tyle sygnału co 10 s przy tych samych pozostałych parametrach. To odczyt dla fotografii, nie widok przez okular.`;
  }
  type.addEventListener('change', () => {
    const preset = type.value === 'binoculars' ? [200, 50, 25, 60] : type.value === 'reflector' ? [1200, 200, 25, 60] : [900, 90, 25, 60];
    [focal.input, aperture.input, eyepiece.input, apparent.input].forEach((input, index) => { input.value = String(preset[index]); });
    draw();
  });
  for (const control of [focal.input, aperture.input, eyepiece.input, apparent.input]) control.addEventListener('input', draw);
  target.addEventListener('change', draw);
  exposure.input.addEventListener('input', drawExposure);
  const unsubscribe = store.subscribe(() => {
    root.querySelectorAll('input, select, button').forEach((control) => { (control as HTMLInputElement).disabled = store.isFrozen(); });
    draw();
  });
  draw(); drawExposure();
  return { destroy() { destroyed = true; unsubscribe(); model?.destroy(); root.remove(); } };
}
