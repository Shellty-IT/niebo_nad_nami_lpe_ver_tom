import { createServer } from 'vite';
import { chromium } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

const server = await createServer({ server: { host: '127.0.0.1', port: 5176, strictPort: true } });
let browser;
try {
  await server.listen();
  browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
  await page.goto('http://127.0.0.1:5176/benchmark.html');
  const results = [];
  for (const mode of ['webgl2', 'canvas']) {
    if (mode === 'canvas') await page.getByRole('button', { name: 'Przełącz na Canvas' }).click();
    await page.getByRole('button', { name: 'Zmierz 5 sekund' }).click();
    await page.waitForFunction(() => document.querySelector('#benchmark')?.getAttribute('data-result'), null, { timeout: 15_000 });
    const result = await page.locator('#benchmark').getAttribute('data-result');
    results.push(JSON.parse(result));
    await page.locator('#benchmark').evaluate((node) => node.removeAttribute('data-result'));
  }
  const report = { date: new Date().toISOString().slice(0, 10), environment: 'Windows x64, Chromium headless; nie zastępuje testu słabego urządzenia', results };
  await writeFile('docs/performance/p2-headless.json', JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(results.map(({ renderer, catalogPoints, meanFps, cpuRenderP95Ms, validRun }) =>
    ({ renderer, catalogPoints, meanFps, cpuRenderP95Ms, validRun }))));
} finally {
  await browser?.close();
  await server.close();
}
