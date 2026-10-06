// Główne wejście Three.Core zapisuje window.__THREE__. Importujemy wyłącznie
// potrzebne moduły z oficjalnie eksportowanej ścieżki src, bez patchowania globali.
import { BufferGeometry } from 'three/src/core/BufferGeometry.js';
import { Float32BufferAttribute } from 'three/src/core/BufferAttribute.js';
import { LineBasicMaterial } from 'three/src/materials/LineBasicMaterial.js';
import { LineSegments } from 'three/src/objects/LineSegments.js';
import { PerspectiveCamera } from 'three/src/cameras/PerspectiveCamera.js';
import { Points } from 'three/src/objects/Points.js';
import { PointsMaterial } from 'three/src/materials/PointsMaterial.js';
import { Scene } from 'three/src/scenes/Scene.js';
import { WebGLRenderer } from 'three/src/renderers/WebGLRenderer.js';
import type { BodyPosition } from '../../astronomy/ephemeris';
import type { CatalogPosition, CatalogId } from '../../astronomy/extra-catalog';
import type { ObjectId } from '../../domain/probe';
import { cameraBasis, projectDirection, skyDirection, type SkyCamera, type Vector3Tuple } from './projection';

const COLORS: Record<ObjectId, string> = { Sun: '#ffe08a', Moon: '#e5efff', Mercury: '#d1d6dc', Venus: '#f8dcc0', Mars: '#ffa68c', Jupiter: '#f2c09b', Saturn: '#e5d7a3', Uranus: '#a9e8ed', Neptune: '#8caaff' };
export interface SkyFrame { camera: SkyCamera; positions: readonly BodyPosition[]; selected: ObjectId;
  catalogPositions?: readonly CatalogPosition[]; selectedCatalogId?: CatalogId | null;
  starDirections?: Float32Array; selectedStarDirection?: Vector3Tuple | undefined; figureSegments?: Float32Array; equatorialSegments?: Float32Array;
  layers?: { grid: boolean; equatorial: boolean; stars: boolean; figures: boolean; bodies: boolean } }
export interface SkyRenderer {
  mode: 'webgl2' | 'canvas' | 'unavailable';
  canvas: HTMLCanvasElement;
  render(frame: SkyFrame, width: number, height: number): void;
  dispose(): void;
}

function gridSegments(): Float32Array {
  const vertices: number[] = [];
  for (const altitude of [-60, -30, 0, 30, 60]) {
    for (let azimuth = 0; azimuth < 360; azimuth += 2) {
      vertices.push(...skyDirection(azimuth, altitude), ...skyDirection(azimuth + 2, altitude));
    }
  }
  for (let azimuth = 0; azimuth < 360; azimuth += 45) {
    for (let altitude = -88; altitude < 88; altitude += 2) {
      vertices.push(...skyDirection(azimuth, altitude), ...skyDirection(azimuth, altitude + 2));
    }
  }
  return new Float32Array(vertices);
}
const grid = gridSegments();
function vectorAt(points: Float32Array, index: number): Vector3Tuple {
  return [points[index]!, points[index + 1]!, points[index + 2]!];
}

export function createCanvasRenderer(container: HTMLElement, stars = new Float32Array()): SkyRenderer {
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  container.prepend(canvas);
  const context = canvas.getContext('2d');
  return {
    mode: context ? 'canvas' : 'unavailable', canvas,
    render(frame, width, height) {
      if (!context || width <= 0 || height <= 0) return;
      const ratio = Math.min(devicePixelRatio || 1, 2);
      if (canvas.width !== Math.round(width * ratio) || canvas.height !== Math.round(height * ratio)) {
        canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
      }
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.fillStyle = '#081426'; context.fillRect(0, 0, width, height);
      context.strokeStyle = '#345779'; context.lineWidth = 1;
      context.beginPath();
      for (let i = 0; frame.layers?.grid !== false && i < grid.length; i += 6) {
        const a = projectDirection(vectorAt(grid, i), frame.camera, width, height);
        const b = projectDirection(vectorAt(grid, i + 3), frame.camera, width, height);
        if (a && b) { context.moveTo(a.x, a.y); context.lineTo(b.x, b.y); }
      }
      context.stroke();
      if (frame.layers?.equatorial && frame.equatorialSegments) {
        context.strokeStyle = '#6db3a4'; context.beginPath();
        for (let i = 0; i < frame.equatorialSegments.length; i += 6) {
          const a = projectDirection(vectorAt(frame.equatorialSegments, i), frame.camera, width, height);
          const b = projectDirection(vectorAt(frame.equatorialSegments, i + 3), frame.camera, width, height);
          if (a && b) { context.moveTo(a.x, a.y); context.lineTo(b.x, b.y); }
        }
        context.stroke();
      }
      if (frame.layers?.figures !== false && frame.figureSegments) {
        context.strokeStyle = '#ffce73'; context.beginPath();
        for (let i = 0; i < frame.figureSegments.length; i += 6) {
          const a = projectDirection(vectorAt(frame.figureSegments, i), frame.camera, width, height);
          const b = projectDirection(vectorAt(frame.figureSegments, i + 3), frame.camera, width, height);
          if (a && b) { context.moveTo(a.x, a.y); context.lineTo(b.x, b.y); }
        }
        context.stroke();
      }
      context.fillStyle = '#dcebff';
      const visibleStars = frame.starDirections ?? stars;
      for (let i = 0; frame.layers?.stars !== false && i < visibleStars.length; i += 3) {
        const point = projectDirection(vectorAt(visibleStars, i), frame.camera, width, height);
        if (point) context.fillRect(point.x, point.y, 1.5, 1.5);
      }
      for (const position of frame.layers?.bodies === false ? [] : frame.positions) {
        const point = projectDirection(skyDirection(position.azimuthDeg, position.altitudeDeg), frame.camera, width, height);
        if (!point) continue;
        context.fillStyle = COLORS[position.objectId]; context.beginPath();
        context.arc(point.x, point.y, position.objectId === frame.selected ? 8 : 5, 0, Math.PI * 2);
        context.fill();
      }
      if (frame.layers?.bodies !== false) for (const position of frame.catalogPositions?.filter((item) => !item.occultedByJupiter) ?? []) {
        const point = projectDirection(skyDirection(position.azimuthDeg, position.altitudeDeg), frame.camera, width, height);
        if (!point) continue;
        context.fillStyle = position.id === frame.selectedCatalogId ? '#ffd166' : '#9fe4bd';
        context.beginPath(); context.arc(point.x, point.y, position.id === frame.selectedCatalogId ? 7 : 4, 0, Math.PI*2); context.fill();
      }
      if (frame.selectedStarDirection) {
        const point = projectDirection(frame.selectedStarDirection, frame.camera, width, height);
        if (point) { context.strokeStyle = '#ffd166'; context.lineWidth = 2; context.beginPath();
          context.arc(point.x, point.y, 8, 0, Math.PI * 2); context.stroke(); }
      }
    },
    dispose() { canvas.remove(); },
  };
}

export function createSkyRenderer(container: HTMLElement, onContextLost: () => void, stars = new Float32Array()): SkyRenderer {
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  let renderer: WebGLRenderer;
  try {
    const context = canvas.getContext('webgl2', { antialias: true, alpha: false });
    if (!context) return createCanvasRenderer(container, stars);
    renderer = new WebGLRenderer({ canvas, context, antialias: true });
  } catch { return createCanvasRenderer(container, stars); }
  container.prepend(canvas);
  const scene = new Scene();
  const camera = new PerspectiveCamera(100, 1, 0.01, 10);
  const gridGeometry = new BufferGeometry();
  gridGeometry.setAttribute('position', new Float32BufferAttribute(grid, 3));
  const gridMaterial = new LineBasicMaterial({ color: '#345779' });
  const gridLines = new LineSegments(gridGeometry, gridMaterial); scene.add(gridLines);
  const equatorialGeometry = new BufferGeometry(); let equatorialBuffer = new Float32Array();
  equatorialGeometry.setAttribute('position', new Float32BufferAttribute(equatorialBuffer, 3));
  const equatorialMaterial = new LineBasicMaterial({ color: '#6db3a4' });
  const equatorialLines = new LineSegments(equatorialGeometry, equatorialMaterial); scene.add(equatorialLines);
  const figureGeometry = new BufferGeometry();
  let figureBuffer = new Float32Array();
  figureGeometry.setAttribute('position', new Float32BufferAttribute(figureBuffer, 3));
  const figureMaterial = new LineBasicMaterial({ color: '#ffce73' });
  const figureLines = new LineSegments(figureGeometry, figureMaterial); scene.add(figureLines);
  const starGeometry = new BufferGeometry();
  let starBuffer = new Float32Array(stars);
  starGeometry.setAttribute('position', new Float32BufferAttribute(starBuffer, 3));
  const starMaterial = new PointsMaterial({ color: '#dcebff', size: 1.5, sizeAttenuation: false });
  const starPoints = new Points(starGeometry, starMaterial);
  scene.add(starPoints);
  const selectedStarGeometry = new BufferGeometry();
  selectedStarGeometry.setAttribute('position', new Float32BufferAttribute([0, 0, 0], 3));
  const selectedStarMaterial = new PointsMaterial({ color: '#ffd166', size: 16, sizeAttenuation: false });
  const selectedStarPoint = new Points(selectedStarGeometry, selectedStarMaterial); scene.add(selectedStarPoint);
  const bodies = (['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune'] as const).map((objectId) => {
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute([0, 0, 0], 3));
    const material = new PointsMaterial({ color: COLORS[objectId], size: 10, sizeAttenuation: false });
    const points = new Points(geometry, material); points.visible = false; scene.add(points);
    return { objectId, geometry, material, points };
  });
  const catalogGeometry = new BufferGeometry();
  catalogGeometry.setAttribute('position', new Float32BufferAttribute(new Float32Array(8*3), 3));
  const catalogMaterial = new PointsMaterial({ color: '#9fe4bd', size: 8, sizeAttenuation: false });
  const catalogPoints = new Points(catalogGeometry, catalogMaterial); scene.add(catalogPoints);
  const selectedCatalogGeometry = new BufferGeometry();
  selectedCatalogGeometry.setAttribute('position', new Float32BufferAttribute([0, 0, 0], 3));
  const selectedCatalogMaterial = new PointsMaterial({ color: '#ffd166', size: 16, sizeAttenuation: false });
  const selectedCatalogPoint = new Points(selectedCatalogGeometry, selectedCatalogMaterial); scene.add(selectedCatalogPoint);
  renderer.setClearColor('#081426');
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  let disposed = false;
  function lost(event: Event) { event.preventDefault(); if (!disposed) onContextLost(); }
  canvas.addEventListener('webglcontextlost', lost);
  return {
    mode: 'webgl2', canvas,
    render(frame, width, height) {
      if (disposed || width <= 0 || height <= 0) return;
      const directions = frame.starDirections ?? stars;
      const equatorial = frame.equatorialSegments ?? new Float32Array();
      if (equatorial.length !== equatorialBuffer.length) {
        equatorialBuffer = new Float32Array(equatorial.length);
        equatorialGeometry.setAttribute('position', new Float32BufferAttribute(equatorialBuffer, 3));
      }
      equatorialBuffer.set(equatorial);
      equatorialGeometry.getAttribute('position').needsUpdate = true;
      equatorialLines.visible = Boolean(frame.layers?.equatorial && equatorial.length);
      const figures = frame.figureSegments ?? new Float32Array();
      if (figures.length !== figureBuffer.length) {
        figureBuffer = new Float32Array(figures.length);
        figureGeometry.setAttribute('position', new Float32BufferAttribute(figureBuffer, 3));
      }
      figureBuffer.set(figures);
      figureGeometry.getAttribute('position').needsUpdate = true;
      figureLines.visible = frame.layers?.figures !== false && figures.length > 0;
      gridLines.visible = frame.layers?.grid !== false;
      if (directions.length !== starBuffer.length) {
        starGeometry.dispose(); starBuffer = new Float32Array(directions.length);
        starGeometry.setAttribute('position', new Float32BufferAttribute(starBuffer, 3));
      }
      if (frame.starDirections) {
        starBuffer.set(directions);
        starGeometry.getAttribute('position').needsUpdate = true;
      }
      starPoints.visible = frame.layers?.stars !== false && directions.length > 0;
      selectedStarPoint.visible = Boolean(frame.selectedStarDirection);
      if (frame.selectedStarDirection) {
        const attribute = selectedStarGeometry.getAttribute('position');
        attribute.setXYZ(0, ...frame.selectedStarDirection); attribute.needsUpdate = true;
        selectedStarGeometry.computeBoundingSphere();
      }
      const basis = cameraBasis(frame.camera);
      camera.up.set(...basis.up); camera.lookAt(...basis.forward);
      camera.aspect = width / height; camera.fov = frame.camera.fovDeg; camera.updateProjectionMatrix();
      if (canvas.width !== Math.round(width * renderer.getPixelRatio()) || canvas.height !== Math.round(height * renderer.getPixelRatio())) {
        renderer.setSize(width, height, false);
      }
      for (const body of bodies) {
        const position = frame.positions.find((value) => value.objectId === body.objectId);
        body.points.visible = frame.layers?.bodies !== false && Boolean(position);
        if (!position) continue;
        const attribute = body.geometry.getAttribute('position');
        attribute.setXYZ(0, ...skyDirection(position.azimuthDeg, position.altitudeDeg));
        attribute.needsUpdate = true;
        body.geometry.computeBoundingSphere();
        body.material.size = body.objectId === frame.selected ? 16 : 10;
      }
      const catalog = frame.layers?.bodies === false ? [] : frame.catalogPositions?.filter((item) => !item.occultedByJupiter) ?? [];
      catalogPoints.visible = catalog.length > 0;
      catalogGeometry.setDrawRange(0, catalog.length);
      const positions = catalogGeometry.getAttribute('position');
      for (let i = 0; i < 8; i++) {
        const item = catalog[i];
        positions.setXYZ(i, ...(item ? skyDirection(item.azimuthDeg, item.altitudeDeg) : [0, 0, 0] as Vector3Tuple));
      }
      positions.needsUpdate = true; catalogGeometry.computeBoundingSphere();
      const selectedItem = catalog.find((item) => item.id === frame.selectedCatalogId);
      selectedCatalogPoint.visible = Boolean(selectedItem);
      if (selectedItem) {
        const attribute = selectedCatalogGeometry.getAttribute('position');
        attribute.setXYZ(0, ...skyDirection(selectedItem.azimuthDeg, selectedItem.altitudeDeg));
        attribute.needsUpdate = true; selectedCatalogGeometry.computeBoundingSphere();
      }
      renderer.render(scene, camera);
    },
    dispose() {
      disposed = true;
      canvas.removeEventListener('webglcontextlost', lost);
      for (const body of bodies) { body.geometry.dispose(); body.material.dispose(); }
      catalogGeometry.dispose(); catalogMaterial.dispose();
      selectedCatalogGeometry.dispose(); selectedCatalogMaterial.dispose();
      gridGeometry.dispose(); gridMaterial.dispose(); equatorialGeometry.dispose(); equatorialMaterial.dispose(); figureGeometry.dispose(); figureMaterial.dispose(); starGeometry.dispose(); starMaterial.dispose(); selectedStarGeometry.dispose(); selectedStarMaterial.dispose();
      renderer.dispose(); renderer.forceContextLoss(); canvas.remove();
    },
  };
}
