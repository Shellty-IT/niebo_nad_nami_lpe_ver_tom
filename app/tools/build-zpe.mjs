import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { rollup } from 'rollup';
import { transformAsync } from '@babel/core';
import { minify } from 'terser';
import postcss from 'postcss';
import configs from '../rollup.zpe.config.mjs';

await mkdir('dist/zpe-engine', { recursive: true });
for (const config of configs) {
  const bundle = await rollup(config);
  try {
    const { output } = await bundle.generate(config.output);
    for (const chunk of output) {
      if (chunk.type !== 'chunk') throw new Error('Nieoczekiwany zasób w wyniku JS.');
      const transformed = await transformAsync(chunk.code, { configFile: './babel.zpe.config.cjs' });
      // Babel może umieścić helpery przed define(); zamknięcie izoluje je od window.
      const result = await minify(`(function () {\n${transformed.code}\n}());`, {
        ecma: 5, format: { ascii_only: false },
      });
      await writeFile(`dist/zpe-engine/${chunk.fileName}`, result.code + '\n');
    }
  } finally {
    await bundle.close();
  }
}
const rawCss = await readFile('src/styles/probe.css', 'utf8');
const rootSelector = '.nnb'.repeat(8);
const resetSelector = '.nnb'.repeat(5);
const css = await postcss([{
  postcssPlugin: 'nnb-lpe-isolation',
  Once(root) {
    root.walkRules((rule) => {
      if (rule.parent?.type === 'atrule' && /keyframes$/i.test(rule.parent.name)) return;
      rule.selector = rule.selectors.map((original) => {
        let selector = original.trim();
        if (/^\.nnb-(?:shell|lesson-editor|teacher)(?![\w-])/.test(selector)) selector = `.nnb${selector}`;
        else if (!/^\.nnb(?![\w-])/.test(selector)) selector = `.nnb ${selector}`;
        return selector.replace(/\.nnb(?![\w-])/g, rootSelector);
      }).join(', ');
    });
  },
}]).process(rawCss, { from: undefined });
const isolationCss = [
  `${resetSelector}{position:relative;isolation:isolate;text-align:left;letter-spacing:normal;word-spacing:normal;text-transform:none;text-indent:0;text-shadow:none;font-style:normal;font-weight:400;font-variant:normal;font-stretch:normal;white-space:normal;word-break:normal;visibility:visible;direction:ltr;float:none;clear:none;min-height:0;height:auto;box-shadow:none;background-image:none}`,
  `${resetSelector} :not(svg,svg *){all:revert}`,
  `${resetSelector} :not(svg,svg *)::before,${resetSelector} :not(svg,svg *)::after,${resetSelector} :not(svg,svg *)::marker{all:revert}`,
].join('\n');
await writeFile('dist/zpe-engine/entry.css', `${isolationCss}\n${css.css}`);
await cp('public/media/p4', 'dist/zpe-engine/media/p4', { recursive: true });
await mkdir('dist/zpe-engine/media/onboarding', { recursive: true });
await cp('public/media/onboarding/nocne-niebo-nasa.jpg', 'dist/zpe-engine/media/onboarding/nocne-niebo-nasa.jpg');
const data = JSON.parse(await readFile('.generated/probe.json', 'utf8'));
await writeFile('dist/zpe-engine/engine.json', JSON.stringify({
  entry: 'entry.js', stateful: true, printable: true, validation: 'none', useWebGL: true,
  editor: { entry: 'editor.js', defaultData: data, demoData: data },
}, null, 2) + '\n');
console.log('Zbudowano próbkę silnika i edytora. Nazwa silnika i paczka instancji wymagają integratora.');
