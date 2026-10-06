import { createSkyRenderer, createCanvasRenderer } from './sky/renderer';
import { skyDirection } from './sky/projection';
import { calculateStarDirections } from '../astronomy/stars';
import '../styles/probe.css';

const root = document.querySelector<HTMLElement>('#benchmark')!;
root.className = 'nnb'; root.dataset.contrast = 'default';
const heading = document.createElement('h1'); heading.textContent = 'Pomiar grafiki P2';
const description = document.createElement('p');
description.textContent = '8871 rzeczywistych rekordów Hipparcos w pozycjach dla Warszawy, 03.10.2026 18:00 UTC. Pomiar trwa 5 sekund i dotyczy tej przeglądarki, urządzenia oraz rozmiaru okna. Emulacja nie zastępuje testu słabego urządzenia.';
const viewport = document.createElement('div'); viewport.className = 'nnb-sky-viewport';
const start = document.createElement('button'); start.textContent = 'Zmierz 5 sekund'; start.type = 'button';
const mode = document.createElement('button'); mode.textContent = 'Przełącz na Canvas'; mode.type = 'button';
const output = document.createElement('pre'); output.style.whiteSpace = 'pre-wrap'; output.setAttribute('role', 'status');
root.append(heading, description, viewport, start, mode, output);
const directions = calculateStarDirections('2026-10-03T18:00:00.000Z', { latitudeDeg: 52.2297, longitudeDeg: 21.0122, heightM: 100 }, false);
const points = new Float32Array(directions.length * 3);
directions.forEach((star, index) => points.set(skyDirection(star.azimuthDeg, star.altitudeDeg), index * 3));
let renderer = createSkyRenderer(viewport, fallback, points);
let raf = 0;
let running = false;
let cameraAzimuth = 0;
function draw() {
  renderer.render({ camera: { azimuthDeg: cameraAzimuth, altitudeDeg: 20, fovDeg: 100 }, positions: [], selected: 'Moon' }, viewport.clientWidth, viewport.clientHeight);
}
function fallback() { renderer.dispose(); renderer = createCanvasRenderer(viewport, points); draw(); }
function useCanvas() { if (!running) fallback(); }
mode.addEventListener('click', useCanvas);
function measure() {
  if (running) return;
  running = true; start.disabled = true; mode.disabled = true;
  const intervals: number[] = []; const renderTimes: number[] = [];
  let first: number | undefined; let previous: number | undefined;
  const initialMode = renderer.mode;
  let hidden = document.hidden;
  function frame(time: number) {
    hidden ||= document.hidden;
    first ??= time;
    if (previous !== undefined) intervals.push(time - previous);
    previous = time;
    const begin = performance.now(); cameraAzimuth += 0.25; draw(); renderTimes.push(performance.now() - begin);
    if (time - first < 5000) { raf = requestAnimationFrame(frame); return; }
    const sorted = (values: number[]) => [...values].sort((a, b) => a - b);
    const percentile = (values: number[], p: number) => sorted(values)[Math.min(values.length - 1, Math.floor(values.length * p))];
    const report = {
      renderer: renderer.mode, catalogPoints: directions.length,
      validRun: !hidden && initialMode === renderer.mode,
      viewport: [viewport.clientWidth, viewport.clientHeight], pixelRatio: Math.min(devicePixelRatio, 2),
      frames: intervals.length, measuredSeconds: (time - first) / 1000,
      meanFps: intervals.length / ((time - first) / 1000),
      frameIntervalP50Ms: percentile(intervals, 0.5), frameIntervalP95Ms: percentile(intervals, 0.95),
      cpuRenderP50Ms: percentile(renderTimes, 0.5), cpuRenderP95Ms: percentile(renderTimes, 0.95),
      memory: 'Pomiar pamięci GPU wymaga osobnego profilera.', userAgent: navigator.userAgent,
    };
    output.textContent = JSON.stringify(report, null, 2);
    root.dataset.result = JSON.stringify(report);
    running = false; start.disabled = false; mode.disabled = false;
  }
  output.textContent = 'Trwa pomiar…'; raf = requestAnimationFrame(frame);
}
start.addEventListener('click', measure);
const resize = new ResizeObserver(draw); resize.observe(viewport); draw();
if (import.meta.hot) import.meta.hot.dispose(() => {
  cancelAnimationFrame(raf); resize.disconnect(); start.removeEventListener('click', measure);
  mode.removeEventListener('click', useCanvas); renderer.dispose();
});
