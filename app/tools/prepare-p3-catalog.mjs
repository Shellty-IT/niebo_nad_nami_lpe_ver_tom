import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';

const objects = [
  ['ceres', '9d5e454c34e94113c0943159182c2527d9f1773eab2236d3bb2a3fc17b94ea0c'],
  ['67p', '62a4c38a8c176bbb945646ee11d96297bd9ce97fc467e376486460303529af94'],
];
const output = {};
for (const [id, expected] of objects) {
  const source = JSON.parse(await readFile(`tests/astronomy/fixtures/p3-${id}.json`, 'utf8'));
  const actual = createHash('sha256').update(source.result).digest('hex');
  if (actual !== expected || source.sha256 !== expected || source.signature.source !== 'NASA/JPL Horizons API') {
    throw new Error(`Niezgodny plik źródłowy Horizons: ${id}`);
  }
  if (!source.result.includes('Center body name: Earth (399)') || !source.result.includes('Reference frame : Ecliptic of J2000.0') && !source.result.includes('Reference frame : ICRF')) {
    throw new Error(`Nieznany układ wektorów Horizons: ${id}`);
  }
  const section = source.result.split('$$SOE')[1]?.split('$$EOE')[0];
  if (!section) throw new Error(`Brak efemeryd: ${id}`);
  const rows = section.trim().split(/\r?\n/).map((line) => {
    const columns = line.split(',').map((value) => value.trim());
    const numbers = columns.slice(2, 8).map(Number);
    if (numbers.length !== 6 || numbers.some((value) => !Number.isFinite(value))) throw new Error(`Błędny wektor: ${id}`);
    return numbers;
  });
  if (rows.length !== 2193) throw new Error(`Nieoczekiwana liczba próbek: ${id} (${rows.length})`);
  output[id] = { startUtc: '2024-01-01T00:00:00.000Z', stepDays: 1, endUtc: '2030-01-01T00:00:00.000Z', rows };
}
await writeFile('.generated/p3-small-bodies.json', JSON.stringify(output) + '\n');
const images = [
  ['m31', 'm31-galex.jpg', '114a91c3d75dff27dfba03c1e5b34db2bb4a95aec5ea12f9800d43bc17cecf50'],
  ['m42', 'm42-spitzer.jpg', 'c03db260836585d98d2421b17d91c1e0465d0a20db646be322144fac47458e3c'],
];
const imageUris = {};
for (const [id, name, expected] of images) {
  const bytes = await readFile(`public/media/p3/${name}`);
  if (createHash('sha256').update(bytes).digest('hex') !== expected) throw new Error(`Niezgodny obraz P3: ${name}`);
  imageUris[id] = `data:image/jpeg;base64,${bytes.toString('base64')}`;
}
await writeFile('.generated/p3-images.js', `export const p3Images = ${JSON.stringify(imageUris)};\n`);
await writeFile('.generated/p3-images.d.ts', 'export declare const p3Images: { m31: string; m42: string };\n');
