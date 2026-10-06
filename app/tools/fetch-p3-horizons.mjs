// Jednorazowe pozyskanie danych źródłowych. Nie jest częścią runtime ani zwykłego builda.
import { writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const probe = process.argv.includes('--probe');
const targets = [
  { id: 'ceres', command: '1;' },
  { id: '67p', command: '90000703;' },
];
for (const target of targets) {
  const quote = (value) => `'${value}'`;
  const params = new URLSearchParams({
    format: 'json', COMMAND: quote(target.command), EPHEM_TYPE: quote('VECTORS'),
    CENTER: quote('500@399'), START_TIME: quote('2024-01-01'),
    STOP_TIME: quote(probe ? '2024-01-03' : '2030-01-01'), STEP_SIZE: quote('1 d'),
    VEC_TABLE: quote('2'), VEC_CORR: quote('LT+S'), REF_PLANE: quote('FRAME'),
    REF_SYSTEM: quote('ICRF'), OUT_UNITS: quote('AU-D'), TIME_TYPE: quote('UT'),
    CSV_FORMAT: quote('YES'), OBJ_DATA: quote('YES'),
  });
  const url = `https://ssd.jpl.nasa.gov/api/horizons.api?${params}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Horizons HTTP ${response.status}: ${target.id}`);
  const payload = await response.json();
  if (payload.signature?.source !== 'NASA/JPL Horizons API' || typeof payload.result !== 'string' ||
      !payload.result.includes('$$SOE') || !payload.result.includes('$$EOE')) {
    throw new Error(`Niepoprawna odpowiedź Horizons: ${target.id}: ${payload.result?.slice(0, probe ? 6000 : 500)}`);
  }
  const sha256 = createHash('sha256').update(payload.result).digest('hex');
  console.log(target.id, payload.signature.version, payload.result.length, sha256, url);
  console.log(payload.result.slice(payload.result.indexOf('$$SOE'), payload.result.indexOf('$$SOE') + 450));
  if (!probe) {
    const record = { source: url, signature: payload.signature, sha256, result: payload.result };
    await writeFile(`tests/astronomy/fixtures/p3-${target.id}.json`, JSON.stringify(record) + '\n');
  }
}
