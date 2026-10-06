// Offline test reference production; no Horizons requests occur in runtime or tests.
import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const sites = [
  ['warszawa', 52.2297, 21.0122, 100],
  ['rownik', 0, 0, 0],
  ['sydney', -33.8688, 151.2093, 58],
];
const planets = [['Mercury', '199'], ['Venus', '299'], ['Jupiter', '599'], ['Saturn', '699'], ['Uranus', '799'], ['Neptune', '899']];
const instants = ['1900-01-01T00:00:00.000Z', '2000-01-01T12:00:00.000Z', '2024-06-20T12:00:00.000Z',
  '2026-10-03T18:00:00.000Z', '2100-12-31T00:00:00.000Z'];
const julianDays = instants.map((instant) => Date.parse(instant) / 86400000 + 2440587.5);
const directory = 'tests/astronomy/fixtures';
await mkdir(`${directory}/horizons-planets`, { recursive: true });
const samples = []; const sources = [];
for (const [siteId, latitudeDeg, longitudeDeg, heightM] of sites) for (const [objectId, command] of planets) {
  const parameters = {
    format: 'json', COMMAND: `'${command}'`, OBJ_DATA: "'NO'", MAKE_EPHEM: "'YES'", EPHEM_TYPE: "'OBSERVER'",
    CENTER: "'coord@399'", COORD_TYPE: "'GEODETIC'", SITE_COORD: `'${longitudeDeg},${latitudeDeg},${heightM / 1000}'`,
    TLIST: `'${julianDays.join(',')}'`, TIME_TYPE: "'UT'", QUANTITIES: "'2,4,20'", ANG_FORMAT: "'DEG'",
    APPARENT: "'AIRLESS'", CSV_FORMAT: "'YES'", EXTRA_PREC: "'YES'", CAL_FORMAT: "'JD'", CAL_TYPE: "'GREGORIAN'",
  };
  const url = 'https://ssd.jpl.nasa.gov/api/horizons.api?' + new URLSearchParams(parameters);
  const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`Horizons HTTP ${response.status}: ${siteId}/${objectId}`);
  const json = await response.json();
  if (json.error || typeof json.result !== 'string') throw new Error(json.error || `Brak wyniku ${siteId}/${objectId}`);
  const raw = json.result;
  const block = raw.split('$$SOE')[1]?.split('$$EOE')[0];
  if (!block) throw new Error(`Brak tabeli ${siteId}/${objectId}`);
  const rows = block.trim().split('\n').map((line) => line.split(',').map((cell) => cell.trim()));
  if (rows.length !== instants.length) throw new Error(`Niepełna tabela ${siteId}/${objectId}`);
  const path = `horizons-planets/${siteId}-${objectId}.txt`;
  await writeFile(`${directory}/${path}`, raw);
  sources.push({ path, url, sha256: createHash('sha256').update(raw).digest('hex'), signature: json.signature });
  rows.forEach((row, index) => {
    if (Math.abs(Number(row[0]) - julianDays[index]) > 1e-7) throw new Error('Niezgodna data w tabeli');
    const numbers = row.slice(3, 8).map(Number);
    if (!numbers.every(Number.isFinite)) throw new Error(`Niepełny odczyt ${siteId}/${objectId}`);
    samples.push({ siteId, objectId, instantUtc: instants[index], observer: { latitudeDeg, longitudeDeg, heightM },
      raDeg: numbers[0], decDeg: numbers[1], azimuthDeg: numbers[2], altitudeDeg: numbers[3], distanceAu: numbers[4], source: path });
  });
  console.log(`${siteId}/${objectId}: ${rows.length}`);
}
await writeFile(`${directory}/planets.json`, JSON.stringify({ acquiredOn: '2026-10-04', provider: 'NASA/JPL Horizons',
  convention: 'Topocentric apparent equator/equinox of date; AIRLESS; UT; geodetic E longitude; height km in request, m in fixture.',
  angularToleranceArcmin: 5, sources, samples }, null, 2) + '\n');
console.log(`Zapisano ${samples.length} referencji dla sześciu planet.`);
