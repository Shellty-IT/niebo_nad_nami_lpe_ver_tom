// Niezależne chwile pośrodku dziennych próbek; tylko do testów, poza zwykłym buildem.
import { writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const dates = ['2025-06-15', '2027-02-12', '2029-09-23'];
const rows = [];
for (const [id, command] of [['Ceres', '1;'], ['67P', '90000703;']]) {
  for (const date of dates) {
    const params = new URLSearchParams({ format: 'json', COMMAND: `'${command}'`, EPHEM_TYPE: "'VECTORS'",
      CENTER: "'500@399'", START_TIME: `'${date} 00:00'`, STOP_TIME: `'${date} 01:00'`, STEP_SIZE: "'30 m'",
      VEC_TABLE: "'2'", VEC_CORR: "'LT+S'", REF_PLANE: "'FRAME'", REF_SYSTEM: "'ICRF'",
      OUT_UNITS: "'AU-D'", TIME_TYPE: "'UT'", CSV_FORMAT: "'YES'", OBJ_DATA: "'NO'" });
    const url = `https://ssd.jpl.nasa.gov/api/horizons.api?${params}`;
    const response = await fetch(url); if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    const lines = payload.result?.split('$$SOE')[1]?.split('$$EOE')[0]?.trim().split(/\r?\n/);
    if (payload.signature?.source !== 'NASA/JPL Horizons API' || lines?.length !== 3) throw new Error(`Błędny wynik ${id} ${date}`);
    const vector = lines[1].split(',').slice(2,5).map(Number);
    if (vector.some((value) => !Number.isFinite(value))) throw new Error(`Błędny wektor ${id} ${date}`);
    rows.push({ id, instantUtc: `${date}T00:30:00.000Z`, vector, source: url,
      sha256: createHash('sha256').update(payload.result).digest('hex') });
    console.log(id, date, vector);
  }
}
await writeFile('tests/astronomy/fixtures/p3-holdouts.json', JSON.stringify(rows, null, 2) + '\n');
