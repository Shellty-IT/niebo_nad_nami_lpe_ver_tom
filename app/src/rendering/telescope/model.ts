import { Group } from 'three/src/objects/Group.js';
import { Mesh } from 'three/src/objects/Mesh.js';
import { CylinderGeometry } from 'three/src/geometries/CylinderGeometry.js';
import { MeshStandardMaterial } from 'three/src/materials/MeshStandardMaterial.js';
import { Scene } from 'three/src/scenes/Scene.js';
import { PerspectiveCamera } from 'three/src/cameras/PerspectiveCamera.js';
import { WebGLRenderer } from 'three/src/renderers/WebGLRenderer.js';
import { AmbientLight } from 'three/src/lights/AmbientLight.js';
import { DirectionalLight } from 'three/src/lights/DirectionalLight.js';
import type { Instrument } from '../../astronomy/telescope';

export function mountInstrumentModel(container: HTMLElement, onContextLost: () => void) {
  const canvas = document.createElement('canvas'); canvas.setAttribute('aria-hidden', 'true');
  const context = canvas.getContext('webgl2', { antialias: true });
  if (!context) return null;
  let renderer: WebGLRenderer;
  try { renderer = new WebGLRenderer({ canvas, context, antialias: true }); }
  catch { return null; }
  const scene = new Scene();
  const camera = new PerspectiveCamera(35, 1, 0.1, 100); camera.position.set(2.8, 1.8, 5); camera.lookAt(0, 0, 0);
  scene.add(new AmbientLight(0xffffff, 1.5));
  const light = new DirectionalLight(0xffffff, 2); light.position.set(2, 4, 3); scene.add(light);
  const model = new Group(); scene.add(model);
  let angleDeg = 25;
  let current: Instrument = 'refractor';
  let contextLost = false;
  function clearModel() {
    for (const child of [...model.children]) {
      model.remove(child);
      if (child instanceof Mesh) { child.geometry.dispose();
        const material = child.material;
        if (Array.isArray(material)) material.forEach((item) => item.dispose()); else material.dispose(); }
    }
  }
  function part(radius: number, length: number, x: number, y: number, z: number, color: number) {
    const geometry = new CylinderGeometry(radius, radius, length, 24);
    const material = new MeshStandardMaterial({ color, metalness: 0.35, roughness: 0.5 });
    const mesh = new Mesh(geometry, material); mesh.rotation.z = Math.PI / 2;
    mesh.position.set(x, y, z); model.add(mesh);
  }
  function draw() {
    if (contextLost) return;
    model.rotation.y = angleDeg * Math.PI / 180;
    const width = Math.max(240, Math.min(500, container.clientWidth || 500));
    const height = 270; camera.aspect = width / height; camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); renderer.setSize(width, height);
    renderer.render(scene, camera);
  }
  function update(instrument: Instrument, rotationDeg = angleDeg) {
    angleDeg = rotationDeg; current = instrument; clearModel();
    if (current === 'binoculars') {
      for (const y of [-0.36, 0.36]) { part(0.23, 1.9, 0, y, 0, 0x285fa0); part(0.28, 0.08, -0.98, y, 0, 0x86caff); part(0.16, 0.18, 1.02, y, 0, 0xe2e6ee); }
    } else {
      part(0.32, 2.5, 0, 0, 0, current === 'refractor' ? 0x285fa0 : 0x51687c);
      part(0.36, 0.08, -1.28, 0, 0, current === 'refractor' ? 0x86caff : 0xffd166);
      part(0.18, 0.3, 1.36, 0, 0, 0xe2e6ee);
      if (current === 'reflector') part(0.16, 0.36, 0.3, 0.42, 0, 0xdce6f0);
    }
    draw();
  }
  container.append(canvas); update(current);
  const onLost = (event: Event) => { event.preventDefault(); contextLost = true; canvas.hidden = true; onContextLost(); };
  canvas.addEventListener('webglcontextlost', onLost);
  return { update, getAngle: () => angleDeg, destroy() { canvas.removeEventListener('webglcontextlost', onLost); clearModel(); renderer.dispose(); canvas.remove(); } };
}
