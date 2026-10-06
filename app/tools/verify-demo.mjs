import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';

const root = 'dist/local';
const manifestName = 'PACZKA_SHA256.json';
const manifest = JSON.parse(await readFile(join(root, manifestName), 'utf8'));
const listed = new Map(manifest.files.map(file => [file.path, file]));
if (listed.size !== manifest.files.length) throw new Error('Powtórzone ścieżki w manifeście.');

let count = 0;
async function verify(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) await verify(path);
    else if (entry.isFile() && entry.name !== manifestName) {
      const name = relative(root, path).split(sep).join('/');
      const expected = listed.get(name);
      if (!expected) throw new Error(`Plik spoza manifestu: ${name}`);
      const data = await readFile(path);
      const hash = createHash('sha256').update(data).digest('hex');
      if (expected.bytes !== data.length || expected.sha256 !== hash) {
        throw new Error(`Niezgodna suma lub rozmiar: ${name}`);
      }
      count++;
    }
  }
}
await verify(root);
if (count !== listed.size) throw new Error('Manifest wskazuje brakujące pliki.');
console.log(`Manifest paczki zgodny: ${count} plików.`);
