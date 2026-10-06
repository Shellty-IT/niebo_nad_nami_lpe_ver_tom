import { createHash } from 'node:crypto';
import { copyFile, readFile, readdir, writeFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';

const root = 'dist/local';
const manifestName = 'PACZKA_SHA256.json';

for (const name of ['server.mjs', 'URUCHOM.cmd', 'start.sh', 'INSTRUKCJA.txt']) {
  await copyFile(`packaging/${name}`, join(root, name));
}
const files = [];
async function collect(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) await collect(path);
    else if (entry.isFile() && entry.name !== manifestName) {
      const data = await readFile(path);
      files.push({
        path: relative(root, path).split(sep).join('/'),
        bytes: data.length,
        sha256: createHash('sha256').update(data).digest('hex'),
      });
    }
  }
}
await collect(root);
files.sort((a, b) => a.path.localeCompare(b.path, 'en'));
const { version } = JSON.parse(await readFile('package.json', 'utf8'));
await writeFile(join(root, manifestName), JSON.stringify({
  version,
  builtAtUtc: new Date().toISOString(),
  files,
}, null, 2) + '\n');
console.log('Paczka demonstracyjna w dist/local — gotowa do uruchomienia z Node 22.');
