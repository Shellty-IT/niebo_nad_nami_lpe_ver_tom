#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { deflateRawSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = join(root, 'app', 'dist', 'zpe-engine');
const build = join(root, 'build');
const engineRepo = join(build, 'repo');
const instance = join(build, 'instance');
const artifacts = join(build, 'artifacts');
const deployment = JSON.parse(await readFile(join(root, 'lpe', 'config.json'), 'utf8'));
const engineName = process.env.LPE_ENGINE || deployment.engine;
if (typeof engineName !== 'string' || !/^[^/]+\/[A-Za-z0-9._-]+$/.test(engineName)) {
  throw new Error('lpe/config.json: engine musi mieć postać przestrzeń/kod_silnika.');
}

const npmCli = process.env.npm_execpath || join(dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js');
const result = spawnSync(process.execPath, [npmCli, 'run', 'build:zpe'], {
  cwd: join(root, 'app'), stdio: 'inherit', shell: false,
});
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);

await rm(build, { recursive: true, force: true });
await mkdir(join(engineRepo, 'dist'), { recursive: true });
await mkdir(instance, { recursive: true });
await mkdir(artifacts, { recursive: true });

for (const name of ['entry.js', 'editor.js', 'ephemeris.worker.js', 'entry.css']) {
  await cp(join(source, name), join(engineRepo, 'dist', name));
}
await cp(join(source, 'media'), join(engineRepo, 'dist', 'media'), { recursive: true });
await cp(join(source, 'licenses'), join(engineRepo, 'dist', 'licenses'), { recursive: true });

const engine = JSON.parse(await readFile(join(source, 'engine.json'), 'utf8'));
engine.entry = 'dist/entry.js';
engine.editor.entry = 'dist/editor.js';
await writeFile(join(engineRepo, 'engine.json'), `${JSON.stringify(engine, null, 2)}\n`, 'utf8');

const engineReadme = `# Niebo nad nami - silnik LPE\n\n` +
  `Silnik komponentu interaktywnego \`${engineName}\`. Pliki w tym katalogu są wynikiem ` +
  `polecenia \`npm run build\` z repozytorium źródłowego.\n\n` +
  `Punkty wejścia są modułami AMD zgodnymi składniowo z ECMAScript 5. ` +
  `Komponent implementuje cykl życia LPE, zapis i zamrożenie stanu, edytor instancji, ` +
  `tryby kontrastu, wydruk oraz lokalne zasoby WebGL/Canvas.\n`;
await writeFile(join(engineRepo, 'README.md'), engineReadme, 'utf8');

const manifest = { engine: engineName, dependencies: [], data: engine.editor.defaultData };
await writeFile(join(instance, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

const engineZip = join(artifacts, 'niebo-nad-nami-silnik-lpe.zip');
const instanceZip = join(artifacts, 'niebo-nad-nami-instancja-lpe.zip');
await createZip(engineRepo, engineZip);
await createZip(instance, instanceZip);

const checksums = {};
for (const path of [engineZip, instanceZip]) {
  const bytes = await readFile(path);
  checksums[relative(artifacts, path).split(sep).join('/')] = {
    bytes: bytes.length,
    sha256: createHash('sha256').update(bytes).digest('hex'),
  };
}
await writeFile(join(artifacts, 'SHA256SUMS.json'), `${JSON.stringify({ engine: engineName, files: checksums }, null, 2)}\n`, 'utf8');
console.log(`Gotowe: ${relative(root, engineRepo)}, ${relative(root, instanceZip)} (${engineName})`);

async function filesIn(directory) {
  const output = [];
  async function visit(current) {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const path = join(current, entry.name);
      if (entry.isDirectory()) await visit(path);
      else output.push(path);
    }
  }
  await visit(directory);
  return output.sort();
}

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function dosDateTime(date) {
  const year = Math.max(1980, date.getFullYear());
  return {
    time: (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2),
    date: ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate(),
  };
}

async function createZip(directory, destination) {
  const locals = [];
  const centrals = [];
  let offset = 0;
  for (const path of await filesIn(directory)) {
    const name = Buffer.from(relative(directory, path).split(sep).join('/'), 'utf8');
    const raw = await readFile(path);
    const compressed = deflateRawSync(raw, { level: 9 });
    const crc = crc32(raw);
    const stamp = dosDateTime((await stat(path)).mtime);
    const local = Buffer.alloc(30 + name.length);
    local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(20, 4); local.writeUInt16LE(0x800, 6);
    local.writeUInt16LE(8, 8); local.writeUInt16LE(stamp.time, 10); local.writeUInt16LE(stamp.date, 12);
    local.writeUInt32LE(crc, 14); local.writeUInt32LE(compressed.length, 18); local.writeUInt32LE(raw.length, 22);
    local.writeUInt16LE(name.length, 26); name.copy(local, 30);
    locals.push(local, compressed);
    const central = Buffer.alloc(46 + name.length);
    central.writeUInt32LE(0x02014b50, 0); central.writeUInt16LE(20, 4); central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x800, 8); central.writeUInt16LE(8, 10); central.writeUInt16LE(stamp.time, 12);
    central.writeUInt16LE(stamp.date, 14); central.writeUInt32LE(crc, 16); central.writeUInt32LE(compressed.length, 20);
    central.writeUInt32LE(raw.length, 24); central.writeUInt16LE(name.length, 28); central.writeUInt32LE(offset, 42);
    name.copy(central, 46); centrals.push(central);
    offset += local.length + compressed.length;
  }
  const centralSize = centrals.reduce((sum, part) => sum + part.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(centrals.length, 8); end.writeUInt16LE(centrals.length, 10);
  end.writeUInt32LE(centralSize, 12); end.writeUInt32LE(offset, 16);
  await writeFile(destination, Buffer.concat([...locals, ...centrals, end]));
}
