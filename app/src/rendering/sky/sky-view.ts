import type { ObservationSnapshot } from '../../astronomy/ephemeris';
import type { CatalogPosition, CatalogId } from '../../astronomy/extra-catalog';
import type { ObjectId } from '../../domain/probe';
import { calculateStarDirections, constellations, equatorialToHorizonMatrix, projectStar, stars } from '../../astronomy/stars';
import { equatorialGrid } from '../../astronomy/sky-grids';
import { pl } from '../../i18n/pl';
import { createCanvasRenderer, createSkyRenderer, type SkyRenderer } from './renderer';
import { normalizeCamera, projectDirection, skyDirection, type SkyCamera } from './projection';

export function mountSkyView(container: HTMLElement, onSelect: (id: ObjectId) => void, onCamera: (camera: SkyCamera) => void,
  onSelectCatalog?: (id: CatalogId) => void) {
  const section = document.createElement('section'); section.setAttribute('aria-label', pl.sky);
  const heading = document.createElement('h2'); heading.textContent = pl.sky;
  const viewport = document.createElement('div'); viewport.className = 'nnb-sky-viewport';
  const labels = document.createElement('div'); labels.className = 'nnb-sky-labels'; labels.setAttribute('aria-hidden', 'true');
  viewport.append(labels);
  const description = document.createElement('p'); description.className = 'nnb-note'; description.textContent = pl.skyNote;
  const controls = document.createElement('div'); controls.className = 'nnb-sky-controls';
  const layerControls = document.createElement('fieldset'); layerControls.className = 'nnb-sky-layers';
  const legend = document.createElement('legend'); legend.textContent = 'Warstwy mapy'; layerControls.append(legend);
  const layers = { grid: true, equatorial: false, stars: true, figures: false, bodies: true };
  for (const [key, label] of [['grid', 'Siatka horyzontalna'], ['equatorial', 'Siatka równikowa daty'], ['stars', 'Gwiazdy'], ['figures', 'Figury gwiazdozbiorów'], ['bodies', 'Ciała Układu Słonecznego']] as const) {
    const wrapper = document.createElement('label'); const input = document.createElement('input'); input.type = 'checkbox';
    input.checked = layers[key]; wrapper.append(input, document.createTextNode(` ${label}`)); layerControls.append(wrapper);
    input.addEventListener('change', () => { layers[key] = input.checked; render(); });
  }
  const status = document.createElement('p'); status.className = 'nnb-sky-status';
  const viewReadout = document.createElement('p');
  section.append(heading, viewport, status, viewReadout, controls, layerControls, description);
  container.append(section);
  let camera: SkyCamera = { azimuthDeg: 0, altitudeDeg: 15, fovDeg: 100 };
  let snapshot: ObservationSnapshot | undefined;
  let selected: ObjectId = 'Moon';
  let catalogPositions: CatalogPosition[] = [];
  let selectedCatalogId: CatalogId | null = null;
  let starKey = '';
  let starDirections = new Float32Array();
  let selectedStarId: number | null = null;
  let selectedStarDirection: readonly [number, number, number] | undefined;
  let selectedStarKey = '';
  let figureSegments = new Float32Array();
  let equatorialSegments = new Float32Array();
  let follow = false;
  let drag: { pointerId: number; x: number; y: number; camera: SkyCamera; moved: boolean } | null = null;
  let suppressClick = false;
  let frozen = false;
  let disposed = false;
  let renderer: SkyRenderer;
  function selectedStarAngles() {
    if (!selectedStarDirection) return null;
    const [north, west, up] = selectedStarDirection;
    return { azimuthDeg: (Math.atan2(-west, north) * 180 / Math.PI + 360) % 360,
      altitudeDeg: Math.asin(up) * 180 / Math.PI };
  }
  function fallback() {
    renderer.dispose(); renderer = createCanvasRenderer(viewport); render();
    status.textContent = pl.contextLost;
  }
  renderer = createSkyRenderer(viewport, fallback);
  function render() {
    if (disposed) return;
    const width = viewport.clientWidth; const height = viewport.clientHeight;
    renderer.render({ camera, positions: snapshot?.positions ?? [], selected, catalogPositions, selectedCatalogId, starDirections,
      selectedStarDirection: selectedStarDirection && [...selectedStarDirection], figureSegments, equatorialSegments, layers }, width, height);
    section.dataset.renderer = renderer.mode;
    status.textContent = renderer.mode === 'webgl2' ? pl.webgl : renderer.mode === 'canvas' ? pl.canvas : pl.noGraphics;
    viewReadout.textContent = `${pl.cameraAzimuth} ${camera.azimuthDeg.toFixed(0)}° · ${pl.cameraAltitude} ${camera.altitudeDeg.toFixed(0)}° · ${pl.fov} ${camera.fovDeg.toFixed(0)}°`;
    labels.replaceChildren();
    for (const position of (snapshot?.positions ?? []).filter((item) => layers.bodies && (item.objectId === selected || camera.fovDeg <= 80))) {
      const point = projectDirection(skyDirection(position.azimuthDeg, position.altitudeDeg), camera, width, height);
      if (!point) continue;
      const label = document.createElement('span');
      label.textContent = `${pl.objects[position.objectId]}${position.aboveHorizon ? '' : ` (${pl.belowHorizon.toLowerCase()})`}`;
      label.style.left = `${Math.min(Math.max(point.x, 70), Math.max(width - 70, 70))}px`;
      label.style.top = `${Math.min(point.y + 14, height - 28)}px`;
      labels.append(label);
    }
    for (const position of catalogPositions.filter((item) => layers.bodies && !item.occultedByJupiter && (item.id === selectedCatalogId || camera.fovDeg <= 80))) {
      const point = projectDirection(skyDirection(position.azimuthDeg, position.altitudeDeg), camera, width, height);
      if (!point) continue;
      const label = document.createElement('span'); label.textContent = position.name;
      label.style.left = `${Math.min(Math.max(point.x, 70), Math.max(width - 70, 70))}px`;
      label.style.top = `${Math.min(point.y + 14, height - 28)}px`; labels.append(label);
    }
    if (selectedStarDirection) {
      const point = projectDirection([...selectedStarDirection], camera, width, height);
      if (point) { const label = document.createElement('span'); label.textContent = `HIP ${selectedStarId}`;
        label.style.left = `${point.x}px`; label.style.top = `${point.y + 15}px`; labels.append(label); }
    }
    for (const direction of [{ name: 'N', az: 0 }, { name: 'E', az: 90 }, { name: 'S', az: 180 }, { name: 'W', az: 270 }]) {
      const point = projectDirection(skyDirection(direction.az, 0), camera, width, height);
      if (!point) continue;
      const label = document.createElement('span'); label.className = 'nnb-cardinal';
      label.textContent = `${direction.name} · ${pl.horizon.toLowerCase()}`;
      label.style.left = `${Math.min(Math.max(point.x, 60), Math.max(width - 60, 60))}px`;
      label.style.top = `${Math.max(point.y - 30, 0)}px`; labels.append(label);
    }
  }
  const actions: Array<[string, () => void]> = [
    [pl.left, () => { follow = false; camera.azimuthDeg -= 15; }], [pl.right, () => { follow = false; camera.azimuthDeg += 15; }],
    [pl.up, () => { follow = false; camera.altitudeDeg += 15; }], [pl.down, () => { follow = false; camera.altitudeDeg -= 15; }],
    [pl.zoomIn, () => { camera.fovDeg -= 15; }], [pl.zoomOut, () => { camera.fovDeg += 15; }],
    [pl.centerSelected, () => {
      const star = selectedStarAngles();
      if (star) { camera.azimuthDeg = star.azimuthDeg; camera.altitudeDeg = star.altitudeDeg; return; }
      const catalog = catalogPositions.find((item) => item.id === selectedCatalogId);
      if (catalog) { camera.azimuthDeg = catalog.azimuthDeg; camera.altitudeDeg = catalog.altitudeDeg; return; }
      const body = snapshot?.positions.find((position) => position.objectId === selected);
      if (body) { camera.azimuthDeg = body.azimuthDeg; camera.altitudeDeg = body.altitudeDeg; }
    }],
  ];
  const followButton = document.createElement('button'); followButton.type = 'button';
  followButton.textContent = 'Śledź wybrany obiekt'; followButton.setAttribute('aria-pressed', 'false');
  followButton.addEventListener('click', () => { follow = !follow; followButton.setAttribute('aria-pressed', String(follow));
    if (follow) { const body = selectedStarAngles() ?? catalogPositions.find((item) => item.id === selectedCatalogId) ?? snapshot?.positions.find((item) => item.objectId === selected);
      if (body) { camera = normalizeCamera({ ...camera, azimuthDeg: body.azimuthDeg, altitudeDeg: body.altitudeDeg }); onCamera(camera); } }
    render(); }); controls.append(followButton);
  const cleanups: Array<() => void> = [];
  for (const [text, action] of actions) {
    const button = document.createElement('button'); button.type = 'button'; button.textContent = text;
    const listener = () => { if (frozen) return; action(); camera = normalizeCamera(camera); onCamera(camera); render(); };
    button.addEventListener('click', listener); controls.append(button);
    cleanups.push(() => button.removeEventListener('click', listener));
  }
  function click(event: MouseEvent) {
    if (frozen || suppressClick) { suppressClick = false; return; }
    const rect = viewport.getBoundingClientRect();
    let nearest: ObjectId | undefined; let nearestCatalog: CatalogId | undefined; let distance = 24;
    for (const body of snapshot?.positions ?? []) {
      const point = projectDirection(skyDirection(body.azimuthDeg, body.altitudeDeg), camera, rect.width, rect.height);
      if (!point) continue;
      const separation = Math.hypot(point.x - (event.clientX - rect.left), point.y - (event.clientY - rect.top));
      if (separation < distance) { nearest = body.objectId; nearestCatalog = undefined; distance = separation; }
    }
    for (const item of catalogPositions.filter((position) => !position.occultedByJupiter)) {
      const point = projectDirection(skyDirection(item.azimuthDeg, item.altitudeDeg), camera, rect.width, rect.height);
      if (!point) continue;
      const separation = Math.hypot(point.x - (event.clientX - rect.left), point.y - (event.clientY - rect.top));
      if (separation < distance) { nearestCatalog = item.id; nearest = undefined; distance = separation; }
    }
    if (nearestCatalog) onSelectCatalog?.(nearestCatalog);
    else if (nearest) onSelect(nearest);
  }
  function pointerDown(event: PointerEvent) {
    if (frozen || event.button !== 0) return;
    follow = false; followButton.setAttribute('aria-pressed', 'false');
    drag = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, camera: { ...camera }, moved: false };
    viewport.setPointerCapture(event.pointerId);
  }
  function pointerMove(event: PointerEvent) {
    if (!drag || drag.pointerId !== event.pointerId) return;
    const dx = event.clientX - drag.x; const dy = event.clientY - drag.y;
    if (Math.hypot(dx, dy) > 4) drag.moved = true;
    if (!drag.moved) return;
    camera = normalizeCamera({ ...drag.camera,
      azimuthDeg: drag.camera.azimuthDeg - dx * drag.camera.fovDeg / Math.max(viewport.clientWidth, 1),
      altitudeDeg: drag.camera.altitudeDeg + dy * drag.camera.fovDeg / Math.max(viewport.clientHeight, 1) });
    render();
  }
  function pointerUp(event: PointerEvent) {
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (drag.moved) { suppressClick = true; setTimeout(() => { suppressClick = false; }, 0); onCamera(camera); }
    drag = null;
  }
  function wheel(event: WheelEvent) {
    if (frozen) return;
    event.preventDefault();
    camera = normalizeCamera({ ...camera, fovDeg: camera.fovDeg + Math.sign(event.deltaY) * 5 });
    onCamera(camera); render();
  }
  viewport.addEventListener('click', click);
  viewport.addEventListener('pointerdown', pointerDown);
  viewport.addEventListener('pointermove', pointerMove);
  viewport.addEventListener('pointerup', pointerUp);
  viewport.addEventListener('pointercancel', pointerUp);
  viewport.addEventListener('wheel', wheel, { passive: false });
  const resize = new ResizeObserver(render); resize.observe(viewport); render();
  return {
    update(value: ObservationSnapshot | undefined, objectId: ObjectId, isFrozen: boolean, view: SkyCamera, starId: number | null = null,
      extras: CatalogPosition[] = [], catalogId: CatalogId | null = null) {
      if (!drag) camera = { ...view };
      snapshot = value; selected = objectId; selectedStarId = starId; catalogPositions = extras; selectedCatalogId = catalogId; frozen = isFrozen;
      if (follow && value && !isFrozen && starId === null) {
        const body = catalogPositions.find((item) => item.id === catalogId) ?? value.positions.find((item) => item.objectId === selected);
        if (body) { camera = normalizeCamera({ ...camera, azimuthDeg: body.azimuthDeg, altitudeDeg: body.altitudeDeg });
          if (Math.abs(view.azimuthDeg - camera.azimuthDeg) > 0.01 || Math.abs(view.altitudeDeg - camera.altitudeDeg) > 0.01) onCamera(camera); }
      }
      if (value) {
        const key = JSON.stringify([value.instantUtc, value.observer, value.refraction]);
        if (key !== starKey) {
          const stars = calculateStarDirections(value.instantUtc, value.observer, value.refraction);
          const vectors = new Float32Array(stars.length * 3);
          stars.forEach((star, index) => vectors.set(skyDirection(star.azimuthDeg, star.altitudeDeg), index * 3));
          starDirections = vectors; starKey = key;
          const byId = new Map(stars.map((star) => [star.id, star]));
          const segments: number[] = [];
          for (const constellation of constellations) for (const path of constellation.figure) for (let index = 1; index < path.length; index++) {
            const a = byId.get(path[index - 1]!); const b = byId.get(path[index]!);
            if (a && b) segments.push(...skyDirection(a.azimuthDeg, a.altitudeDeg), ...skyDirection(b.azimuthDeg, b.altitudeDeg));
          }
          figureSegments = new Float32Array(segments);
          const equatorial: number[] = [];
          for (const path of equatorialGrid(value.instantUtc, value.observer)) for (let index = 1; index < path.length; index++) {
            const a = path[index - 1]!; const b = path[index]!;
            equatorial.push(...skyDirection(a.azimuthDeg, a.altitudeDeg), ...skyDirection(b.azimuthDeg, b.altitudeDeg));
          }
          equatorialSegments = new Float32Array(equatorial);
        }
      }
      const selectionKey = `${starKey}:${starId}`;
      if (selectionKey !== selectedStarKey) {
        const record = starId === null ? undefined : stars.find((item) => item.id === starId);
        const direction = record && value && projectStar(record, value.instantUtc,
          equatorialToHorizonMatrix(value.instantUtc, value.observer), value.refraction);
        selectedStarDirection = direction && skyDirection(direction.azimuthDeg, direction.altitudeDeg);
        selectedStarKey = selectionKey;
      }
      if (follow && starId !== null && !isFrozen) {
        const direction = selectedStarAngles();
        if (direction) { camera = normalizeCamera({ ...camera, ...direction });
          if (Math.abs(view.azimuthDeg - camera.azimuthDeg) > 0.01 || Math.abs(view.altitudeDeg - camera.altitudeDeg) > 0.01) onCamera(camera); }
      }
      controls.querySelectorAll('button').forEach((button) => { button.disabled = frozen; });
      layerControls.querySelectorAll('input').forEach((input) => { input.disabled = frozen; });
      render();
    },
    destroy() {
      disposed = true; resize.disconnect(); cleanups.forEach((cleanup) => cleanup());
      viewport.removeEventListener('click', click);
      viewport.removeEventListener('pointerdown', pointerDown); viewport.removeEventListener('pointermove', pointerMove);
      viewport.removeEventListener('pointerup', pointerUp); viewport.removeEventListener('pointercancel', pointerUp);
      viewport.removeEventListener('wheel', wheel); renderer.dispose(); section.remove();
    },
  };
}
