import type { SkyCamera } from '../../domain/camera';
export type { SkyCamera } from '../../domain/camera';
export type Vector3Tuple = readonly [number, number, number];
const radians = Math.PI / 180;
export function skyDirection(azimuthDeg: number, altitudeDeg: number): Vector3Tuple {
  const az = azimuthDeg * radians; const alt = altitudeDeg * radians;
  return [Math.cos(alt) * Math.sin(az), Math.sin(alt), -Math.cos(alt) * Math.cos(az)];
}
export function normalizeCamera(camera: SkyCamera): SkyCamera {
  if (![camera.azimuthDeg, camera.altitudeDeg, camera.fovDeg].every(Number.isFinite)) throw new Error('invalid-camera');
  return {
    azimuthDeg: ((camera.azimuthDeg % 360) + 360) % 360,
    altitudeDeg: Math.max(-89, Math.min(89, camera.altitudeDeg)),
    fovDeg: Math.max(15, Math.min(120, camera.fovDeg)),
  };
}
export function cameraBasis(camera: SkyCamera) {
  const az = camera.azimuthDeg * radians; const alt = camera.altitudeDeg * radians;
  return {
    forward: skyDirection(camera.azimuthDeg, camera.altitudeDeg),
    right: [Math.cos(az), 0, Math.sin(az)] as Vector3Tuple,
    up: [-Math.sin(az) * Math.sin(alt), Math.cos(alt), Math.cos(az) * Math.sin(alt)] as Vector3Tuple,
  };
}
export function projectDirection(direction: Vector3Tuple, camera: SkyCamera, width: number, height: number) {
  const basis = cameraBasis(camera);
  const dot = (a: Vector3Tuple, b: Vector3Tuple) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const depth = dot(direction, basis.forward);
  if (depth <= 0 || width <= 0 || height <= 0) return null;
  const factor = height / (2 * Math.tan(camera.fovDeg * radians / 2));
  const x = width / 2 + factor * dot(direction, basis.right) / depth;
  const y = height / 2 - factor * dot(direction, basis.up) / depth;
  if (x < 0 || x > width || y < 0 || y > height) return null;
  return { x, y };
}
