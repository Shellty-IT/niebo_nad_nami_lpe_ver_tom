import { EphemerisClient } from '../astronomy/ephemeris-client';
import type { ProbeStore } from '../app/probe-store';
import type { HostAdapter } from '../hosts/host-adapter';
import { pl } from '../i18n/pl';
import { mountSkyView } from '../rendering/sky/sky-view';
import type { ObservationSnapshot } from '../astronomy/ephemeris';
import { BODY_IDS } from '../astronomy/ephemeris';
import { equatorialToHorizonMatrix, projectStar, stars } from '../astronomy/stars';
import { calculateCatalog, CATALOG_IDS, catalogInfo, type CatalogPosition, type CatalogId } from '../astronomy/extra-catalog';
import { lessonSettings } from '../domain/lesson-settings';

export function mountObservationPanel(container: HTMLElement, store: ProbeStore, host: HostAdapter) {
  const allowed = lessonSettings(store.getConfig()).visibleObjects;
  const visibleSnapshot = (snapshot: ObservationSnapshot | undefined) => snapshot &&
    { ...snapshot, positions: snapshot.positions.filter((position) => allowed.includes(position.objectId)) };
  const client = new EphemerisClient(() => host.createEphemerisWorker());
  let disposed = false;
  let lastKey = '';
  let currentSnapshot: ObservationSnapshot | undefined;
  let currentCatalog: CatalogPosition[] = [];
  const section = document.createElement('section');
  section.className = 'nnb-observation';
  section.setAttribute('aria-label', pl.readings);
  const heading = document.createElement('h2');
  heading.textContent = pl.readings;
  const status = document.createElement('p');
  status.className = 'nnb-calculation-status';
  status.setAttribute('aria-live', 'polite');
  const scroll = document.createElement('div');
  scroll.className = 'nnb-table-scroll nnb-primary-readings';
  scroll.tabIndex = 0;
  scroll.setAttribute('role', 'region');
  scroll.setAttribute('aria-label', pl.readings);
  const table = document.createElement('table');
  const caption = document.createElement('caption');
  caption.textContent = pl.coordinateConvention;
  const head = document.createElement('thead');
  const row = document.createElement('tr');
  for (const text of [pl.object, pl.ra, pl.dec, pl.altitude, pl.azimuth, pl.distance, pl.horizon]) {
    const th = document.createElement('th'); th.scope = 'col'; th.textContent = text; row.append(th);
  }
  head.append(row);
  const body = document.createElement('tbody');
  table.append(caption, head, body);
  scroll.append(table);
  const note = document.createElement('p');
  note.className = 'nnb-note';
  note.textContent = pl.astronomyLimit;
  const filterLabel = document.createElement('label'); filterLabel.textContent = 'Filtr obiektów';
  const filter = document.createElement('select');
  for (const [id, label] of [['all', 'Wszystkie'], ['above', 'Nad horyzontem'], ['below', 'Pod horyzontem']] as const) {
    const option = document.createElement('option'); option.value = id; option.textContent = label; filter.append(option);
  }
  filterLabel.append(filter);
  const objects = document.createElement('div'); objects.className = 'nnb-object-list';
  objects.setAttribute('role', 'group'); objects.setAttribute('aria-label', 'Wybierz obiekt z listy');
  const objectButtons = new Map(BODY_IDS.filter((id) => allowed.includes(id)).map((id) => {
    const button = document.createElement('button'); button.type = 'button'; button.textContent = pl.objects[id];
    button.addEventListener('click', () => selectObject(id)); objects.append(button); return [id, button] as const;
  }));
  const catalogHeading = document.createElement('h3'); catalogHeading.textContent = 'Katalog P3: mgławica, galaktyka, planetoida, kometa i księżyce Jowisza';
  const catalogNote = document.createElement('p'); catalogNote.textContent = 'Punkt na mapie oznacza obliczony kierunek, nie obietnicę widoczności gołym okiem. Zakryty przez Jowisza księżyc pozostaje dostępny w karcie.';
  const catalogList = document.createElement('div'); catalogList.className = 'nnb-object-list';
  catalogList.setAttribute('role', 'group'); catalogList.setAttribute('aria-label', 'Wybierz obiekt z katalogu P3');
  const catalogButtons = new Map(CATALOG_IDS.map((id) => {
    const button = document.createElement('button'); button.type = 'button'; button.textContent = id;
    button.addEventListener('click', () => selectCatalog(id)); catalogList.append(button); return [id, button] as const;
  }));
  const catalogTable = document.createElement('div'); catalogTable.className = 'nnb-table-scroll'; catalogTable.tabIndex = 0;
  catalogTable.setAttribute('role', 'region'); catalogTable.setAttribute('aria-label', 'Odczyty katalogu P3');
  const catalogGrid = document.createElement('table');
  const catalogCaption = document.createElement('caption'); catalogCaption.textContent = 'Dodatkowe obiekty i kierunki lokalne';
  const catalogHead = document.createElement('thead'); const catalogHeadRow = document.createElement('tr');
  for (const title of ['Obiekt', 'Typ', 'Azymut', 'Wysokość', 'Status', 'Ważność']) {
    const th = document.createElement('th'); th.scope = 'col'; th.textContent = title; catalogHeadRow.append(th);
  }
  catalogHead.append(catalogHeadRow); const catalogBody = document.createElement('tbody');
  catalogGrid.append(catalogCaption, catalogHead, catalogBody); catalogTable.append(catalogGrid);
  const starSearchLabel = document.createElement('label'); starSearchLabel.textContent = 'Znajdź gwiazdę według numeru HIP';
  const starSearch = document.createElement('input'); starSearch.type = 'search'; starSearch.inputMode = 'numeric';
  starSearch.placeholder = 'np. 32349'; starSearchLabel.append(starSearch);
  const starMatches = document.createElement('div'); starMatches.className = 'nnb-object-list';
  starMatches.setAttribute('role', 'group'); starMatches.setAttribute('aria-label', 'Gwiazdy z katalogu Hipparcos');
  let selectedStarId: number | null = store.getState().selectedStarId;
  if (selectedStarId !== null) starSearch.value = String(selectedStarId);
  const brightStars = [...stars].sort((a, b) => a.magnitude - b.magnitude).slice(0, 12);
  function showStarMatches() {
    starMatches.replaceChildren();
    const query = starSearch.value.trim().replace(/^HIP\s*/i, '');
    const matches = query ? stars.filter((star) => String(star.id).includes(query)).slice(0, 12) : brightStars;
    for (const star of matches) {
      const button = document.createElement('button'); button.type = 'button';
      button.textContent = `HIP ${star.id} · ${star.magnitude.toFixed(2)} mag`;
      button.setAttribute('aria-pressed', String(star.id === selectedStarId)); button.disabled = store.isFrozen();
      button.addEventListener('click', () => {
        if (store.setSelectedStar(star.id)) void host.notifyStateChanged().catch(() => { status.textContent = pl.saveError; });
      });
      starMatches.append(button);
    }
    if (!matches.length) starMatches.textContent = 'Brak gwiazdy o takim numerze HIP w podzbiorze.';
  }
  starSearch.addEventListener('input', showStarMatches); showStarMatches();
  const card = document.createElement('section'); card.className = 'nnb-object-card';
  card.setAttribute('aria-label', 'Karta wybranego obiektu');
  const cardTitle = document.createElement('h3'); const cardReadings = document.createElement('dl');
  const cardImage = document.createElement('img'); cardImage.hidden = true; cardImage.loading = 'lazy';
  const cardJump = document.createElement('button'); cardJump.type = 'button'; cardJump.hidden = true;
  cardJump.textContent = 'Przejdź do dostępnego okresu';
  cardJump.addEventListener('click', () => {
    const id = store.getState().selectedCatalogId; if (!id) return;
    const info = catalogInfo(id); if (!info.validFrom) return;
    const current = store.getState().observation;
    const instantUtc = `${info.validFrom.slice(0,10)}T12:00:00.000Z`;
    if (store.change({ ...current, instantUtc })) void host.notifyStateChanged().catch(() => { status.textContent = pl.saveError; });
  });
  card.append(cardTitle, cardReadings, cardImage, cardJump);
  section.append(heading, status, filterLabel, objects, catalogHeading, catalogNote, catalogList, catalogTable, starSearchLabel, starMatches, card, scroll, note);
  container.append(section);
  function selectObject(objectId: typeof BODY_IDS[number]) {
    if (store.selectObject(objectId)) {
      void host.notifyStateChanged().catch(() => { status.textContent = pl.saveError; });
    } else update();
  }
  function selectCatalog(id: CatalogId) {
    if (store.setSelectedCatalog(id)) void host.notifyStateChanged().catch(() => { status.textContent = pl.saveError; });
    else update();
  }
  const sky = mountSkyView(container, selectObject, (camera) => {
    if (store.setCamera(camera)) void host.notifyStateChanged().catch(() => { status.textContent = pl.saveError; });
  }, selectCatalog);
  const number = new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 3, minimumFractionDigits: 3 });
  const distance = new Intl.NumberFormat('pl-PL', { maximumSignificantDigits: 7 });
  function showCard(snapshot: ObservationSnapshot) {
    cardImage.hidden = true; cardJump.hidden = true;
    const catalogId = store.getState().selectedCatalogId;
    const catalog = currentCatalog.find((item) => item.id === catalogId);
    if (catalogId && !catalog) {
      const info = catalogInfo(catalogId);
      cardTitle.textContent = info.name; cardReadings.replaceChildren();
      for (const [term, value] of [['Typ', info.category], ['Pozycja', 'Brak efemerydy dla wybranej daty'],
        ['Zakres danych', `${info.validFrom?.slice(0,10)} – ${info.validTo?.slice(0,10)}`],
        ['Opis', info.description]] as const) {
        const dt = document.createElement('dt'); dt.textContent = term;
        const dd = document.createElement('dd'); dd.textContent = value; cardReadings.append(dt, dd);
      }
      cardJump.hidden = false; cardJump.disabled = store.isFrozen(); return;
    }
    if (catalog) {
      cardTitle.textContent = catalog.name; cardReadings.replaceChildren();
      for (const [term, value] of [['Typ', catalog.category], [pl.azimuth, `${number.format(catalog.azimuthDeg)}°`],
        [pl.altitude, `${number.format(catalog.altitudeDeg)}°`],
        ['Jasność pozorna', catalog.apparentMagnitude === null ? 'Brak wiarygodnej stałej wartości' : `${catalog.apparentMagnitude.toFixed(1)} mag`],
        ['Rozmiar kątowy', catalog.angularSize],
        ['Widoczność geometryczna', catalog.occultedByJupiter ? 'Zakryty przez tarczę Jowisza w tym modelu' : catalog.altitudeDeg >= 0 ? 'Nad horyzontem; jasność i warunki mogą uniemożliwić obserwację' : 'Pod horyzontem'],
        ['Odległość', catalog.distanceAu === null ? 'Nie dotyczy w tej skali' : `${distance.format(catalog.distanceAu)} au`],
        ['Ważność efemerydy', catalog.validFrom ? `${catalog.validFrom.slice(0,10)} – ${catalog.validTo?.slice(0,10)}` : 'Kierunek katalogowy lub model orbitalny'],
        ['Opis', catalog.description], ['Dokładność i metoda', catalog.quality]] as const) {
        const dt = document.createElement('dt'); dt.textContent = term;
        const dd = document.createElement('dd'); dd.textContent = value; cardReadings.append(dt, dd);
      }
      const source = document.createElement('a'); source.href = catalog.source; source.textContent = 'Źródło danych / opisu';
      source.target = '_blank'; source.rel = 'noopener noreferrer'; const dd = document.createElement('dd'); dd.append(source);
      const dt = document.createElement('dt'); dt.textContent = 'Źródło'; cardReadings.append(dt, dd);
      if (catalog.imageId) {
        const imageId = catalog.imageId;
        void import('../../.generated/p3-images.js').then(({ p3Images }) => {
          if (disposed || store.getState().selectedCatalogId !== catalogId) return;
          cardImage.src = p3Images[imageId];
          cardImage.alt = imageId === 'm31' ? 'M31 w umownych barwach ultrafioletu, obraz GALEX NASA/JPL.'
            : 'M42 w umownych barwach podczerwieni, obraz Spitzera NASA/JPL.';
          cardImage.hidden = false;
        });
      }
      return;
    }
    if (selectedStarId !== null) {
      const record = stars.find((item) => item.id === selectedStarId);
      if (!record) selectedStarId = null;
      else {
        const direction = projectStar(record, snapshot.instantUtc,
          equatorialToHorizonMatrix(snapshot.instantUtc, snapshot.observer), snapshot.refraction);
        cardTitle.textContent = `HIP ${record.id}`; cardReadings.replaceChildren();
        for (const [term, value] of [['Katalog', 'ESA Hipparcos'], ['Jasność V', `${number.format(record.magnitude)} mag`],
          ['RA ICRS J1991.25', `${number.format(record.raDeg / 15)} h`], ['Deklinacja ICRS J1991.25', `${number.format(record.decDeg)}°`],
          [pl.azimuth, `${number.format(direction.azimuthDeg)}°`], [pl.altitude, `${number.format(direction.altitudeDeg)}°`],
          ['Ruch własny RA cos δ', record.pmRaCosDecMasYr === null ? 'brak danych' : `${number.format(record.pmRaCosDecMasYr)} mas/rok`],
          ['Ruch własny Dec', record.pmDecMasYr === null ? 'brak danych' : `${number.format(record.pmDecMasYr)} mas/rok`]] as const) {
          const dt = document.createElement('dt'); dt.textContent = term;
          const dd = document.createElement('dd'); dd.textContent = value; cardReadings.append(dt, dd);
        }
        const featured = record.id === 32349
          ? { fact: 'Syriusz: najjaśniejsza gwiazda nocnego nieba; układ podwójny, około 8,6 roku świetlnego od Ziemi.',
            source: 'https://science.nasa.gov/asset/hubble/the-dog-star-sirius-and-its-tiny-companion/' }
          : record.id === 27989
            ? { fact: 'Betelgeza: czerwony nadolbrzym w Orionie; jej jasność jest zmienna.',
              source: 'https://science.nasa.gov/universe/what-is-betelgeuse-inside-the-strange-volatile-star/' } : null;
        if (featured) {
          const dt = document.createElement('dt'); dt.textContent = 'Zweryfikowana cecha';
          const dd = document.createElement('dd'); dd.textContent = `${featured.fact} `;
          const source = document.createElement('a'); source.href = featured.source; source.textContent = 'NASA';
          source.target = '_blank'; source.rel = 'noopener noreferrer'; dd.append(source); cardReadings.append(dt, dd);
        }
        return;
      }
    }
    const id = store.getState().observation.objectId;
    const selected = snapshot.positions.find((item) => item.objectId === id);
    cardTitle.textContent = pl.objects[id]; cardReadings.replaceChildren();
    if (!selected) return;
    const readings: Array<[string, string]> = [
      ['Położenie', selected.aboveHorizon ? pl.aboveHorizon : pl.belowHorizon],
      [pl.ra, `${number.format(selected.raHours)} h`], [pl.dec, `${number.format(selected.decDeg)}°`],
      [pl.azimuth, `${number.format(selected.azimuthDeg)}°`], [pl.altitude, `${number.format(selected.altitudeDeg)}°`],
      [pl.distance, `${distance.format(selected.distanceAu)} au`],
      ['Średnica kątowa', `${number.format(selected.angularDiameterArcmin)}′`],
    ];
    if (selected.phaseFraction !== null) readings.push(['Oświetlona część tarczy (geocentrycznie)', `${(selected.phaseFraction * 100).toFixed(1)}%`]);
    if (selected.apparentMagnitude !== null) readings.push(['Jasność pozorna (geocentrycznie)', `${number.format(selected.apparentMagnitude)} mag`]);
    for (const [term, value] of readings) {
      const dt = document.createElement('dt'); dt.textContent = term;
      const dd = document.createElement('dd'); dd.textContent = value; cardReadings.append(dt, dd);
    }
  }
  function showTable(snapshot: ObservationSnapshot) {
    body.replaceChildren();
    caption.textContent = `${pl.coordinateConvention} ${snapshot.instantUtc}`;
    for (const position of snapshot.positions.filter((item) => allowed.includes(item.objectId) && (filter.value === 'all' || (filter.value === 'above') === item.aboveHorizon))) {
      const tr = document.createElement('tr'); tr.dataset.object = position.objectId;
      const values = [pl.objects[position.objectId], number.format(position.raHours), number.format(position.decDeg),
        number.format(position.altitudeDeg), number.format(position.azimuthDeg), distance.format(position.distanceAu),
        position.aboveHorizon ? pl.aboveHorizon : pl.belowHorizon];
      values.forEach((value, index) => {
        const cell = document.createElement(index === 0 ? 'th' : 'td');
        if (index === 0) cell.setAttribute('scope', 'row');
        cell.textContent = value; tr.append(cell);
      });
      body.append(tr);
    }
  }
  function update() {
    const observation = store.getState().observation;
    const state = store.getState();
    if (selectedStarId !== state.selectedStarId) {
      selectedStarId = state.selectedStarId;
      starSearch.value = selectedStarId === null ? '' : String(selectedStarId);
      showStarMatches();
    }
    const running = state.playbackRate !== 0 && !store.isFrozen();
    status.setAttribute('aria-live', running ? 'off' : 'polite');
    sky.update(visibleSnapshot(currentSnapshot), observation.objectId, store.isFrozen(), state.camera, selectedStarId, currentCatalog, state.selectedCatalogId ?? null);
    for (const [id, button] of objectButtons) {
      button.disabled = store.isFrozen();
      button.hidden = Boolean(currentSnapshot && filter.value !== 'all' && (filter.value === 'above') !== currentSnapshot.positions.find((item) => item.objectId === id)?.aboveHorizon);
      button.setAttribute('aria-pressed', String(selectedStarId === null && id === observation.objectId));
    }
    filter.disabled = store.isFrozen();
    for (const [id, button] of catalogButtons) {
      const position = currentCatalog.find((item) => item.id === id);
      button.hidden = Boolean(currentSnapshot && position && filter.value !== 'all' && (filter.value === 'above') !== (position.altitudeDeg >= 0));
      button.disabled = store.isFrozen(); button.setAttribute('aria-pressed', String(state.selectedCatalogId === id));
      button.textContent = catalogInfo(id).name;
    }
    starSearch.disabled = store.isFrozen();
    starMatches.querySelectorAll('button').forEach((button) => { button.disabled = store.isFrozen(); });
    if (currentSnapshot) showCard(currentSnapshot);
    const key = JSON.stringify([observation.instantUtc, observation.observer, observation.refraction]);
    if (key === lastKey) {
      if (!running && currentSnapshot) { showTable(currentSnapshot); status.textContent = pl.readingsUpdated; }
      return;
    }
    lastKey = key;
    currentCatalog = calculateCatalog(observation);
    for (const [id, button] of catalogButtons) {
      button.hidden = false; button.textContent = catalogInfo(id).name;
    }
    catalogBody.replaceChildren();
    for (const item of currentCatalog) {
      const row = document.createElement('tr'); const values = [item.name, item.category, `${number.format(item.azimuthDeg)}°`,
        `${number.format(item.altitudeDeg)}°`, item.occultedByJupiter ? 'Zakryty przez Jowisza' : item.altitudeDeg >= 0 ? 'Nad horyzontem' : 'Pod horyzontem',
        item.validFrom ? `${item.validFrom.slice(0,10)} – ${item.validTo?.slice(0,10)}` : 'bez ograniczenia tabeli'];
      values.forEach((value, index) => { const cell = document.createElement(index ? 'td' : 'th');
        if (!index) cell.scope = 'row'; cell.textContent = value; row.append(cell); }); catalogBody.append(row);
    }
    status.textContent = running ? pl.motionReading : pl.calculating;
    if (!running) {
      currentSnapshot = undefined;
      sky.update(undefined, observation.objectId, store.isFrozen(), state.camera, selectedStarId, currentCatalog, state.selectedCatalogId ?? null);
      body.replaceChildren();
    }
    section.setAttribute('aria-busy', 'true');
    void client.calculate(observation).then((snapshot) => {
      if (!snapshot || disposed || key !== lastKey) return;
      section.setAttribute('aria-busy', 'false');
      currentSnapshot = snapshot;
      showCard(snapshot);
      sky.update(visibleSnapshot(snapshot), store.getState().observation.objectId, store.isFrozen(), store.getState().camera, selectedStarId, currentCatalog, store.getState().selectedCatalogId ?? null);
      section.dataset.mode = client.getMode();
      const stillRunning = store.getState().playbackRate !== 0 && !store.isFrozen();
      status.textContent = stillRunning ? pl.motionReading : `${client.getMode() === 'worker' ? pl.worker : pl.mainThread} · ${snapshot.refraction ? pl.refractionOn : pl.refractionOff}`;
      if (!stillRunning || !body.childElementCount) showTable(snapshot);
    }).catch((error: unknown) => {
      if (disposed || key !== lastKey) return;
      section.setAttribute('aria-busy', 'false');
      status.textContent = error instanceof Error && error.message === 'outside-validity' ? pl.outsideValidity : pl.calculationError;
    });
  }
  const unsubscribe = store.subscribe(update);
  filter.addEventListener('change', update);
  update();
  return { destroy() { disposed = true; unsubscribe(); filter.removeEventListener('change', update);
    starSearch.removeEventListener('input', showStarMatches); client.dispose(); sky.destroy(); section.remove(); } };
}
