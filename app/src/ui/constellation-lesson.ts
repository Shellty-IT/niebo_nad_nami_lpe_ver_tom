import { allConstellations, calculateStarDirections, constellations, equatorialToHorizonMatrix, projectStar, stars, type StarDirection, type StarRecord } from '../astronomy/stars';
import type { ProbeStore } from '../app/probe-store';
import type { HostAdapter } from '../hosts/host-adapter';
import type { LessonSettings } from '../domain/lesson-settings';

const starById = new Map(stars.map((star) => [star.id, star]));
const detail: Record<string, string> = {
  UMa: 'W micie greckim postać Kallisto zamieniono w niedźwiedzicę. Siedem jasnych gwiazd jest asteryzmem wewnątrz obszaru IAU: w Europie bywa „Pługiem”, w Ameryce „Wielkim Czerpakiem”, a w Chinach „Północnym Czerpakiem”. Te opowieści i nazwy są świadectwem kultur, nie fizycznym kształtem gwiazd.',
  Cas: 'W tradycji greckiej Kasjopeja jest królową. Jej charakterystyczne jasne gwiazdy układają się w kształt podobny do litery W; figura jest umowna.',
  Ori: 'Grecy widzieli w Orionie myśliwego, starożytni Egipcjanie wiązali te gwiazdy z postacią boga Sah, a Babilończycy z Niebiańskim Pasterzem. Trzy jasne gwiazdy tworzą Pas Oriona. Obszar przecina okolice równika niebieskiego, dlatego można go obserwować z obu półkul.',
  Cru: 'Krzyż Południa jest małym obszarem nieba południowego. Figura krzyża pomaga orientować się na południu; jej znaczenie w kulturach południa jest różne.',
  Cen: 'Centaur w tradycji greckiej jest postacią pół człowieka, pół konia. Duży obszar obejmuje jasne gwiazdy południowego nieba; rysunek łączący gwiazdy jest umowny.',
};
function disk(point: StarDirection): readonly [number, number] | null {
  if (point.altitudeDeg < 0) return null;
  const radius = (90 - point.altitudeDeg) / 90 * 180;
  const azimuth = point.azimuthDeg * Math.PI / 180;
  return [200 + radius * Math.sin(azimuth), 200 - radius * Math.cos(azimuth)];
}

export function mountConstellationLesson(container: HTMLElement, store: ProbeStore, host: HostAdapter, initialLayers?: LessonSettings['layers']) {
  const root = document.createElement('section'); root.className = 'nnb-constellations';
  const intro = document.createElement('p');
  intro.textContent = 'Gwiazdozbiór według IAU jest obszarem nieba. Linie łączące gwiazdy są umownymi figurami i nie są granicami. Gwiazdy figury mogą leżeć w bardzo różnych odległościach od Ziemi. Źródła: granice IAU, figury Stellarium team (CC BY-SA), gwiazdy Credit: ESA (CC BY-NC 3.0 IGO).';
  const selectLabel = document.createElement('label'); selectLabel.textContent = 'Przykład gwiazdozbioru';
  const select = document.createElement('select');
  for (const constellation of constellations) {
    const option = document.createElement('option'); option.value = constellation.id; option.textContent = constellation.name; select.append(option);
  }
  selectLabel.append(select);
  const locationControls = document.createElement('div'); locationControls.className = 'nnb-actions';
  const north = document.createElement('button'); north.type = 'button'; north.textContent = 'Obserwuj z Warszawy';
  const south = document.createElement('button'); south.type = 'button'; south.textContent = 'Obserwuj z Kapsztadu';
  locationControls.append(north, south);
  const layers = document.createElement('div'); layers.className = 'nnb-actions';
  const toggles = [['stars', 'Gwiazdy'], ['figure', 'Figura'], ['boundary', 'Granica IAU'], ['name', 'Nazwa']] as const;
  const inputs = new Map<string, HTMLInputElement>();
  for (const [id, title] of toggles) {
    const label = document.createElement('label'); const input = document.createElement('input'); input.type = 'checkbox'; input.checked = initialLayers?.[id] ?? true;
    label.append(input, document.createTextNode(` ${title}`)); layers.append(label); inputs.set(id, input);
  }
  const canvas = document.createElement('canvas'); canvas.width = 400; canvas.height = 400;
  canvas.setAttribute('aria-hidden', 'true');
  const reading = document.createElement('p'); reading.className = 'nnb-note';
  const description = document.createElement('p');
  const table = document.createElement('table');
  const caption = document.createElement('caption'); caption.textContent = 'Jasne gwiazdy wybranej figury — odczyty z tej samej chwili i miejsca';
  const header = document.createElement('thead'); const headerRow = document.createElement('tr');
  for (const text of ['HIP', 'Jasność V (mag)', 'Azymut', 'Wysokość']) {
    const cell = document.createElement('th'); cell.scope = 'col'; cell.textContent = text; headerRow.append(cell);
  }
  header.append(headerRow); const body = document.createElement('tbody'); table.append(caption, header, body);
  const tableScroll = document.createElement('div'); tableScroll.className = 'nnb-table-scroll'; tableScroll.tabIndex = 0; tableScroll.append(table);
  const exercise = document.createElement('fieldset');
  const legend = document.createElement('legend'); legend.textContent = 'Sprawdź cel E3: który wzór zawiera trzy jasne gwiazdy tworzące pas?';
  const check = document.createElement('button'); check.type = 'button'; check.textContent = 'Sprawdź wybór';
  const feedback = document.createElement('p'); feedback.setAttribute('aria-live', 'polite');
  const taskReport = document.createElement('p'); taskReport.className = 'nnb-task-report';
  exercise.append(legend, check, feedback, taskReport);
  const catalog = document.createElement('details');
  const catalogSummary = document.createElement('summary'); catalogSummary.textContent = 'Katalog 88 obszarów IAU';
  const catalogList = document.createElement('ol');
  for (const item of [...allConstellations].sort((a, b) => a.latinName.localeCompare(b.latinName))) {
    const entry = document.createElement('li'); entry.textContent = `${item.latinName} (${item.id})`; catalogList.append(entry);
  }
  catalog.append(catalogSummary, catalogList);
  root.append(intro, selectLabel, locationControls, layers, canvas, reading, description, tableScroll, exercise, catalog); container.append(root);
  const context = canvas.getContext('2d');
  function setPlace(latitudeDeg: number, longitudeDeg: number, heightM: number, timeZone: string) {
    const observation = store.getState().observation;
    if (store.change({ ...observation, observer: { latitudeDeg, longitudeDeg, heightM }, timeZone })) {
      void host.notifyStateChanged().catch(() => { feedback.textContent = 'Nie udało się zapisać miejsca obserwacji.'; });
    }
  }
  north.addEventListener('click', () => setPlace(52.2297, 21.0122, 100, 'Europe/Warsaw'));
  south.addEventListener('click', () => setPlace(-33.9258, 18.4232, 25, 'Africa/Johannesburg'));
  function draw() {
    const observation = store.getState().observation;
    const selected = constellations.find((item) => item.id === select.value) ?? constellations[0]!;
    const directions = calculateStarDirections(observation.instantUtc, observation.observer, observation.refraction);
    const byId = new Map(directions.map((star) => [star.id, star]));
    const matrix = equatorialToHorizonMatrix(observation.instantUtc, observation.observer);
    const boundary = selected.boundary.map(([raDeg, decDeg]) => projectStar({ id: 0, magnitude: 0, raDeg: raDeg!, decDeg: decDeg!,
      pmRaCosDecMasYr: null, pmDecMasYr: null, parallaxMas: null, btMag: null, vtMag: null } satisfies StarRecord,
      observation.instantUtc, matrix, observation.refraction));
    if (context) {
      context.fillStyle = '#081426'; context.fillRect(0, 0, 400, 400);
      context.strokeStyle = '#86caff'; context.lineWidth = 1;
      context.beginPath(); context.arc(200, 200, 180, 0, 2 * Math.PI); context.stroke();
      if (inputs.get('stars')!.checked) {
        context.fillStyle = '#dcebff';
        for (const star of directions) {
          const point = disk(star); if (!point) continue;
          const size = Math.max(1, Math.min(4, 3.5 - star.magnitude * 0.35));
          context.fillRect(point[0] - size / 2, point[1] - size / 2, size, size);
        }
      }
      function polyline(points: StarDirection[], color: string, closed: boolean) {
        context!.strokeStyle = color; context!.lineWidth = 2; context!.beginPath(); let drawing = false;
        const all = closed ? [...points, points[0]!] : points;
        for (const item of all) {
          const point = disk(item);
          if (!point) { drawing = false; continue; }
          if (drawing) context!.lineTo(...point); else context!.moveTo(...point);
          drawing = true;
        }
        context!.stroke();
      }
      if (inputs.get('boundary')!.checked) polyline(boundary, '#ffce73', true);
      if (inputs.get('figure')!.checked) {
        for (const path of selected.figure) polyline(path.map((id) => byId.get(id)!).filter(Boolean), '#ff9c7a', false);
      }
      if (inputs.get('name')!.checked) {
        const points = selected.figure.flat().map((id) => byId.get(id)).filter((item): item is StarDirection => Boolean(item && disk(item)));
        const centroid = points.reduce<[number, number]>((sum, item) => {
          const point = disk(item)!; return [sum[0] + point[0], sum[1] + point[1]];
        }, [0, 0]);
        if (points.length) {
          context.fillStyle = '#fff'; context.font = 'bold 16px system-ui';
          context.fillText(selected.name, centroid[0] / points.length, centroid[1] / points.length);
        }
      }
    }
    const figureIds = [...new Set(selected.figure.flat())];
    const figureStars = figureIds.map((id) => ({ star: starById.get(id)!, direction: byId.get(id)! }))
      .filter(({ star, direction }) => star && direction).sort((a, b) => a.star.magnitude - b.star.magnitude).slice(0, 12);
    body.replaceChildren();
    for (const { star, direction } of figureStars) {
      const row = document.createElement('tr');
      for (const [index, value] of [`HIP ${star.id}`, star.magnitude.toFixed(2), `${direction.azimuthDeg.toFixed(1)}°`, `${direction.altitudeDeg.toFixed(1)}°`].entries()) {
        const cell = document.createElement(index === 0 ? 'th' : 'td');
        if (index === 0) cell.setAttribute('scope', 'row'); cell.textContent = value; row.append(cell);
      }
      body.append(row);
    }
    const visible = figureIds.filter((id) => (byId.get(id)?.altitudeDeg ?? -90) > 0).length;
    reading.textContent = `${selected.name}: ${visible} z ${figureIds.length} gwiazd figury ma środek nad geometrycznym horyzontem. Obserwator ${observation.observer.latitudeDeg.toFixed(2)}°, ${observation.observer.longitudeDeg.toFixed(2)}°; ${observation.instantUtc}. To nie uwzględnia pogody ani zanieczyszczenia światłem.`;
    description.textContent = detail[selected.id]!;
    north.disabled = store.isFrozen(); south.disabled = store.isFrozen(); check.disabled = store.isFrozen(); select.disabled = store.isFrozen();
    const attempts = store.getState().taskAttempts.filter((attempt) => attempt.taskId === 'Orion');
    taskReport.textContent = `Wyszukanie Oriona: ${attempts.length} prób; ${attempts.some((attempt) => attempt.correct) ? 'cel osiągnięty' : 'cel nieukończony'}.`;
  }
  select.addEventListener('change', draw); layers.addEventListener('change', draw);
  check.addEventListener('click', () => {
    const attempt = store.checkOrionTask(select.value);
    if (!attempt) return;
    feedback.textContent = attempt.correct ? 'Tak. Pas Oriona tworzą trzy jasne gwiazdy w umownej figurze.'
      : 'To inny przykład. Porównaj układ jasnych gwiazd i spróbuj ponownie.';
    void host.notifyStateChanged().catch(() => { feedback.textContent = 'Nie udało się zapisać wyniku Oriona.'; });
  });
  const unsubscribe = store.subscribe(draw); draw();
  return { destroy() { unsubscribe(); root.remove(); } };
}
