#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { parse } from '../app/node_modules/acorn/dist/acorn.mjs';
import postcss from '../app/node_modules/postcss/lib/postcss.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repo = join(root, 'build', 'repo');
const artifacts = join(root, 'build', 'artifacts');
const decoder = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true });

const engine = await json(join(repo, 'engine.json'));
if (engine.entry !== 'dist/entry.js' || engine.editor?.entry !== 'dist/editor.js') throw new Error('Niepoprawne punkty wejścia engine.json.');
if (!engine.stateful || !engine.printable || !engine.useWebGL || engine.validation !== 'none') throw new Error('Niepoprawne deklaracje możliwości silnika.');
for (const name of ['entry.js', 'editor.js', 'ephemeris.worker.js']) {
  const code = await text(join(repo, 'dist', name));
  parse(code, { ecmaVersion: 5, sourceType: 'script' });
  if (name !== 'ephemeris.worker.js' && !/define\s*\(/.test(code)) throw new Error(`${name}: brak modułu AMD.`);
}

const css = await text(join(repo, 'dist', 'entry.css'));
postcss.parse(css).walkRules((rule) => {
  if (rule.parent?.type === 'atrule' && /keyframes$/i.test(rule.parent.name)) return;
  for (const selector of rule.selectors) if (!selector.trim().startsWith('.nnb')) throw new Error(`CSS poza komponentem: ${selector}`);
});

await readFile(join(repo, 'dist', 'media', 'onboarding', 'nocne-niebo-nasa.jpg'));
const narrations = (await readdir(join(repo, 'dist', 'media', 'p4'))).filter((name) => name.endsWith('.mp3'));
if (narrations.length !== 24) throw new Error(`Oczekiwano 24 narracji, znaleziono ${narrations.length}.`);

const manifest = await json(join(root, 'build', 'instance', 'manifest.json'));
if (typeof manifest.engine !== 'string' || !manifest.engine.includes('/') || manifest.dependencies.length !== 0) throw new Error('Niepoprawny manifest instancji.');
const sums = await json(join(artifacts, 'SHA256SUMS.json'));
for (const [name, expected] of Object.entries(sums.files)) {
  const bytes = await readFile(join(artifacts, name));
  const actual = createHash('sha256').update(bytes).digest('hex');
  if (bytes.length !== expected.bytes || actual !== expected.sha256) throw new Error(`Niezgodna suma artefaktu: ${name}`);
}
console.log(`Weryfikacja LPE: OK (ES5, AMD, UTF-8 bez BOM, izolacja CSS, zasoby, manifest, SHA-256).`);

async function text(path) {
  const bytes = await readFile(path);
  const value = decoder.decode(bytes);
  if (value.charCodeAt(0) === 0xfeff) throw new Error(`${path}: wykryto BOM.`);
  return value;
}
async function json(path) { return JSON.parse(await text(path)); }
