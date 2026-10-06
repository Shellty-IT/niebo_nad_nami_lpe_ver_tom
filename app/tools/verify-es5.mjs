import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parse } from 'acorn';

let count = 0;
async function inspect(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) { await inspect(path); continue; }
    if (!/\.(js|json|css|html|txt)$/.test(path)) continue;
    const bytes = await readFile(path);
    const code = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes);
    if (code.charCodeAt(0) === 0xfeff) throw new Error(`${path}: wykryto BOM`);
    if (path.endsWith('.js')) {
      parse(code, { ecmaVersion: 5, sourceType: 'script' });
      count++;
    }
  }
}
await inspect('dist/zpe-engine');
if (count < 2) throw new Error('Brak punktu wejścia silnika lub edytora.');
console.log(`ES5 i UTF-8 bez BOM: OK (${count} pliki JS). Nie jest to test API przeglądarki ani odbiór ZPE.`);
