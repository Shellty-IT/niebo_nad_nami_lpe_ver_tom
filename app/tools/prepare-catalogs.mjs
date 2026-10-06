import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const root = '../01-wsad/katalogi/';
const abbreviations = ['UMa', 'Cas', 'Ori', 'Cru', 'Cen'];
const names = { UMa: 'Wielka Niedźwiedzica', Cas: 'Kasjopeja', Ori: 'Orion', Cru: 'Krzyż Południa', Cen: 'Centaur' };
const sourceHashes = {
  'hipparcos-bright.csv': '86247c969dcecf5242d374f78afc8e6a5398b3ce9f5eef0ac1398ea6b4217826',
  'stellarium-western-index.json': 'a861accd345249a185a5ecfc2a516f34291c0aa52f4bb8d8337ffc53e9cef6b9',
  'iau-cas.txt': 'ea05d876791fdd92a237d2e79c7688e2227080c381e767afaac6294e5b9b9693',
  'iau-cen.txt': '90c7c416f86d8d0fa7c98c4276d41418e70b0f6ba92b22a425903530571fcb41',
  'iau-cru.txt': '125b4855f89aa53ea12e31b72f025951452cd5a262d44daf52e42f2359bf3782',
  'iau-ori.txt': '8454cd1d863b71902e7fd28a985096c15b970c50e37a905256e3841a1521a35a',
  'iau-uma.txt': '681a1db59fa563a15de88269bb000d6732b959652138b043128385a0d555aa10',
};
async function checkedSource(filename) {
  const contents = await readFile(`${root}${filename}`, 'utf8');
  if (createHash('sha256').update(contents).digest('hex') !== sourceHashes[filename]) throw new Error(`Zmieniony plik źródłowy: ${filename}`);
  return contents;
}
const csv = await checkedSource('hipparcos-bright.csv');
const westernRaw = await checkedSource('stellarium-western-index.json');
const western = JSON.parse(westernRaw);
if (western.constellations.length !== 88 || western.edges_epoch !== 'B1875') throw new Error('Nieoczekiwana wersja figur Stellarium.');
const lines = csv.trim().split(/\r?\n/);
if (lines.shift() !== 'HIP,Vmag,RAdeg,DEdeg,pmRA,pmDE,Plx,BTmag,VTmag') throw new Error('Nieznany format katalogu Hipparcos.');
let skippedWithoutCoordinates = 0;
const stars = lines.map((line) => {
  const [id, magnitude, ra, dec, pmRa, pmDec, parallax, bt, vt] = line.split(',');
  const number = (value) => value === '' ? null : Number(value);
  const star = { id: Number(id), magnitude: number(magnitude), raDeg: number(ra), decDeg: number(dec),
    pmRaCosDecMasYr: number(pmRa), pmDecMasYr: number(pmDec), parallaxMas: number(parallax),
    btMag: number(bt), vtMag: number(vt) };
  if (star.raDeg === null || star.decDeg === null) { skippedWithoutCoordinates++; return null; }
  if (!Number.isInteger(star.id) || !Number.isFinite(star.magnitude) || !Number.isFinite(star.raDeg) ||
      star.raDeg < 0 || star.raDeg >= 360 || !Number.isFinite(star.decDeg) || Math.abs(star.decDeg) > 90 ||
      star.magnitude > 6.5 && star.id !== 87937) throw new Error(`Niepoprawna gwiazda ${id}`);
  return star;
}).filter((star) => star !== null).sort((a, b) => a.id - b.id);
if (stars.length < 6000 || stars.length > 10000 || new Set(stars.map((star) => star.id)).size !== stars.length) {
  throw new Error('Niepoprawny rozmiar lub identyfikatory katalogu gwiazd.');
}
const ids = new Set(stars.map((star) => star.id));
const constellations = [];
for (const abbreviation of abbreviations) {
  const source = western.constellations.find((item) => item.iau === abbreviation);
  if (!source) throw new Error(`Brak figury ${abbreviation}.`);
  const figure = source.lines.map((path) => path.filter((id) => typeof id === 'number'));
  const missing = [...new Set(figure.flat().filter((id) => !ids.has(id)))];
  const raw = await checkedSource(`iau-${abbreviation.toLowerCase()}.txt`);
  const boundary = raw.trim().split(/\r?\n/).map((line) => {
    const [ra, dec, code] = line.split('|');
    if (code?.trim().toUpperCase() !== abbreviation.toUpperCase()) throw new Error(`Niepoprawna granica ${abbreviation}.`);
    const [hours, minutes, seconds] = ra.trim().split(/\s+/).map(Number);
    return [15 * (hours + minutes / 60 + seconds / 3600), Number(dec)];
  });
  if (boundary.length < 4 || boundary.some(([ra, dec]) => !Number.isFinite(ra) || !Number.isFinite(dec))) throw new Error(`Brak granicy ${abbreviation}.`);
  constellations.push({ id: abbreviation, name: names[abbreviation], latinName: source.common_name.native,
    figure, boundary, missingStarIds: missing });
}
const regions = Array.from({ length: 24 }, (_, hour) => ({ raHour: hour, starIds: stars.filter((star) => Math.floor(star.raDeg / 15) === hour).map((star) => star.id) }));
const catalog = { schemaVersion: 1, epoch: 'J1991.25', frame: 'ICRS', pmRaConvention: 'mu_alpha_cos_delta',
  magnitudeSystem: 'Johnson V', sourceHashes: {
    ...sourceHashes,
  }, stars, regions, constellations,
  allConstellations: western.constellations.map((item) => ({ id: item.iau, latinName: item.common_name.native })) };
await mkdir('.generated', { recursive: true });
await writeFile('.generated/catalogs.json', JSON.stringify(catalog));
console.log(`Katalog: ${stars.length} gwiazd, ${skippedWithoutCoordinates} bez współrzędnych pominiętych, 88 nazw IAU, 5 figur i granic. Brakujące gwiazdy figur: ${constellations.map((item) => item.missingStarIds.length).reduce((a, b) => a + b, 0)}.`);
