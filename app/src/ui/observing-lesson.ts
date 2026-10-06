import { Body } from 'astronomy-engine';
import { eclipseExample, meteorStreaks, moonPhaseReading, nextMoonQuarters, solarDay, sunPlanetSeparation } from '../astronomy/observing';
import { equatorialToHorizonMatrix, projectStar, stars } from '../astronomy/stars';
import { calculateSnapshot } from '../astronomy/ephemeris';
import type { ProbeStore } from '../app/probe-store';
import type { HostAdapter } from '../hosts/host-adapter';
import { pl } from '../i18n/pl';

const ns = 'http://www.w3.org/2000/svg';
function svg<K extends keyof SVGElementTagNameMap>(tag: K) { return document.createElementNS(ns, tag); }
function section(title: string) { const node = document.createElement('section'); const h = document.createElement('h3'); h.textContent = title; node.append(h); return node; }
function paragraph(value = '') { const node = document.createElement('p'); node.textContent = value; return node; }
function button(label: string, action: () => void) { const node = document.createElement('button'); node.type = 'button'; node.textContent = label; node.addEventListener('click', action); return node; }
function table(headers: string[], captionText: string) {
  const scroll = document.createElement('div'); scroll.className = 'nnb-table-scroll'; scroll.tabIndex = 0;
  scroll.setAttribute('role', 'region'); scroll.setAttribute('aria-label', captionText);
  const node = document.createElement('table'); const caption = document.createElement('caption'); caption.textContent = captionText;
  const head = document.createElement('thead'); const row = document.createElement('tr');
  for (const label of headers) { const th = document.createElement('th'); th.scope = 'col'; th.textContent = label; row.append(th); }
  head.append(row); const body = document.createElement('tbody'); node.append(caption, head, body); scroll.append(node);
  return { scroll, body };
}
function addRow(body: HTMLTableSectionElement, values: string[]) {
  const row = document.createElement('tr');
  values.forEach((value, index) => { const cell = document.createElement(index ? 'td' : 'th');
    if (!index) cell.scope = 'row'; cell.textContent = value; row.append(cell); }); body.append(row);
}
function dateLabel(value: string) { return value.slice(0, 16).replace('T', ' ') + ' UTC'; }
function phaseName(quarter: number) { return ['nów', 'pierwsza kwadra', 'pełnia', 'ostatnia kwadra'][quarter] ?? 'faza'; }
function eclipseName(kind: string) { return ({ total: 'całkowite', partial: 'częściowe', annular: 'obrączkowe', penumbral: 'półcieniowe' } as Record<string, string>)[kind] ?? kind; }

export function mountObservingLesson(container: HTMLElement, store: ProbeStore, host: HostAdapter) {
  const root = document.createElement('div'); root.className = 'nnb-observing'; container.append(root);
  const plan = section('5.1 · Przygotuj obserwację');
  plan.append(paragraph('Wybierz miejsce i chwilę w obserwatorium E2. Poniższe odczyty korzystają z tych samych współrzędnych. Przed wyjściem sprawdź pogodę, przeszkody na horyzoncie, światła w otoczeniu i bezpieczną drogę powrotu.'));
  const context = paragraph();
  const planDateLabel = document.createElement('label'); planDateLabel.textContent = 'Data planu (UTC)';
  const planDate = document.createElement('input'); planDate.type = 'date'; planDate.min = '1900-01-01'; planDate.max = '2100-12-31'; planDateLabel.append(planDate);
  const equipmentLabel = document.createElement('label'); equipmentLabel.textContent = 'Sprzęt';
  const equipment = document.createElement('select');
  for (const value of ['Gołe oko', 'Lornetka', 'Teleskop']) { const option = document.createElement('option'); option.value = value; option.textContent = value; equipment.append(option); }
  equipmentLabel.append(equipment);
  const conditionsLabel = document.createElement('label'); conditionsLabel.textContent = 'Warunki i hipoteza';
  const conditions = document.createElement('textarea'); conditions.maxLength = 500; conditions.rows = 3; conditionsLabel.append(conditions);
  const planResult = paragraph(); planResult.setAttribute('aria-live', 'polite');
  const savePlan = button('Zapisz plan obserwacji', () => {
    if (!planDate.value || !planDate.checkValidity()) { planResult.textContent = 'Wybierz datę planu z lat 1900–2100.'; return; }
    const location = store.getState().observation.observer;
    if (store.saveObservationPlan({ dateUtc: planDate.value, observer: location,
      equipment: equipment.value as 'Gołe oko' | 'Lornetka' | 'Teleskop', conditions: conditions.value.trim() })) {
      void host.notifyStateChanged().catch(() => { planResult.textContent = 'Nie udało się zapisać planu.'; });
    }
  });
  plan.append(context, planDateLabel, equipmentLabel, conditionsLabel, savePlan, planResult);

  const journal = section('5.1 · Dziennik obserwacji');
  journal.append(paragraph('Zapisz odczyt obiektu wybranego w E2 dla bieżącej chwili i miejsca. Notatka jest wypowiedzią otwartą; system jej nie ocenia.'));
  const noteLabel = document.createElement('label'); noteLabel.textContent = 'Notatka do pomiaru';
  const note = document.createElement('textarea'); note.maxLength = 500; note.rows = 2; noteLabel.append(note);
  const journalStatus = paragraph(); journalStatus.setAttribute('aria-live', 'polite');
  const journalTable = table(['Chwila UTC', 'Obiekt', 'Miejsce', 'Azymut', 'Wysokość', 'Faza', 'Notatka'], 'Dziennik zapisanych pomiarów');
  const record = button('Zapisz bieżący pomiar', () => {
    try {
      const observation = store.getState().observation;
      const reading = calculateSnapshot(observation).positions.find((item) => item.objectId === observation.objectId);
      if (!reading) throw new Error('missing-reading');
      const saved = store.addObservationEntry({ instantUtc: observation.instantUtc, observer: observation.observer,
        objectId: reading.objectId, azimuthDeg: reading.azimuthDeg, altitudeDeg: reading.altitudeDeg,
        phaseFraction: reading.phaseFraction, note: note.value.trim() });
      if (saved) { note.value = ''; void host.notifyStateChanged().catch(() => { journalStatus.textContent = 'Nie udało się zapisać dziennika.'; }); }
    } catch { journalStatus.textContent = 'Nie udało się obliczyć bieżącego odczytu.'; }
  });
  journal.append(noteLabel, record, journalStatus, journalTable.scroll);

  const starsSection = section('5.2 · Gwiazdy i gwiazdozbiory');
  starsSection.append(paragraph('Syriusz i Betelgeza należą do zimowego nieba w Polsce. Sprawdź ich wysokość nad horyzontem dla chwili i miejsca z E2; wybór przez numer HIP działa także bez trafiania w punkt mapy.'));
  const starTable = table(['Gwiazda', 'HIP', 'Jasność V', 'Azymut', 'Wysokość', 'Nad horyzontem'], 'Odczyty dwóch gwiazd dla wybranego obserwatora');
  starsSection.append(starTable.scroll);

  const sun = section('5.3 · Droga Słońca w czterech porach roku');
  sun.append(paragraph('Porównaj wschód, górowanie i zachód w jednym miejscu. Czas jest pokazany w UTC; brak wschodu lub zachodu w dacie UTC może oznaczać dzień/noc polarną albo przejście zdarzenia przez granicę doby UTC.'));
  const sunTable = table(['Data', 'Wschód UTC', 'Górowanie UTC', 'Zachód UTC', 'Wysokość górowania'], 'Cztery daty roku 2025 dla wybranego miejsca');
  const sunTask = document.createElement('fieldset'); const sunTaskLegend = document.createElement('legend');
  sunTaskLegend.textContent = 'Z03 · Zbierz wschód, górowanie i zachód w czterech datach w jednym miejscu'; sunTask.append(sunTaskLegend);
  const sunTaskButtons = document.createElement('div'); sunTaskButtons.className = 'nnb-actions';
  const sunTaskStatus = paragraph(); sunTaskStatus.setAttribute('aria-live', 'polite');
  const sunSavedTable = table(['Data', 'Miejsce', 'Wschód UTC', 'Górowanie UTC', 'Zachód UTC', 'Wysokość'], 'Z03 · zapisane obserwacje Słońca');
  const sunTaskConclusionLabel = document.createElement('label'); sunTaskConclusionLabel.textContent = 'Wniosek z porównania (ocenia nauczyciel)';
  const sunTaskConclusion = document.createElement('textarea'); sunTaskConclusion.rows = 2; sunTaskConclusion.maxLength = 500;
  sunTaskConclusionLabel.append(sunTaskConclusion);
  const sunDates = ['2025-03-20', '2025-06-21', '2025-09-22', '2025-12-21'];
  sunDates.forEach((date) => sunTaskButtons.append(button(`Zapisz ${date}`, () => {
    const state = store.getState(); const tasks = state.p3Tasks!; const observer = state.observation.observer;
    if (tasks.sunRecords.length && JSON.stringify(tasks.sunRecords[0]!.observer) !== JSON.stringify(observer)) {
      sunTaskStatus.textContent = 'Z03 wymaga jednego miejsca. Wróć do miejsca pierwszego pomiaru.'; return;
    }
    const result = solarDay(date, observer);
    const records = [...tasks.sunRecords.filter((entry) => entry.date !== date), { ...result, observer }].sort((a,b) => a.date.localeCompare(b.date));
    if (store.saveP3Tasks({ ...tasks, sunRecords: records })) void host.notifyStateChanged().catch(() => { sunTaskStatus.textContent = 'Nie udało się zapisać Z03.'; });
  })));
  const saveSunConclusion = button('Zapisz wniosek Z03', () => {
    const tasks = store.getState().p3Tasks!;
    if (store.saveP3Tasks({ ...tasks, sunConclusion: sunTaskConclusion.value.trim() }))
      void host.notifyStateChanged().catch(() => { sunTaskStatus.textContent = 'Nie udało się zapisać wniosku.'; });
  });
  sunTask.append(sunTaskButtons, sunTaskStatus, sunSavedTable.scroll, sunTaskConclusionLabel, saveSunConclusion);
  const sunQuestion = document.createElement('fieldset'); const sunLegend = document.createElement('legend');
  sunLegend.textContent = 'Sprawdź cel: czy wschód Słońca w tym samym miejscu ma tę samą godzinę w czerwcu i grudniu?';
  const sunAnswer = document.createElement('select');
  for (const [value, label] of [['', 'Wybierz'], ['yes', 'Tak'], ['no', 'Nie']] as const) {
    const option = document.createElement('option'); option.value = value; option.textContent = label; sunAnswer.append(option);
  }
  const sunAnswerLabel = document.createElement('label'); sunAnswerLabel.textContent = 'Odpowiedź'; sunAnswerLabel.append(sunAnswer);
  const sunFeedback = paragraph(); sunFeedback.setAttribute('aria-live', 'polite');
  sunQuestion.append(sunLegend, sunAnswerLabel, button('Sprawdź porównanie', () => {
    const observer = store.getState().observation.observer;
    const june = solarDay('2025-06-21', observer); const december = solarDay('2025-12-21', observer);
    if (!june.riseUtc || !december.riseUtc) {
      sunFeedback.textContent = 'W tym miejscu nie ma obu wschodów w wybranych dobach UTC. Porównaj wysokości górowania oraz zapisane zdarzenia; wniosek pozostaje otwarty.'; return;
    }
    const sameMinute = june.riseUtc.slice(11,16) === december.riseUtc.slice(11,16);
    sunFeedback.textContent = sunAnswer.value === (sameMinute ? 'yes' : 'no')
      ? 'Tak. Porównanie godzin wschodu jest zgodne z tabelą dla tego miejsca.'
      : 'Porównaj godziny wschodu w czerwcu i grudniu dla tego samego miejsca.';
  }), sunFeedback);
  sun.append(sunTable.scroll, sunTask, sunQuestion);

  const planets = section('5.3 · Planety, koniunkcja i opozycja');
  planets.append(paragraph('Koniunkcja oznacza zbliżenie kierunków planety i Słońca na niebie, opozycja — kierunki niemal przeciwne. Odczyt poniżej to separacja topocentryczna Marsa i Słońca; bliskość kątowa nie oznacza fizycznej bliskości tych ciał.'));
  const planetReadout = paragraph(); planets.append(planetReadout);

  const moon = section('5.3.1 · Fazy Księżyca');
  moon.append(paragraph('Faza wynika z geometrii oświetlenia Księżyca przez Słońce, a nie z cienia Ziemi. Procent tarczy jest geocentryczny; kierunek jasnego brzegu obliczamy dla miejsca i chwili. Schemat tarczy jest modelem bez szczegółów powierzchni.'));
  const moonReadout = paragraph();
  const quarters = table(['Faza', 'Chwila UTC'], 'Cztery kolejne główne fazy od wybranej chwili');
  const phaseSvg = svg('svg'); phaseSvg.setAttribute('viewBox', '0 0 440 150'); phaseSvg.setAttribute('role', 'img');
  phaseSvg.setAttribute('aria-label', 'Schemat geometrii Słońce–Ziemia–Księżyc; położenie Księżyca aktualizuje się z datą. Odczyty są dostępne tekstowo.');
  const orbit = svg('ellipse'); orbit.setAttribute('cx','250'); orbit.setAttribute('cy','75'); orbit.setAttribute('rx','70'); orbit.setAttribute('ry','50');
  orbit.setAttribute('fill','none'); orbit.setAttribute('stroke','#86caff'); orbit.setAttribute('stroke-dasharray','4 4'); phaseSvg.append(orbit);
  for (const [cx, radius, fill] of [[65, 32, '#ffd166'], [250, 18, '#86caff']] as const) {
    const circle = svg('circle'); circle.setAttribute('cx', String(cx)); circle.setAttribute('cy', '75'); circle.setAttribute('r', String(radius)); circle.setAttribute('fill', fill); phaseSvg.append(circle);
  }
  const phaseMoon = svg('circle'); phaseMoon.setAttribute('r','12'); phaseMoon.setAttribute('fill','#dce6f0'); phaseSvg.append(phaseMoon);
  const moonDisk = document.createElement('canvas'); moonDisk.width = 120; moonDisk.height = 120;
  moonDisk.setAttribute('role', 'img'); moonDisk.setAttribute('aria-label', 'Model oświetlonej tarczy Księżyca; faza i orientacja są opisane tekstowo.');
  const moonTask = document.createElement('fieldset'); const moonTaskLegend = document.createElement('legend');
  moonTaskLegend.textContent = 'Z04 · Zapisz cztery główne fazy i rozpoznaj ich kolejność'; moonTask.append(moonTaskLegend);
  const moonEventLabel = document.createElement('label'); moonEventLabel.textContent = 'Chwila fazy';
  const moonEvent = document.createElement('select'); moonEventLabel.append(moonEvent);
  const moonAnswerLabel = document.createElement('label'); moonAnswerLabel.textContent = 'Rozpoznana faza';
  const moonAnswer = document.createElement('select');
  for (const [id, label] of [['', 'Wybierz'], ['0', 'Nów'], ['1', 'Pierwsza kwadra'], ['2', 'Pełnia'], ['3', 'Ostatnia kwadra']] as const) {
    const option = document.createElement('option'); option.value = id; option.textContent = label; moonAnswer.append(option);
  }
  moonAnswerLabel.append(moonAnswer);
  const moonTaskStatus = paragraph(); moonTaskStatus.setAttribute('aria-live', 'polite');
  const moonSavedTable = table(['Faza', 'Chwila UTC', 'Miejsce', 'Oświetlenie', 'Kąt cyklu', 'Jasny brzeg'], 'Z04 · zapisane fazy Księżyca');
  const moonTaskConclusionLabel = document.createElement('label'); moonTaskConclusionLabel.textContent = 'Wniosek o geometrii faz (ocenia nauczyciel)';
  const moonTaskConclusion = document.createElement('textarea'); moonTaskConclusion.rows = 2; moonTaskConclusion.maxLength = 500;
  moonTaskConclusionLabel.append(moonTaskConclusion);
  let taskQuarters = nextMoonQuarters(store.getState().observation.instantUtc);
  const saveMoon = button('Sprawdź i zapisz fazę', () => {
    const event = taskQuarters[Number(moonEvent.value)];
    if (!event || moonAnswer.value !== String(event.quarter)) { moonTaskStatus.textContent = 'Sprawdź geometrię i kolejność faz, a następnie wybierz właściwą nazwę.'; return; }
    const state = store.getState(); const tasks = state.p3Tasks!;
    const first = tasks.moonRecords[0];
    if (first && (first.observer.latitudeDeg !== state.observation.observer.latitudeDeg ||
      first.observer.longitudeDeg !== state.observation.observer.longitudeDeg ||
      first.observer.heightM !== state.observation.observer.heightM ||
      Math.abs(Date.parse(event.instantUtc) - Date.parse(first.instantUtc)) > 30 * 86_400_000)) {
      moonTaskStatus.textContent = 'Z04 wymaga jednego miejsca i czterech kolejnych faz w jednym cyklu. Przywróć miejsce i okres pierwszego zapisu.';
      return;
    }
    const reading = moonPhaseReading(event.instantUtc, state.observation.observer);
    const record = { quarter: event.quarter, instantUtc: event.instantUtc, observer: state.observation.observer,
      litFraction: reading.litFraction, phaseAngleDeg: reading.phaseAngleDeg, brightLimbAngleDeg: reading.brightLimbAngleDeg };
    const records = [...tasks.moonRecords.filter((item) => item.quarter !== event.quarter), record].sort((a,b) => a.instantUtc.localeCompare(b.instantUtc));
    if (store.saveP3Tasks({ ...tasks, moonRecords: records })) void host.notifyStateChanged().catch(() => { moonTaskStatus.textContent = 'Nie udało się zapisać Z04.'; });
    else moonTaskStatus.textContent = 'Wybierz kolejną fazę tego samego cyklu; odstęp między fazami powinien wynosić kilka dni.';
  });
  const saveMoonConclusion = button('Zapisz wniosek Z04', () => {
    const tasks = store.getState().p3Tasks!;
    if (store.saveP3Tasks({ ...tasks, moonConclusion: moonTaskConclusion.value.trim() }))
      void host.notifyStateChanged().catch(() => { moonTaskStatus.textContent = 'Nie udało się zapisać wniosku.'; });
  });
  moonTask.append(moonEventLabel, moonAnswerLabel, saveMoon, moonTaskStatus, moonSavedTable.scroll, moonTaskConclusionLabel, saveMoonConclusion);
  moon.append(phaseSvg, moonDisk, moonReadout, quarters.scroll, moonTask);

  const eclipses = section('5.4.1 · Zaćmienia i widoczność lokalna');
  eclipses.append(paragraph('Zaćmienie Słońca wymaga ustawienia Księżyca między Ziemią a Słońcem, a Księżyca — Ziemi między Słońcem a Księżycem. Sama faza nowiu lub pełni nie wystarcza: znaczenie ma również położenie węzłów orbity.'));
  const eclipseTable = table(['Przykład', 'Maksimum UTC', 'Rodzaj', 'Wysokość w maksimum', 'Lokalna widoczność'], 'Dwa przykłady zaćmień i lokalny horyzont');
  const eclipseContacts = table(['Zjawisko i kontakt', 'Chwila UTC', 'Wysokość ciała', 'Nad horyzontem'], 'Kontakty zaćmień i wysokości lokalne');
  const eclipseNote = paragraph('Kontakty i pozycje są wynikiem modelu astronomicznego. Rzeczywista obserwacja zależy również od przeszkód i pogody; czasy zaokrąglamy do minuty.');
  const safety = paragraph('Bezpieczeństwo: nie patrz na jasne Słońce bez właściwej ochrony. Do bezpośredniego patrzenia służą nieuszkodzone okulary do obserwacji Słońca zgodne z ISO 12312-2; dzieci wymagają nadzoru. Teleskop, lornetka i aparat wymagają specjalnego filtra słonecznego zamocowanego przed obiektywem. Nie patrz przez taki instrument w zwykłych okularach do zaćmienia: skupione światło może uszkodzić filtr i wzrok. Bezpieczną metodą pośrednią jest projekcja otworkowa bez patrzenia wprost na Słońce. Przed użyciem filtra na instrumencie zasięgnij porady astronoma.');
  safety.className = 'nnb-safety';
  const safetySource = document.createElement('a'); safetySource.href = 'https://science.nasa.gov/eclipses/safety/';
  safetySource.textContent = 'Źródło zasad bezpieczeństwa: NASA'; safetySource.target = '_blank'; safetySource.rel = 'noopener noreferrer';
  eclipses.append(eclipseTable.scroll, eclipseContacts.scroll, eclipseNote, safety, safetySource);

  const meteors = section('5.4.2 · Perseidy i Leonidy');
  meteors.append(paragraph('Rój meteorów opisujemy statystycznie. Perseidy mają radiant w Perseuszu i maksimum zwykle w sierpniu; Leonidy — w Lwie i zwykle w listopadzie. Kierunki smug na schemacie są przykładowe; nie przewidują konkretnych meteorów ani ich sekund pojawienia się.'));
  const meteorSelectLabel = document.createElement('label'); meteorSelectLabel.textContent = 'Rój';
  const meteorSelect = document.createElement('select');
  for (const [value, label] of [['Perseidy', 'Perseidy — Perseusz, sierpień'], ['Leonidy', 'Leonidy — Lew, listopad']] as const) {
    const option = document.createElement('option'); option.value = value; option.textContent = label; meteorSelect.append(option);
  }
  meteorSelectLabel.append(meteorSelect);
  const sampleLabel = document.createElement('label'); sampleLabel.textContent = 'Przykład modelu statystycznego (0–100)';
  const sample = document.createElement('input'); sample.type = 'range'; sample.min = '0'; sample.max = '100'; sample.value = '20'; sampleLabel.append(sample);
  const meteorSvg = svg('svg'); meteorSvg.setAttribute('viewBox', '0 0 360 260'); meteorSvg.setAttribute('role', 'img');
  meteorSvg.setAttribute('aria-label', 'Schemat przykładowych smug od radiantu; wartości i ograniczenie modelu podano tekstowo.');
  const meteorReadout = paragraph();
  meteors.append(meteorSelectLabel, sampleLabel, meteorSvg, meteorReadout);
  root.append(plan, journal, starsSection, sun, planets, moon, eclipses, meteors);
  const savedPlan = store.getState().observationPlan;
  if (savedPlan) { planDate.value = savedPlan.dateUtc; equipment.value = savedPlan.equipment; conditions.value = savedPlan.conditions; }
  sunTaskConclusion.value = store.getState().p3Tasks?.sunConclusion ?? '';
  moonTaskConclusion.value = store.getState().p3Tasks?.moonConclusion ?? '';

  function drawMeteors() {
    const streaks = meteorStreaks(Number(sample.value)); meteorSvg.replaceChildren();
    const center = svg('circle'); center.setAttribute('cx', '180'); center.setAttribute('cy', '130'); center.setAttribute('r', '7');
    center.setAttribute('fill', '#ffd166'); meteorSvg.append(center);
    streaks.forEach((item) => {
      const angle = item.angleDeg * Math.PI / 180;
      const line = svg('line'); line.setAttribute('x1', String(180 + Math.cos(angle) * 30));
      line.setAttribute('y1', String(130 + Math.sin(angle) * 30));
      line.setAttribute('x2', String(180 + Math.cos(angle) * (30 + item.lengthDeg * 5)));
      line.setAttribute('y2', String(130 + Math.sin(angle) * (30 + item.lengthDeg * 5)));
      line.setAttribute('stroke', '#86caff'); line.setAttribute('stroke-width', '3'); meteorSvg.append(line);
    });
    meteorReadout.textContent = `${meteorSelect.value}: radiant w gwiazdozbiorze ${meteorSelect.value === 'Perseidy' ? 'Perseusza' : 'Lwa'}. Przykład ${sample.value}: 5 umownych smug o kierunkach ${streaks.map((item) => `${item.angleDeg}°`).join(', ')} względem schematu. To model dydaktyczny, nie prognoza.`;
  }
  meteorSelect.addEventListener('change', drawMeteors); sample.addEventListener('input', drawMeteors);
  function drawMoonDisk(reading: ReturnType<typeof moonPhaseReading>) {
    const context = moonDisk.getContext('2d'); if (!context) return;
    const image = context.createImageData(120, 120); const angle = reading.brightLimbAngleDeg * Math.PI/180;
    for (let y = 0; y < 120; y++) for (let x = 0; x < 120; x++) {
      const dx = (x-59.5)/53; const dy = (y-59.5)/53; const radius = dx*dx+dy*dy;
      if (radius > 1) continue;
      const toward = dx*Math.sin(angle)-dy*Math.cos(angle);
      const across = dx*Math.cos(angle)+dy*Math.sin(angle);
      const lit = toward >= (1-2*reading.litFraction)*Math.sqrt(Math.max(0,1-across*across));
      const offset = (y*120+x)*4; const value = lit ? 226 : 52;
      image.data[offset] = value; image.data[offset+1] = lit ? 232 : 61;
      image.data[offset+2] = lit ? 239 : 76; image.data[offset+3] = 255;
    }
    context.putImageData(image, 0, 0);
  }
  function update() {
    const state = store.getState(); const observation = state.observation;
    const location = observation.observer;
    context.textContent = `Miejsce: szerokość ${location.latitudeDeg.toFixed(3)}°, długość ${location.longitudeDeg.toFixed(3)}°, wysokość ${location.heightM.toFixed(0)} m. Chwila obserwatorium: ${dateLabel(observation.instantUtc)}.`;
    if (!planDate.value) planDate.value = observation.instantUtc.slice(0, 10);
    const saved = state.observationPlan;
    planResult.textContent = saved ? `Zapisany plan: ${saved.dateUtc} UTC; szerokość ${saved.observer.latitudeDeg.toFixed(3)}°, długość ${saved.observer.longitudeDeg.toFixed(3)}°; ${saved.equipment}. Warunki i hipoteza: ${saved.conditions || 'nie podano'}.` : 'Brak zapisanego planu.';
    journalTable.body.replaceChildren();
    for (const entry of state.observationJournal) addRow(journalTable.body, [dateLabel(entry.instantUtc), pl.objects[entry.objectId],
      `${entry.observer.latitudeDeg.toFixed(2)}°, ${entry.observer.longitudeDeg.toFixed(2)}°`,
      `${entry.azimuthDeg.toFixed(1)}°`, `${entry.altitudeDeg.toFixed(1)}°`,
      entry.phaseFraction === null ? 'Nie dotyczy' : `${(entry.phaseFraction * 100).toFixed(1)}%`, entry.note || '—']);
    journalStatus.textContent = `${state.observationJournal.length} zapisanych pomiarów (limit 100).`;
    const matrix = equatorialToHorizonMatrix(observation.instantUtc, location);
    starTable.body.replaceChildren();
    for (const [name, id] of [['Syriusz', 32349], ['Betelgeza', 27989]] as const) {
      const star = stars.find((item) => item.id === id);
      if (!star) continue;
      const position = projectStar(star, observation.instantUtc, matrix, false);
      addRow(starTable.body, [name, String(id), `${star.magnitude.toFixed(2)} mag`, `${position.azimuthDeg.toFixed(1)}°`, `${position.altitudeDeg.toFixed(1)}°`, position.altitudeDeg >= 0 ? 'Tak' : 'Nie']);
    }
    sunTable.body.replaceChildren();
    for (const date of sunDates) {
      const day = solarDay(date, location);
      addRow(sunTable.body, [date, day.riseUtc ? dateLabel(day.riseUtc) : 'Brak tego dnia',
        day.transitUtc ? dateLabel(day.transitUtc) : 'Brak tego dnia', day.setUtc ? dateLabel(day.setUtc) : 'Brak tego dnia',
        day.transitAltitudeDeg === null ? 'Brak' : `${day.transitAltitudeDeg.toFixed(1)}°`]);
    }
    const tasks = state.p3Tasks!;
    sunTaskStatus.textContent = `Z03: ${tasks.sunRecords.length}/4 zapisanych dat${tasks.sunRecords.length === 4 ? ' w jednym miejscu. Porównanie gotowe.' : '.'}`;
    sunSavedTable.body.replaceChildren();
    for (const entry of tasks.sunRecords) addRow(sunSavedTable.body, [entry.date,
      `${entry.observer.latitudeDeg.toFixed(2)}°, ${entry.observer.longitudeDeg.toFixed(2)}°`,
      entry.riseUtc ? dateLabel(entry.riseUtc) : 'Brak', entry.transitUtc ? dateLabel(entry.transitUtc) : 'Brak',
      entry.setUtc ? dateLabel(entry.setUtc) : 'Brak', entry.transitAltitudeDeg === null ? 'Brak' : `${entry.transitAltitudeDeg.toFixed(1)}°`]);
    const currentMoon = moonPhaseReading(observation.instantUtc, location);
    const marsSeparation = sunPlanetSeparation(observation.instantUtc, location, Body.Mars);
    planetReadout.textContent = `${dateLabel(observation.instantUtc)}: separacja Mars–Słońce ${marsSeparation.toFixed(1)}°. ${marsSeparation > 170 ? 'Mars jest blisko opozycji kierunków.' : marsSeparation < 10 ? 'Mars jest blisko koniunkcji kierunków.' : 'Mars nie jest blisko opozycji ani koniunkcji kierunków.'}`;
    moonReadout.textContent = `${dateLabel(observation.instantUtc)}: oświetlona część tarczy ${(currentMoon.litFraction * 100).toFixed(1)}%; kąt fazowy cyklu ${currentMoon.phaseAngleDeg.toFixed(1)}° (0° nów, 90° pierwsza kwadra, 180° pełnia, 270° ostatnia kwadra); separacja kierunków Słońca i Księżyca ${currentMoon.elongationDeg.toFixed(1)}°; wysokość Księżyca ${currentMoon.moonAltitudeDeg.toFixed(1)}°; jasny brzeg od lokalnego pionu ku prawej ${currentMoon.brightLimbAngleDeg.toFixed(1)}° (przy nowiu i pełni orientacja słabo określona).`;
    const phaseAngle = currentMoon.phaseAngleDeg * Math.PI/180;
    phaseMoon.setAttribute('cx', String(250-70*Math.cos(phaseAngle)));
    phaseMoon.setAttribute('cy', String(75-50*Math.sin(phaseAngle)));
    drawMoonDisk(currentMoon);
    quarters.body.replaceChildren();
    taskQuarters = nextMoonQuarters(observation.instantUtc);
    taskQuarters.forEach((item) => addRow(quarters.body, [phaseName(item.quarter), dateLabel(item.instantUtc)]));
    const priorEvent = moonEvent.value; moonEvent.replaceChildren();
    taskQuarters.forEach((item, index) => { const option = document.createElement('option'); option.value = String(index);
      option.textContent = `${dateLabel(item.instantUtc)} · faza ${index+1} z 4`; moonEvent.append(option); });
    moonEvent.value = priorEvent || '0';
    moonTaskStatus.textContent = `Z04: ${tasks.moonRecords.length}/4 rozpoznanych faz${tasks.moonRecords.length === 4 ? '. Kolejność cyklu: nów → pierwsza kwadra → pełnia → ostatnia kwadra → nów.' : '.'}`;
    moonSavedTable.body.replaceChildren();
    for (const entry of tasks.moonRecords) addRow(moonSavedTable.body, [phaseName(entry.quarter), dateLabel(entry.instantUtc),
      `${entry.observer.latitudeDeg.toFixed(2)}°, ${entry.observer.longitudeDeg.toFixed(2)}°`,
      `${(entry.litFraction*100).toFixed(1)}%`, `${entry.phaseAngleDeg.toFixed(1)}°`, `${entry.brightLimbAngleDeg.toFixed(1)}°`]);
    eclipseTable.body.replaceChildren();
    eclipseContacts.body.replaceChildren();
    for (const kind of ['solar', 'lunar'] as const) {
      const example = eclipseExample(kind, location);
      const visible = example.localVisibility === 'peak' ? 'Maksimum nad horyzontem' : example.localVisibility === 'part' ? 'Widoczna część zjawiska, maksimum pod horyzontem' : 'Całe zjawisko pod horyzontem lub poza zasięgiem';
      addRow(eclipseTable.body, [kind === 'solar' ? 'Słońca, 2024' : 'Księżyca, 2025', dateLabel(example.peakUtc),
        eclipseName(example.type), `${example.localPeakAltitudeDeg.toFixed(1)}°`,
        kind === 'solar' && example.localSolarCoverage !== null ? `${visible}; zakrycie lokalne ${(example.localSolarCoverage * 100).toFixed(1)}%` : visible]);
      example.contacts.forEach((contact) => addRow(eclipseContacts.body, [
        `${kind === 'solar' ? 'Słońca' : 'Księżyca'} · ${contact.label}`, dateLabel(contact.instantUtc),
        `${contact.altitudeDeg.toFixed(1)}°`, contact.altitudeDeg > 0 ? 'Tak' : 'Nie']));
    }
    root.querySelectorAll('input, select, textarea, button').forEach((control) => { (control as HTMLInputElement).disabled = store.isFrozen(); });
  }
  const unsubscribe = store.subscribe(update); update(); drawMeteors();
  return { destroy() { unsubscribe(); root.remove(); } };
}
