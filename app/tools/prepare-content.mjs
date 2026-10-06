import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import Ajv from 'ajv';
import standaloneCode from 'ajv/dist/standalone/index.js';
await import('./prepare-catalogs.mjs');
await import('./prepare-p3-catalog.mjs');

const schema = JSON.parse(await readFile('schemas/probe.schema.json', 'utf8'));
const config = JSON.parse(await readFile('../02-scenariusz/prototyp-g0.json', 'utf8'));
const scenes = JSON.parse(await readFile('../02-scenariusz/sceny-p1.json', 'utf8'));
const questions = JSON.parse(await readFile('../02-scenariusz/pytania-p4.json', 'utf8'));
const glossary = JSON.parse(await readFile('../02-scenariusz/slownik-p4.json', 'utf8'));
const resources = JSON.parse(await readFile('../02-scenariusz/zasoby-p4.json', 'utf8'));
const levelTexts = JSON.parse(await readFile('../02-scenariusz/teksty-poziomow-p4.json', 'utf8'));
const sampleAudio = JSON.parse(await readFile('../02-scenariusz/narracje-probne-p4.json', 'utf8'));
const ajv = new Ajv({ allErrors: true, code: { source: true, esm: true, es5: true } });
ajv.addSchema(schema);
ajv.addSchema(JSON.parse(await readFile('schemas/probe-v1.schema.json', 'utf8')));
ajv.addSchema(JSON.parse(await readFile('schemas/probe-v2.schema.json', 'utf8')));
ajv.addSchema(JSON.parse(await readFile('schemas/probe-v3.schema.json', 'utf8')));
ajv.addSchema(JSON.parse(await readFile('schemas/probe-v4.schema.json', 'utf8')));
ajv.addSchema(JSON.parse(await readFile('schemas/probe-v5.schema.json', 'utf8')));
ajv.addSchema(JSON.parse(await readFile('schemas/probe-v6.schema.json', 'utf8')));
ajv.addSchema(JSON.parse(await readFile('schemas/probe-v7.schema.json', 'utf8')));
ajv.addSchema(JSON.parse(await readFile('schemas/scenes.schema.json', 'utf8')));
ajv.addSchema(JSON.parse(await readFile('schemas/scene-content.schema.json', 'utf8')));
ajv.addSchema(JSON.parse(await readFile('schemas/questions.schema.json', 'utf8')));
ajv.addSchema(JSON.parse(await readFile('schemas/glossary.schema.json', 'utf8')));
ajv.addSchema(JSON.parse(await readFile('schemas/resources.schema.json', 'utf8')));
if (!ajv.getSchema('nnb-scene-content-v1')) throw new Error('Brak schematu treści sceny.');
if (!ajv.validate('nnb-probe#/definitions/config', config)) {
  throw new Error(ajv.errorsText());
}
const instant = new Date(config.initialObservation.instantUtc);
if (!Number.isFinite(instant.getTime()) || instant.toISOString() !== config.initialObservation.instantUtc) {
  throw new Error('Niepoprawna chwila UTC w konfiguracji.');
}
new Intl.DateTimeFormat('pl-PL', { timeZone: config.initialObservation.timeZone });
if (!ajv.validate('nnb-scenes-v1', scenes)) throw new Error(ajv.errorsText());
if (scenes.scenes.some((scene, index) => scene.id !== `E${index + 1}`)) throw new Error('Niepoprawna kolejność scen.');
if (!ajv.validate('nnb-questions-v1', questions)) throw new Error(ajv.errorsText());
if (new Set(questions.questions.map((question) => question.id)).size !== questions.questions.length ||
    questions.questions.some((question) => question.correctIndex >= question.choices.length) ||
    ['E1','E2','E3','E4','E5','E6'].some((sceneId) => !questions.questions.some((question) => question.sceneId === sceneId && question.level === 'basic'))) {
  throw new Error('Bank pytań ma zduplikowane ID, błędny klucz lub nie pokrywa scen.');
}
if (!ajv.validate('nnb-glossary-v1', glossary) ||
    new Set(glossary.terms.map((term) => term.id)).size !== glossary.terms.length) {
  throw new Error(`Słownik jest niepoprawny: ${ajv.errorsText()}`);
}
if (!ajv.validate('nnb-resources-v1', resources) ||
    new Set(resources.resources.map((resource) => resource.id)).size !== resources.resources.length ||
    resources.resources.some((resource) => (resource.offline && resource.url !== null) ||
      (!resource.offline && (typeof resource.url !== 'string' || !resource.url.startsWith('https://'))))) {
  throw new Error(`Zasoby E8 są niepoprawne: ${ajv.errorsText()}`);
}
if (levelTexts.schemaVersion !== 1 || levelTexts.sampleContent !== true ||
    !Array.isArray(levelTexts.scenes) || levelTexts.scenes.length !== 8 ||
    levelTexts.scenes.some((scene, index) => scene.id !== `E${index + 1}` ||
      ['basic', 'extended', 'expert'].some((level) => typeof scene[level] !== 'string' || scene[level].trim().length < 100))) {
  throw new Error('Teksty trzech poziomów E1–E8 są niekompletne.');
}
if (sampleAudio.schemaVersion !== 1 || !Array.isArray(sampleAudio.files) || sampleAudio.files.length !== 24 ||
    new Set(sampleAudio.files.map((item) => item.file)).size !== 24) {
  throw new Error('Rejestr przykładowych narracji jest niekompletny.');
}
for (const scene of levelTexts.scenes) {
  for (const level of ['basic', 'extended', 'expert']) {
    const suffix = level === 'basic' ? '' : `-${level}`;
    const filename = `${scene.id.toLowerCase()}${suffix}-narracja.mp3`;
    const path = `public/media/p4/${filename}`;
    const media = await stat(path);
    const registered = sampleAudio.files.find((item) => item.file === filename);
    if (media.size < 1000 || registered?.bytes !== media.size ||
        registered.sha256 !== createHash('sha256').update(await readFile(path)).digest('hex')) {
      throw new Error(`Brak narracji lub niezgodna suma: ${scene.id}/${level}.`);
    }
  }
}
await mkdir('.generated', { recursive: true });
await writeFile('.generated/probe.json', JSON.stringify(config, null, 2) + '\n');
await writeFile('.generated/scenes.json', JSON.stringify(scenes, null, 2) + '\n');
await writeFile('.generated/questions.json', JSON.stringify(questions, null, 2) + '\n');
await writeFile('.generated/glossary.json', JSON.stringify(glossary, null, 2) + '\n');
await writeFile('.generated/resources.json', JSON.stringify(resources, null, 2) + '\n');
await writeFile('.generated/level-texts.json', JSON.stringify(levelTexts, null, 2) + '\n');
const validators = standaloneCode(ajv, {
  validateConfig: 'nnb-probe#/definitions/config',
  validateState: 'nnb-probe#/definitions/state',
  validateObservation: 'nnb-probe#/definitions/observation',
  validateLegacyState: 'nnb-probe-v1#/definitions/state',
  validateV2State: 'nnb-probe-v2#/definitions/state',
  validateV3State: 'nnb-probe-v3#/definitions/state',
  validateV4State: 'nnb-probe-v4#/definitions/state',
  validateV5State: 'nnb-probe-v5#/definitions/state',
  validateV6State: 'nnb-probe-v6#/definitions/state',
  validateV6Config: 'nnb-probe-v6#/definitions/config',
  validateV7State: 'nnb-probe-v7#/definitions/state',
  validateV7Config: 'nnb-probe-v7#/definitions/config',
  validateLegacyConfig: 'nnb-probe-v1#/definitions/config',
});
if (/\brequire\s*\(/.test(validators)) {
  throw new Error('Walidator wymaga helpera CommonJS; dołącz go jawnie przed wydaniem.');
}
await writeFile('.generated/validators.js', validators);
await writeFile('.generated/validators.d.ts',
  'export declare function validateConfig(value: unknown): boolean;\n' +
  'export declare function validateObservation(value: unknown): boolean;\n' +
  'export declare function validateLegacyState(value: unknown): boolean;\n' +
  'export declare function validateV2State(value: unknown): boolean;\n' +
  'export declare function validateV3State(value: unknown): boolean;\n' +
  'export declare function validateV4State(value: unknown): boolean;\n' +
  'export declare function validateV5State(value: unknown): boolean;\n' +
  'export declare function validateV6State(value: unknown): boolean;\n' +
  'export declare function validateV6Config(value: unknown): boolean;\n' +
  'export declare function validateV7State(value: unknown): boolean;\n' +
  'export declare function validateV7Config(value: unknown): boolean;\n' +
  'export declare function validateLegacyConfig(value: unknown): boolean;\n' +
  'export declare function validateState(value: unknown): boolean;\n');
console.log('Konfiguracja i katalogi poprawne; przygotowano dane i walidatory bez eval w runtime.');
