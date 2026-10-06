import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const scenes = ['E1', 'E2', 'E3', 'E4', 'E5', 'E6', 'E7', 'E8'];
const sceneContent = ['.nnb-sphere-lesson', '.nnb-probe', '.nnb-constellations', '.nnb-movement',
  '.nnb-observing', '.nnb-instruments', '.nnb-summary-lesson', '.nnb-resources'];

test('P5: osiem scen na trzech poziomach mieści się w szerokościach planu', async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto('/dist/local/');
  await page.getByRole('button', { name: 'Pomiń wprowadzenie', exact: true }).click();
  for (const width of [320, 360, 768, 1024, 1366, 1920]) {
    await page.setViewportSize({ width, height: 800 });
    for (const level of ['basic', 'extended', 'expert']) {
      await page.getByLabel('Poziom materiału').selectOption(level);
      for (const scene of scenes) {
        await page.getByRole('button', { name: new RegExp(`^${scene} ·`) }).click();
        await expect(page.getByRole('heading', { name: new RegExp(`^${scene} ·`) })).toBeVisible();
        await expect(page.locator(sceneContent[scenes.indexOf(scene)]!)).toBeVisible();
        await expect(page.locator('.nnb-level-intro .nnb-transcript')).not.toBeEmpty();
        const overflow = await page.evaluate(() => ({
          pixels: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          elements: [...document.querySelectorAll('body *')]
            .filter((element) => element.getBoundingClientRect().right > innerWidth + 1)
            .slice(0, 8).map((element) => `${element.tagName}.${element.className}: ${Math.round(element.getBoundingClientRect().right)}`),
        }));
        expect(overflow.pixels, `${width}px, ${level}, ${scene}: ${overflow.elements.join(', ')}`).toBeLessThanOrEqual(1);
        if (width === 320 && level === 'extended' && scene === 'E3') {
          const scroll = page.locator('.nnb-constellations .nnb-table-scroll');
          await expect(scroll).toHaveAttribute('tabindex', '0');
          expect(await scroll.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true);
          await scroll.focus();
          await page.keyboard.press('ArrowRight');
          await expect.poll(() => scroll.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
        }
      }
    }
  }
});

test('P5: pełne sceny działają bez zewnętrznej sieci i bez naruszeń axe A/AA', async ({ page }) => {
  const external: string[] = [];
  await page.route('**/*', (route) => {
    const url = new URL(route.request().url());
    if (url.hostname !== '127.0.0.1') {
      external.push(url.href);
      return route.abort();
    }
    return route.continue();
  });
  await page.goto('/dist/local/');
  await page.getByRole('button', { name: 'Pomiń wprowadzenie', exact: true }).click();
  for (const scene of scenes) {
    await page.getByRole('button', { name: new RegExp(`^${scene} ·`) }).click();
    await expect(page.locator(sceneContent[scenes.indexOf(scene)]!)).toBeVisible();
    await expect(page.locator('.nnb-level-intro audio')).toHaveAttribute('src', /\.mp3$/);
    const scan = await new AxeBuilder({ page }).include('.nnb-scene')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    expect(scan.violations, `${scene}: ${JSON.stringify(scan.violations)}`).toEqual([]);
  }
  expect(external).toEqual([]);
});
