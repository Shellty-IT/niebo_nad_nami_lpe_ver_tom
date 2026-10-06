// Jednorazowy import ilustracji NASA/JPL. Zwykły build korzysta wyłącznie z plików lokalnych.
import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const images = [
  ['m42-spitzer.jpg', 'https://assets.science.nasa.gov/dynamicimage/assets/science/psd/photojournal/pia/pia13/pia13005/PIA13005.jpg?crop=faces%2Cfocalpoint&fit=clip&h=5085&w=2171'],
  ['m31-galex.jpg', 'https://assets.science.nasa.gov/dynamicimage/assets/science/psd/photojournal/pia/pia04/pia04921/PIA04921.jpg?crop=faces%2Cfocalpoint&fit=clip&h=6200&w=6200'],
];
await mkdir('public/media/p3', { recursive: true });
for (const [name, url] of images) {
  const response = await fetch(url);
  if (!response.ok || !response.headers.get('content-type')?.includes('image/jpeg')) throw new Error(`Nie udało się pobrać ${name}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 10_000 || bytes[0] !== 0xff || bytes[1] !== 0xd8) throw new Error(`Niepoprawny JPEG: ${name}`);
  await writeFile(`public/media/p3/${name}`, bytes);
  console.log(name, bytes.length, createHash('sha256').update(bytes).digest('hex'));
}
