import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';
import type {} from '../zpe-host/harness';
import type { ProbeConfig } from '../../src/domain/probe';

async function configuredLesson(): Promise<ProbeConfig> {
  const config = JSON.parse(await readFile('../02-scenariusz/prototyp-g0.json', 'utf8')) as ProbeConfig;
  config.initialObservation.instantUtc = '2025-01-16T20:00:00.000Z';
  config.initialObservation.objectId = 'Moon';
  config.lesson = {
    sceneOrder: ['E2', 'E7', 'E8'], levels: ['basic'], defaultLevel: 'basic',
    visibleObjects: ['Moon', 'Mars'], layers: { stars: true, figure: true, boundary: true, name: true },
    dateFromUtc: '2025-01-01T00:00:00.000Z', dateToUtc: '2025-12-31T23:59:59.999Z',
    questions: [{ id: 'TQ01', sceneId: 'E7', level: 'basic', stem: 'Która planeta jest czerwona?',
      choices: ['Mars', 'Wenus', 'Merkury'], correctIndex: 0, hint: 'Spójrz na kolor.', explanation: 'Mars ma rdzawy odcień.' }],
    tasks: [{ id: 'TZ01', sceneId: 'E2', kind: 'object', title: 'Znajdź Marsa',
      instruction: 'Wybierz Marsa z listy.', hint: 'To planeta nad horyzontem.',
      targetObjectId: 'Mars', azimuthDeg: null, altitudeDeg: null, toleranceDeg: null }],
  };
  return config;
}

async function openLocal(page: Page, url = '/dist/local/', level: 'basic' | 'extended' = 'basic') {
  await page.goto(url);
  if (level !== 'basic') await page.getByLabel('Poziom materiału').selectOption(level);
  await page.getByRole('button', { name: 'Pomiń wprowadzenie', exact: true }).click();
  await page.getByRole('button', { name: 'E2 · Sfera niebieska' }).click();
  await page.getByRole('combobox', { name: 'Obiekt', exact: true }).waitFor({ timeout: 20_000 });
}

test('P4: wszystkie sceny mają trzy teksty i lokalną narrację', async ({ page }) => {
  await page.goto('/dist/local/');
  await page.getByRole('button', { name: 'Pomiń wprowadzenie', exact: true }).click();
  for (let index = 1; index <= 8; index++) {
    const sceneId = `E${index}`;
    await page.getByRole('button', { name: new RegExp(`^${sceneId} ·`) }).click();
    const intro = page.locator('.nnb-level-intro');
    await expect(intro.locator('.nnb-transcript')).not.toBeEmpty();
    await expect(intro.locator('audio')).toHaveAttribute('src', new RegExp(`media/p4/e${index}-narracja\\.mp3$`));
    await page.getByLabel('Poziom materiału').selectOption('extended');
    await expect(intro.locator('audio')).toHaveAttribute('src', new RegExp(`media/p4/e${index}-extended-narracja\\.mp3$`));
    await page.getByLabel('Poziom materiału').selectOption('expert');
    await expect(intro.locator('audio')).toHaveAttribute('src', new RegExp(`media/p4/e${index}-expert-narracja\\.mp3$`));
    const audioUrl = await intro.locator('audio').getAttribute('src');
    const response = await page.request.get(audioUrl!);
    expect(response.ok()).toBeTruthy();
    expect(response.headers()['content-type']).toContain('audio/mpeg');
    await page.getByLabel('Poziom materiału').selectOption('basic');
  }
});

test('P4: trwały zapis i raport E7 po otwarciu nowej karty', async ({ page, context }) => {
  await page.goto('/dist/local/');
  await page.getByLabel('Zachowaj sesję po zamknięciu przeglądarki').click();
  await expect(page.getByText('Włączono trwały zapis')).toBeVisible();
  await page.getByRole('button', { name: 'Pomiń wprowadzenie', exact: true }).click();
  await page.getByRole('button', { name: 'E7 · Podsumowanie' }).click();
  await expect(page.getByRole('table', { name: 'Zapisane wyniki sesji' })).toBeVisible();
  await expect(page.getByText('Z02: nieukończone, 0 prób')).toBeVisible();
  const accessibility = await new AxeBuilder({ page }).include('.nnb-summary-lesson').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  expect(accessibility.violations).toEqual([]);
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Pobierz raport CSV' }).click();
  const downloaded = await downloadPromise;
  const csv = await readFile(await downloaded.path(), 'utf8');
  expect(csv).toContain('"Z02","Próby","0"');
  await page.close();
  const reopened = await context.newPage();
  await reopened.goto('/dist/local/');
  await expect(reopened.getByLabel('Zachowaj sesję po zamknięciu przeglądarki')).toBeChecked();
  await reopened.getByRole('button', { name: 'Pomiń wprowadzenie', exact: true }).click();
  await expect(reopened.getByRole('heading', { name: 'E7 · Podsumowanie' })).toBeVisible();
  reopened.once('dialog', (dialog) => dialog.accept());
  await reopened.getByLabel('Zachowaj sesję po zamknięciu przeglądarki').uncheck();
  await expect(reopened.getByText('Usunięto trwały zapis')).toBeVisible();
  await reopened.close();
  const sessionOnly = await context.newPage();
  await sessionOnly.goto('/dist/local/');
  await expect(sessionOnly.getByLabel('Zachowaj sesję po zamknięciu przeglądarki')).not.toBeChecked();
  await sessionOnly.getByRole('button', { name: 'Pomiń wprowadzenie', exact: true }).click();
  await expect(sessionOnly.getByRole('heading', { name: 'E1 · Wprowadzenie' })).toBeVisible();
});

test('P4: odmowa IndexedDB pozostawia działający zapis sesyjny', async ({ page }) => {
  await page.addInitScript(() => { Object.defineProperty(window, 'indexedDB', { value: undefined }); });
  await page.goto('/dist/local/');
  await page.getByLabel('Zachowaj sesję po zamknięciu przeglądarki').click();
  await expect(page.getByText('Nie udało się zmienić sposobu zapisu')).toBeVisible();
  await expect(page.getByLabel('Zachowaj sesję po zamknięciu przeglądarki')).not.toBeChecked();
  await page.getByRole('button', { name: 'Pomiń wprowadzenie', exact: true }).click();
  await page.getByRole('button', { name: 'E7 · Podsumowanie' }).click();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'E7 · Podsumowanie' })).toBeVisible();
});

test('P4: test E7, słownik, E8 i zbiorczy raport nauczyciela', async ({ page }) => {
  await page.goto('/dist/local/');
  await page.getByRole('button', { name: 'Pomiń wprowadzenie', exact: true }).click();
  await page.getByText('Słownik pojęć', { exact: true }).click();
  await page.getByLabel('Szukaj pojęcia').fill('azymut');
  await expect(page.getByText('Azymut', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'E7 · Podsumowanie' }).click();
  const first = page.locator('#nnb-Q01');
  await first.getByLabel('Nadir').check();
  await first.getByRole('button', { name: 'Sprawdź odpowiedź' }).click();
  await expect(first).toContainText('Odpowiedź błędna');
  await expect(page.getByRole('heading', { name: 'Powrót do błędnych odpowiedzi' })).toBeVisible();
  await first.getByLabel('Zenit').check();
  await first.getByRole('button', { name: 'Sprawdź odpowiedź' }).click();
  await expect(first).toContainText('Poprawnie');
  await expect(page.getByText('Odpowiedziano: 1/12')).toBeVisible();
  const reportPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Pobierz raport JSON' }).click();
  const report = await reportPromise;
  const raw = await readFile(await report.path(), 'utf8');
  expect(JSON.parse(raw).state.assessment.answers).toHaveLength(2);
  await page.getByRole('button', { name: 'E8 · Materiały dodatkowe' }).click();
  await expect(page.getByRole('heading', { name: '8.2 · Symulacje' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Paxi i nasz Księżyc: fazy i zaćmienia' })).toBeVisible();
  expect((await new AxeBuilder({ page }).include('.nnb-resources').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()).violations).toEqual([]);
  await page.goto('/dist/local/teacher.html');
  await page.getByLabel('Wczytaj raporty JSON z E7').setInputFiles(await report.path());
  await expect(page.getByText('Zaimportowane unikatowe sesje: 1')).toBeVisible();
  expect((await new AxeBuilder({ page }).include('.nnb-teacher').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()).violations).toEqual([]);
  await page.getByLabel('Wczytaj raporty JSON z E7').setInputFiles(await report.path());
  await expect(page.getByText('Zaimportowane unikatowe sesje: 1')).toBeVisible();
  const aggregatePromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Pobierz zbiorczy CSV' }).click();
  const aggregate = await aggregatePromise;
  expect(await readFile(await aggregate.path(), 'utf8')).toContain('"Q01","Liczba prób","2"');
});

test('P4: edytor nauczyciela stosuje konfigurację, pytanie i zadanie w lekcji lokalnej', async ({ page }) => {
  const config = await configuredLesson();
  await page.goto('/dist/local/teacher.html');
  await page.getByLabel('Wczytaj konfigurację JSON').setInputFiles({
    name: 'lekcja.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(config)),
  });
  await expect(page.getByText('Wczytano konfigurację do edytora.')).toBeVisible();
  await page.getByRole('button', { name: 'Zastosuj na tym urządzeniu' }).click();
  await expect(page.getByText('Zapisano konfigurację.')).toBeVisible();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Pobierz konfigurację JSON' }).click();
  const downloaded = await downloadPromise;
  const exported = JSON.parse(await readFile(await downloaded.path(), 'utf8')) as ProbeConfig;
  expect(exported.lesson?.questions[0]?.stem).toBe('Która planeta jest czerwona?');
  await page.goto('/dist/local/');
  await page.getByRole('button', { name: 'Pomiń wprowadzenie', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'E2 · Sfera niebieska' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'E1 · Wprowadzenie' })).toHaveCount(0);
  await expect(page.getByRole('combobox', { name: 'Obiekt', exact: true }).locator('option')).toHaveCount(2);
  await page.getByRole('button', { name: 'Ustaw widok Z01' }).click();
  await page.getByRole('combobox', { name: 'Obiekt', exact: true }).selectOption('Mars');
  await page.getByRole('button', { name: 'Zastosuj', exact: true }).click();
  await page.getByRole('button', { name: 'Sprawdź zadanie' }).first().click();
  await expect(page.getByText('Próby: 1; cel: osiągnięty.').first()).toBeVisible();
  await page.getByRole('button', { name: 'Sprawdź zadanie' }).last().click();
  await expect(page.getByText('Próby: 1; cel: osiągnięty.').last()).toBeVisible();
  await page.getByRole('button', { name: 'E7 · Podsumowanie' }).click();
  await expect(page.getByText('Która planeta jest czerwona?')).toBeVisible();
});

test('P4: pełna lekcja i edytor konfiguracji działają w hoście ZPE', async ({ page }) => {
  const config = await configuredLesson();
  await page.goto('/tests/zpe-host/');
  await page.waitForFunction(() => Boolean(window.probeHarness));
  await page.evaluate(async (value) => {
    const root = document.createElement('div'); root.id = 'full'; root.style.width = '560px'; root.style.margin = '0 auto';
    document.querySelector('main')!.append(root);
    const engine = window.probeHarness.factory(); window.probeHarness.full = engine;
    await engine.init(root, window.probeHarness.apiFor(3), { data: value, contrastMode: false });
    await window.probeHarness.editor.initTab('lesson-settings', document.getElementById('editor')!, window.probeHarness.editorApi);
  }, config);
  const shell = page.locator('#full .nnb-shell');
  await expect(shell).toHaveAttribute('data-host', 'zpe');
  await expect(page.locator('#full').getByRole('heading', { name: 'Zacznij od własnej obserwacji' })).toBeVisible();
  await expect(page.locator('#full').getByRole('button', { name: 'Ekran startowy' })).toBeVisible();
  await expect(page.locator('#full').getByRole('button', { name: 'Pomoc — powtórz wprowadzenie' })).toBeVisible();
  await expect(page.locator('#full').getByRole('button', { name: 'Eksportuj stan' })).toBeVisible();
  await expect(page.locator('#full').getByRole('button', { name: 'Importuj stan' })).toBeVisible();
  await expect(page.locator('#full').getByRole('button', { name: 'Resetuj lekcję' })).toBeVisible();
  const durable = page.locator('#full').getByRole('checkbox', { name: 'Zachowaj sesję po zamknięciu przeglądarki (na tym urządzeniu)' });
  await expect(durable).toBeChecked();
  await expect(durable).toBeDisabled();
  expect(await shell.evaluate((node) => node.getBoundingClientRect().width)).toBeGreaterThan(900);
  await page.locator('#full').getByRole('button', { name: 'Pomiń wprowadzenie', exact: true }).click();
  await expect(page.locator('#full').getByRole('heading', { name: 'E2 · Sfera niebieska' })).toBeVisible();
  const narrationUrl = await page.locator('#full .nnb-level-intro audio').getAttribute('src');
  expect(narrationUrl).toContain('/dist/zpe-engine/media/p4/e2-narracja.mp3');
  expect((await page.request.get(narrationUrl!)).ok()).toBeTruthy();
  await expect(page.locator('#full').getByRole('button', { name: 'E8 · Materiały dodatkowe' })).toBeVisible();
  await expect(page.locator('#editor').getByRole('heading', { name: 'Konfiguracja lekcji' })).toBeVisible();
  await page.evaluate(() => window.probeHarness.full!.setStateFrozen(true));
  await expect(page.locator('#full').getByRole('button', { name: 'E7 · Podsumowanie' })).toBeDisabled();
  await page.evaluate(() => { window.probeHarness.full!.destroy(); window.probeHarness.editor.destroy(); });
});

test('P4: planety nad horyzontem zapisują wynik i wracają po odświeżeniu', async ({ page }) => {
  await openLocal(page);
  await page.getByRole('button', { name: 'Ustaw widok planet' }).click();
  const planets = page.getByRole('group', { name: 'Planety nad horyzontem' });
  for (const name of ['Mars', 'Jowisz', 'Uran', 'Neptun']) await planets.getByLabel(name, { exact: true }).check();
  await page.getByRole('button', { name: 'Sprawdź planety' }).click();
  await expect(page.getByText('Wszystkie planety wskazane poprawnie.')).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'E2 · Sfera niebieska' })).toBeVisible();
  await expect(page.getByText('Próby: 1; cel: osiągnięty.').last()).toBeVisible();
  await page.getByRole('button', { name: 'E7 · Podsumowanie' }).click();
  await expect(page.getByText('Planety nad horyzontem: ukończone.')).toBeVisible();
});

test('P2 Z02: zadanie klawiaturowe, raport, zapis i przywrócenie widoku', async ({ page }) => {
  await openLocal(page);
  await expect(page.getByText('Raport Z02:', { exact: false })).toContainText('cel nieukończony');
  await page.getByLabel('Moja hipoteza').fill('Sześć kroków na wschód i jeden w górę.');
  await page.getByRole('button', { name: 'Rozpocznij zadanie' }).click();
  await page.getByRole('button', { name: 'Sprawdź kierunek' }).click();
  await expect(page.getByText('Raport Z02:', { exact: false })).toContainText('próby: 1');
  for (let step = 0; step < 6; step++) await page.getByRole('button', { name: 'W prawo', exact: true }).click();
  await page.getByRole('button', { name: 'W górę', exact: true }).click();
  await page.getByRole('button', { name: 'Sprawdź kierunek' }).click();
  await expect(page.getByText('Raport Z02:', { exact: false })).toContainText('cel osiągnięty; próby: 2');
  await expect(page.getByText('Raport Z02:', { exact: false })).toContainText('0,00°');
  await page.getByLabel('Mój wniosek').fill('Azymut 90° i wysokość 30° wskazują cel.');
  await page.getByLabel('Mój wniosek').blur();
  await expect(page.getByText('Raport Z02:', { exact: false })).toContainText('Wniosek: Azymut 90°');
  await expect.poll(() => page.evaluate(() => JSON.parse(sessionStorage.getItem('nnb:p0-host-probe:0.1.0') ?? '{}').coordinateTask?.attempts)).toBe(2);
  await page.reload();
  await expect(page.getByText('Raport Z02:', { exact: false })).toContainText('cel osiągnięty; próby: 2');
  await page.getByRole('button', { name: 'Wróć do swobodnej obserwacji' }).click();
  await expect(page.getByText('Kierunek 0°', { exact: false })).toBeVisible();
});

test('lokalny build: zapis, odświeżenie, strefa i odrzucenie błędnej daty', async ({ page }) => {
  const external: string[] = [];
  await page.route('**/*', (route) => {
    if (new URL(route.request().url()).hostname !== '127.0.0.1') {
      external.push(route.request().url()); return route.abort();
    }
    return route.continue();
  });
  await openLocal(page, '/dist/local/', 'extended');
  await page.getByRole('combobox', { name: 'Obiekt', exact: true }).selectOption('Mars');
  await page.getByLabel('Strefa wyświetlania').fill('UTC');
  await page.getByRole('button', { name: 'Zastosuj' }).click();
  await expect(page.getByRole('status')).toHaveText('Stan zapisany.');
  await page.reload();
  await expect(page.getByRole('combobox', { name: 'Obiekt', exact: true })).toHaveValue('Mars');
  await expect(page.getByLabel('Chwila UTC')).toHaveValue('2026-10-03T18:00:00.000Z');
  await expect(page.getByLabel('Strefa wyświetlania')).toHaveValue('UTC');
  await page.getByLabel('Chwila UTC').fill('2026-02-30T18:00:00.000Z');
  await page.getByRole('button', { name: 'Zastosuj' }).click();
  await expect(page.getByRole('status')).toContainText('Nie wprowadzono zmian');
  await page.reload();
  await expect(page.getByLabel('Chwila UTC')).toHaveValue('2026-10-03T18:00:00.000Z');
  expect(external).toEqual([]);
});

test('AMD: izolacja, odtworzenie, zamrożenie, pełny ekran, edytor i destroy', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/tests/zpe-host/');
  await page.waitForFunction(() => Boolean(window.probeHarness));
  const first = page.locator('#first');
  const second = page.locator('#second');
  await first.getByRole('combobox', { name: 'Obiekt', exact: true }).selectOption('Mars');
  await first.getByRole('button', { name: 'Zastosuj' }).click();
  await expect(first.getByRole('status')).toHaveText('Stan zapisany.');
  await expect(second.getByRole('combobox', { name: 'Obiekt', exact: true })).toHaveValue('Moon');
  await page.evaluate(() => {
    const h = window.probeHarness;
    h.second.setState(h.first.getState());
    h.second.setStateFrozen(true);
  });
  await expect(second.getByRole('combobox', { name: 'Obiekt', exact: true })).toHaveValue('Mars');
  await expect(second.getByRole('button', { name: 'Zastosuj' })).toBeDisabled();
  await second.locator('form').dispatchEvent('submit');
  await expect(second.getByRole('status')).toContainText('Podgląd tylko do odczytu');
  await first.getByRole('button', { name: 'Pełny ekran' }).click();
  await page.locator('#editor').getByRole('combobox', { name: 'Obiekt', exact: true }).selectOption('Sun');
  await page.locator('#editor').getByRole('button', { name: 'Zastosuj' }).click();
  await expect(page.locator('#editor').getByRole('status')).toHaveText('Zapisano konfigurację początkową.');
  const report = await page.evaluate(() => {
    const h = window.probeHarness;
    return { saves: h.saves, fullscreen: h.fullscreen, tabs: h.tabs,
      object: h.editor.getState().initialObservation.objectId,
      globalsAdded: h.globalsAdded, cssPaths: h.cssPaths,
      outsideFont: getComputedStyle(document.getElementById('host-sentinel')!).fontSize };
  });
  expect(report).toEqual({ saves: [1, 0, 1], fullscreen: [1, 0], tabs: ['initial-observation', 'lesson-settings'],
    object: 'Sun', globalsAdded: [], cssPaths: Array(3).fill('/dist/zpe-engine/entry.css'), outsideFont: '16px' });
  await page.evaluate(() => { window.probeHarness.first.destroy(); window.probeHarness.editor.destroy(); });
  await expect(first.locator('.nnb')).toHaveCount(0);
  await expect(second.locator('.nnb')).toHaveCount(1);
  expect(errors).toEqual([]);
});

test('LPE: style komponentu są odporne na kolizyjny motyw strony', async ({ page }) => {
  await page.goto('/tests/zpe-host/');
  await page.waitForFunction(() => Boolean(window.probeHarness));
  const before = await page.locator('#first').evaluate((container) => {
    const root = container.querySelector('.nnb')!;
    const button = container.querySelector('button')!;
    const card = container.querySelector('.nnb-object-card')!;
    return {
      root: [getComputedStyle(root).fontSize, getComputedStyle(root).lineHeight, getComputedStyle(root).backgroundColor],
      button: [getComputedStyle(button).display, getComputedStyle(button).minHeight, getComputedStyle(button).borderRadius],
      card: [getComputedStyle(card).display, getComputedStyle(card).position],
    };
  });
  await page.addStyleTag({ content: `
    .theme_main .nnb { font-size: 31px; line-height: 3; background: rgb(255, 0, 0); }
    .theme_main .nnb button { display: block; min-height: 3px; border-radius: 0; }
    .theme_main .nnb .nnb-object-card { display: flex; position: absolute; }
    .theme_main .nnb .nnb-object-card::before { content: "OBCY BANER"; display: block; height: 100px; }
  ` });
  await page.evaluate(() => document.body.classList.add('theme_main'));
  const after = await page.locator('#first').evaluate((container) => {
    const root = container.querySelector('.nnb')!;
    const button = container.querySelector('button')!;
    const card = container.querySelector('.nnb-object-card')!;
    return {
      root: [getComputedStyle(root).fontSize, getComputedStyle(root).lineHeight, getComputedStyle(root).backgroundColor],
      button: [getComputedStyle(button).display, getComputedStyle(button).minHeight, getComputedStyle(button).borderRadius],
      card: [getComputedStyle(card).display, getComputedStyle(card).position],
      pseudo: getComputedStyle(card, '::before').content,
    };
  });
  expect(after.root).toEqual(before.root);
  expect(after.button).toEqual(before.button);
  expect(after.card).toEqual(before.card);
  expect(['none', 'normal']).toContain(after.pseudo);
});

test('dostępność próbki: klawiatura, 320 px i axe A/AA', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await openLocal(page, '/dist/local/', 'extended');
  const object = page.getByRole('combobox', { name: 'Obiekt', exact: true });
  await expect(object).toBeVisible();
  let audioReached = false;
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press('Tab');
    audioReached ||= await page.locator('.nnb-level-intro audio').evaluate((element) => element === document.activeElement);
    if (await object.evaluate((element) => element === document.activeElement)) break;
  }
  expect(audioReached).toBe(true);
  await expect(object).toBeFocused();
  await page.keyboard.press('m');
  for (let i = 0; i < 8; i++) await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Zastosuj' })).toBeFocused();
  await page.keyboard.press('Enter');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  expect(result.violations).toEqual([]);
});

test('odmowa zapisu jest widoczna i nie blokuje zmiany w pamięci', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => { throw new DOMException('Denied', 'QuotaExceededError'); };
  });
  await openLocal(page);
  await page.getByRole('combobox', { name: 'Obiekt', exact: true }).selectOption('Sun');
  await page.getByRole('button', { name: 'Zastosuj' }).click();
  await expect(page.getByRole('status')).toContainText('Nie udało się zapisać stanu');
  await expect(page.locator('.nnb-summary')).toContainText('Słońce');
});

test('rzeczywisty Worker i brak Workera pokazują identyczne odczyty', async ({ page, browser }) => {
  await openLocal(page);
  await expect(page.locator('.nnb-observation')).toHaveAttribute('data-mode', 'worker');
  await expect(page.locator('.nnb-primary-readings tbody tr')).toHaveCount(9);
  const values = await page.locator('.nnb-primary-readings tbody').innerText();
  const context = await browser.newContext();
  try {
    await context.addInitScript(() => { window.Worker = class { constructor() { throw new Error('Blocked'); } } as unknown as typeof Worker; });
    const fallback = await context.newPage();
    await openLocal(fallback, 'http://127.0.0.1:5174/dist/local/');
    await expect(fallback.locator('.nnb-observation')).toHaveAttribute('data-mode', 'main-thread');
    await expect(fallback.locator('.nnb-primary-readings tbody')).toHaveText(values, { useInnerText: true });
  } finally { await context.close(); }
});

test('brak WebGL2 uruchamia mapę Canvas; centrowanie zachowuje odczyty', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', { value: function (this: HTMLCanvasElement, name: string, options?: unknown) {
      return name === 'webgl2' ? null : original.call(this, name, options);
    } });
  });
  await openLocal(page);
  await expect(page.locator('[data-renderer]')).toHaveAttribute('data-renderer', 'canvas');
  await expect(page.locator('.nnb-primary-readings tbody tr')).toHaveCount(9);
  const before = await page.locator('.nnb-primary-readings tbody').textContent();
  await page.getByRole('button', { name: 'Pokaż wybrany obiekt na środku' }).click();
  await expect(page.locator('.nnb-primary-readings tbody')).toHaveText(before!);
  await expect(page.locator('.nnb-sky-labels')).toContainText('Księżyc');
});

test('utrata kontekstu WebGL zachowuje stan i przełącza mapę na Canvas', async ({ page }) => {
  await openLocal(page);
  await expect(page.locator('[data-renderer]')).toHaveAttribute('data-renderer', 'webgl2');
  await expect(page.locator('.nnb-primary-readings tbody tr')).toHaveCount(9);
  await page.locator('.nnb-sky-viewport canvas').evaluate((canvas: HTMLCanvasElement) => {
    const extension = canvas.getContext('webgl2')?.getExtension('WEBGL_lose_context');
    if (!extension) throw new Error('Brak rozszerzenia testującego utratę kontekstu');
    extension.loseContext();
  });
  await expect(page.locator('[data-renderer]')).toHaveAttribute('data-renderer', 'canvas');
  await expect(page.getByRole('combobox', { name: 'Obiekt', exact: true })).toHaveValue('Moon');
  await expect(page.locator('.nnb-primary-readings tbody tr')).toHaveCount(9);
});

test('zegar: ruch, pauza, cofanie i przywrócenie kamery', async ({ page }) => {
  await openLocal(page);
  const instant = page.getByLabel('Chwila UTC');
  const initial = Date.parse(await instant.inputValue());
  await page.getByLabel('Tempo czasu symulacji').selectOption('3600');
  await expect.poll(async () => Date.parse(await instant.inputValue())).toBeGreaterThan(initial + 1000);
  await page.getByRole('button', { name: 'Zatrzymaj czas' }).click();
  const paused = await instant.inputValue();
  await page.getByRole('button', { name: 'W prawo', exact: true }).click();
  await page.reload();
  await expect(instant).toHaveValue(paused);
  await expect(page.getByText('Kierunek 15°', { exact: false })).toBeVisible();
  await expect(page.getByLabel('Tempo czasu symulacji')).toHaveValue('0');
  await page.getByLabel('Tempo czasu symulacji').selectOption('-3600');
  await expect.poll(async () => Date.parse(await instant.inputValue())).toBeLessThan(Date.parse(paused) - 1000);
  await page.getByRole('button', { name: 'Zatrzymaj czas' }).click();
  await expect(page.locator('.nnb-primary-readings caption')).toContainText(await instant.inputValue());
});

test('zamrożenie blokuje zegar i zapis; wznowienie zachowuje chwilę', async ({ page }) => {
  await page.goto('/tests/zpe-host/');
  await page.waitForFunction(() => Boolean(window.probeHarness));
  await page.locator('#first').getByLabel('Tempo czasu symulacji').selectOption('3600');
  await expect.poll(() => page.evaluate(() => window.probeHarness.first.getState()!.observation.instantUtc)).not.toBe('2026-10-03T18:00:00.000Z');
  const before = await page.evaluate(() => {
    const h = window.probeHarness; h.first.setStateFrozen(true);
    return { state: h.first.getState(), saves: h.saves[0] };
  });
  await page.clock.install();
  await page.clock.runFor(6000);
  const after = await page.evaluate(() => ({ state: window.probeHarness.first.getState(), saves: window.probeHarness.saves[0] }));
  expect(after).toEqual(before);
  await expect(page.locator('#first').getByLabel('Tempo czasu symulacji')).toBeDisabled();
  await page.evaluate(() => window.probeHarness.first.setStateFrozen(false));
  await page.clock.runFor(200);
  const resumed = await page.evaluate(() => window.probeHarness.first.getState());
  expect(Date.parse(resumed!.observation.instantUtc) - Date.parse(before.state!.observation.instantUtc)).toBeLessThan(2000000);
});

test('start: preferencje przed mapą, sześć kroków, powrót i zwolnienie grafiki', async ({ page, context }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/dist/local/');
  await expect(page.locator('canvas')).toHaveCount(0);
  expect(page.workers()).toHaveLength(0);
  await page.getByText('Dostępność', { exact: true }).click();
  await page.getByRole('combobox', { name: 'Kontrast', exact: true }).selectOption('yellowOnBlack');
  await page.getByRole('combobox', { name: 'Rozmiar tekstu', exact: true }).selectOption('2');
  await page.getByLabel('Duże kontrolki').check();
  await page.getByLabel('Ogranicz ruch').check();
  await page.getByLabel('Zapamiętaj te ustawienia').check();
  await page.getByRole('button', { name: 'Zastosuj ustawienia', exact: true }).click();
  await expect(page.locator('.nnb-shell')).toHaveAttribute('data-contrast', 'yellowOnBlack');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const scan = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  expect(scan.violations).toEqual([]);
  const another = await context.newPage();
  await another.goto('http://127.0.0.1:5174/dist/local/');
  await expect(another.locator('.nnb-shell')).toHaveAttribute('data-contrast', 'yellowOnBlack');
  await another.close();
  await page.getByText('Dostępność', { exact: true }).click();
  await page.getByRole('button', { name: 'Rozpocznij ze wprowadzeniem' }).click();
  for (let step = 1; step <= 6; step++) {
    await expect(page.getByRole('heading', { name: new RegExp(`Krok ${step}/6`) })).toBeFocused();
    if (step === 3) {
      await page.reload();
      await expect(page.getByRole('heading', { name: /Krok 3\/6/ })).toBeFocused();
    }
    await page.getByRole('button', { name: step === 6 ? 'Zakończ wprowadzenie' : 'Następny krok' }).click();
  }
  await expect(page.getByRole('heading', { name: 'E2 · Sfera niebieska', exact: true })).toBeFocused();
  await expect(page.getByLabel('Tempo czasu symulacji')).toHaveValue('0');
  await page.getByRole('button', { name: 'Ekran startowy' }).click();
  await expect(page.locator('canvas')).toHaveCount(0);
  await expect.poll(() => page.workers().length).toBe(0);
});

test('P1: nawigacja, powrót, eksport, bezpieczny import i reset', async ({ page }) => {
  await page.goto('/dist/local/');
  await page.getByRole('button', { name: 'Pomiń wprowadzenie', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'E1 · Wprowadzenie' })).toBeVisible();
  await expect(page.locator('canvas')).toHaveCount(0);
  await page.getByRole('button', { name: 'E3 · Gwiazdozbiory' }).click();
  await expect(page.getByRole('heading', { name: 'E3 · Gwiazdozbiory' })).toBeFocused();
  await expect(page.getByText('Katalog 88 obszarów IAU')).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'E3 · Gwiazdozbiory' })).toBeVisible();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Eksportuj stan' }).click();
  const saved = await download;
  expect(saved.suggestedFilename()).toBe('niebo-nad-nami-stan.json');
  const filePath = await saved.path();
  expect(filePath).toBeTruthy();
  await page.getByRole('button', { name: 'E8 · Materiały dodatkowe' }).click();
  await page.locator('input[type=file]').setInputFiles({ name: 'wrong.json', mimeType: 'application/json', buffer: Buffer.from('{"sceneId":"E2"}') });
  await expect(page.getByText('Nie zaimportowano pliku.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'E8 · Materiały dodatkowe' })).toBeVisible();
  await page.locator('input[type=file]').setInputFiles(filePath!);
  await expect(page.getByRole('heading', { name: 'E3 · Gwiazdozbiory' })).toBeFocused();
  page.once('dialog', (dialog) => dialog.dismiss());
  await page.getByRole('button', { name: 'Resetuj lekcję' }).click();
  await expect(page.getByRole('heading', { name: 'E3 · Gwiazdozbiory' })).toBeVisible();
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Resetuj lekcję' }).click();
  await expect(page.getByRole('heading', { name: 'Zacznij od własnej obserwacji' })).toBeFocused();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Zacznij od własnej obserwacji' })).toBeVisible();
});

test('P1: poziom, osiem ekranów, zasoby ładowane dopiero w obserwatorium', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.goto('/dist/local/');
  expect(requests.filter((url) => /renderer-.*\.js/.test(url))).toHaveLength(0);
  await page.getByLabel('Poziom materiału').selectOption('extended');
  await page.getByRole('button', { name: 'Pomiń wprowadzenie', exact: true }).click();
  for (let number = 1; number <= 8; number++) {
    await page.getByRole('button', { name: new RegExp(`^E${number} ·`) }).click();
    await expect(page.getByRole('heading', { name: new RegExp(`^E${number} ·`) })).toBeFocused();
  }
  expect(requests.filter((url) => /renderer-.*\.js/.test(url)).length).toBe(1);
  await page.getByRole('button', { name: 'E2 · Sfera niebieska' }).click();
  await expect(page.getByLabel('Strefa wyświetlania')).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('Poziom materiału')).toHaveValue('extended');
  await expect(page.getByRole('heading', { name: 'E2 · Sfera niebieska' })).toBeVisible();
  await page.getByRole('button', { name: 'E3 · Gwiazdozbiory' }).click();
  await expect(page.locator('canvas')).toHaveCount(1);
  await expect.poll(() => page.workers().length).toBe(0);
});

test('P2: warstwy i karta obiektu oraz ćwiczenia E1–E4', async ({ page }) => {
  await openLocal(page);
  const sameInstant = await page.getByLabel('Chwila UTC').inputValue();
  await page.getByLabel('Szybki wybór miejsca').selectOption('cape-town');
  await page.getByRole('button', { name: 'Zastosuj' }).click();
  await expect(page.getByLabel('Chwila UTC')).toHaveValue(sameInstant);
  await expect(page.getByLabel('Strefa wyświetlania')).toHaveValue('Africa/Johannesburg');
  await expect(page.locator('.nnb-observation')).toContainText('Neptun');
  await page.getByRole('group', { name: 'Wybierz obiekt z listy' }).getByRole('button', { name: 'Wenus' }).click();
  await expect(page.getByRole('region', { name: 'Karta wybranego obiektu' })).toContainText('Średnica kątowa');
  await expect(page.getByRole('region', { name: 'Karta wybranego obiektu' })).toContainText('Oświetlona część tarczy');
  await page.getByLabel('Znajdź gwiazdę według numeru HIP').fill('32349');
  await page.getByRole('group', { name: 'Gwiazdy z katalogu Hipparcos' }).getByRole('button', { name: /HIP 32349/ }).click();
  await expect(page.getByRole('region', { name: 'Karta wybranego obiektu' })).toContainText('RA ICRS J1991.25');
  await expect.poll(() => page.evaluate(() => JSON.parse(sessionStorage.getItem('nnb:p0-host-probe:0.1.0') ?? '{}').selectedStarId)).toBe(32349);
  await page.reload();
  await expect(page.getByRole('region', { name: 'Karta wybranego obiektu' })).toContainText('HIP 32349');
  await page.getByRole('group', { name: 'Warstwy mapy' }).getByLabel('Figury gwiazdozbiorów').check();
  await page.getByRole('group', { name: 'Warstwy mapy' }).getByLabel('Siatka równikowa daty').check();
  await page.getByRole('button', { name: 'Śledź wybrany obiekt' }).click();
  await expect(page.getByRole('button', { name: 'Śledź wybrany obiekt' })).toHaveAttribute('aria-pressed', 'true');
  const previousAzimuth = await page.evaluate(() => JSON.parse(sessionStorage.getItem('nnb:p0-host-probe:0.1.0') ?? '{}').camera?.azimuthDeg);
  const viewport = page.locator('.nnb-sky-viewport');
  await viewport.scrollIntoViewIfNeeded();
  const box = await viewport.boundingBox();
  expect(box).toBeTruthy();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down(); await page.mouse.move(box!.x + box!.width / 2 + 45, box!.y + box!.height / 2 + 20, { steps: 5 }); await page.mouse.up();
  await expect(page.getByRole('button', { name: 'Śledź wybrany obiekt' })).toHaveAttribute('aria-pressed', 'false');
  await expect.poll(() => page.evaluate(() => JSON.parse(sessionStorage.getItem('nnb:p0-host-probe:0.1.0') ?? '{}').camera?.azimuthDeg)).not.toBe(previousAzimuth);
  await page.getByRole('button', { name: 'E1 · Wprowadzenie' }).click();
  await expect(page.getByLabel(/Ekliptyka — Pozorna roczna droga/)).toBeVisible();
  await page.getByRole('button', { name: 'E3 · Gwiazdozbiory' }).click();
  await expect(page.getByText('Katalog 88 obszarów IAU')).toBeVisible();
  await page.getByRole('button', { name: 'E4 · Ruchy' }).click();
  await expect(page.getByRole('heading', { name: '4.1.2 · Ruch roczny i pory roku' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '4.2.2 · Trzy prawa Keplera' })).toBeVisible();
});

test('P3: E5 i E6 mają odczyty semantyczne, a plan wraca po odświeżeniu', async ({ page }) => {
  await openLocal(page);
  await page.getByRole('button', { name: 'E5 · Obserwacje' }).click();
  await expect(page.getByRole('heading', { name: '5.4.1 · Zaćmienia i widoczność lokalna' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Dwa przykłady zaćmień i lokalny horyzont' }).locator('tbody tr')).toHaveCount(2);
  await page.getByLabel('Notatka do pomiaru').fill('Pozycja wybranego obiektu.');
  await page.getByRole('button', { name: 'Zapisz bieżący pomiar' }).click();
  await expect(page.getByRole('region', { name: 'Dziennik zapisanych pomiarów' }).locator('tbody tr')).toHaveCount(1);
  await page.getByLabel('Data planu (UTC)').fill('2025-08-12');
  await page.getByRole('combobox', { name: 'Sprzęt' }).selectOption('Lornetka');
  await page.getByLabel('Warunki i hipoteza').fill('Sprawdzę ciemne miejsce.');
  await page.getByRole('button', { name: 'Zapisz plan obserwacji' }).click();
  await expect(page.getByText('Zapisany plan:', { exact: false })).toContainText('2025-08-12');
  await expect.poll(() => page.evaluate(() => JSON.parse(sessionStorage.getItem('nnb:p0-host-probe:0.1.0') ?? '{}').observationPlan?.equipment)).toBe('Lornetka');
  await page.reload();
  await expect(page.getByText('Zapisany plan:', { exact: false })).toContainText('Sprawdzę ciemne miejsce.');
  await expect(page.getByRole('region', { name: 'Dziennik zapisanych pomiarów' })).toContainText('Pozycja wybranego obiektu.');
  await page.getByRole('button', { name: 'E6 · Narzędzia' }).click();
  await expect(page.getByRole('heading', { name: '6.1 · Lornetka, refraktor i reflektor' })).toBeVisible();
  await expect(page.locator('.nnb-instrument-model canvas')).toHaveCount(1);
  await page.getByRole('button', { name: 'Obróć model w prawo' }).click();
  await expect(page.getByText('Obrót modelu: 40°.', { exact: true })).toBeVisible();
  await expect(page.locator('.nnb-telescope-readout')).toContainText('pole rzeczywiste');
  await page.getByLabel('Ogniskowa okularu (mm)').evaluate((input: HTMLInputElement) => {
    input.value = '10'; input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.getByRole('combobox', { name: 'Odpowiedź' }).selectOption('smaller');
  await page.getByRole('button', { name: 'Sprawdź dobór okularu' }).click();
  await expect(page.getByText('Z06 zapisane:', { exact: false })).toBeVisible();
  await expect(page.getByRole('img', { name: /Galaktyka Andromedy/ })).toBeVisible();
  const scan = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  expect(scan.violations).toEqual([]);
});

test('P3: katalog, Z03 i Z04 zapisują wyniki i pozostają dostępne po odświeżeniu', async ({ page }) => {
  await openLocal(page);
  const catalog = page.getByRole('group', { name: 'Wybierz obiekt z katalogu P3' });
  await catalog.getByRole('button', { name: 'Galaktyka Andromedy (M31)' }).click();
  await expect(page.getByRole('region', { name: 'Karta wybranego obiektu' })).toContainText('galaktyka');
  await expect.poll(() => page.evaluate(() => JSON.parse(sessionStorage.getItem('nnb:p0-host-probe:0.1.0') ?? '{}').selectedCatalogId)).toBe('M31');
  await page.getByRole('button', { name: 'E5 · Obserwacje' }).click();
  for (const date of ['2025-03-20','2025-06-21','2025-09-22','2025-12-21'])
    await page.getByRole('button', { name: `Zapisz ${date}` }).click();
  await expect(page.getByText('Z03: 4/4 zapisanych dat', { exact: false })).toBeVisible();
  await page.getByLabel('Wniosek z porównania (ocenia nauczyciel)').fill('Latem górowanie jest wyższe.');
  await page.getByRole('button', { name: 'Zapisz wniosek Z03' }).click();
  for (let index = 0; index < 4; index++) {
    const label = await page.getByLabel('Chwila fazy').locator('option').nth(index).textContent();
    await page.getByLabel('Chwila fazy').selectOption(String(index));
    const rowName = (await page.getByRole('region', { name: 'Cztery kolejne główne fazy od wybranej chwili' }).locator('tbody tr').nth(index).locator('th').textContent())?.trim();
    const id = ({ nów:'0', 'pierwsza kwadra':'1', pełnia:'2', 'ostatnia kwadra':'3' } as Record<string,string>)[rowName ?? ''];
    expect(label).toBeTruthy(); expect(id).toBeTruthy();
    await page.getByLabel('Rozpoznana faza').selectOption(id!);
    await page.getByRole('button', { name: 'Sprawdź i zapisz fazę' }).click();
  }
  await expect(page.getByText('Z04: 4/4 rozpoznanych faz', { exact: false })).toBeVisible();
  await page.reload();
  await expect(page.getByText('Z03: 4/4 zapisanych dat', { exact: false })).toBeVisible();
  await expect(page.getByText('Z04: 4/4 rozpoznanych faz', { exact: false })).toBeVisible();
  await expect.poll(() => page.evaluate(() => JSON.parse(sessionStorage.getItem('nnb:p0-host-probe:0.1.0') ?? '{}').p3Tasks?.sunConclusion)).toBe('Latem górowanie jest wyższe.');
});

test('P3: E6 zachowuje schemat i odczyty bez WebGL2', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', { value: function (this: HTMLCanvasElement, name: string, options?: unknown) {
      return name === 'webgl2' ? null : original.call(this, name, options);
    } });
  });
  await openLocal(page);
  await page.getByRole('button', { name: 'E6 · Narzędzia' }).click();
  await expect(page.getByText('Brak WebGL2; użyj schematu 2D', { exact: false })).toBeVisible();
  await expect(page.locator('.nnb-instrument-model canvas')).toHaveCount(0);
  await expect(page.locator('.nnb-telescope-readout')).toContainText('pole rzeczywiste');
  await page.getByRole('button', { name: 'Obróć model w prawo' }).click();
  await expect(page.getByText('Obrót modelu: 40°.', { exact: true })).toBeVisible();
});
