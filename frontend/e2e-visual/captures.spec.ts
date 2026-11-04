import { test, expect } from '@playwright/test';
import { argosScreenshot } from '@argos-ci/playwright';
import { PUBLIC_PAGES, VISUAL_LOCALES, VISUAL_WIDTHS } from './inventory';

// Public rendering only. Explicit synthetic funding, no private account data,
// credentials, backend mutations, wallet, signing or live financial evidence.
test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-03T12:00:00Z'));
  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/campaigns') {
      return route.fulfill({
        json: {
          campaigns: [
            {
              id: 'demo-solar',
              name: 'SYNTHETIC VISUAL CAMPAIGN - NOT LIVE DATA',
              contractId: 'CSYNTHETIC',
              raised: '600000000',
              balance: null,
              withdrawn: false,
              config: { creator: 'GSYNTHETIC', token: 'CSYNTHETIC', goal: '1000000000', deadline: '1794000000' },
            },
          ],
        },
      });
    }
    return route.fulfill({ json: { enabled: false, providers: [], comments: [], news: [], reports: [], episodes: [], rewards: [], documents: [] } });
  });
});

for (const locale of VISUAL_LOCALES)
  for (const width of VISUAL_WIDTHS)
    for (const { path, name } of PUBLIC_PAGES) {
      test(`${locale}/${width}/${name}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.addInitScript((language) => {
          localStorage.clear();
          localStorage.setItem('blockallisto-language', language);
          localStorage.setItem('blockallisto-theme', 'light');
        }, locale);
        await page.goto(path);
        await expect(page.locator('main h1').first()).toBeVisible();
        await expect(page.locator('html')).toHaveAttribute('lang', locale === 'pt' ? 'pt-PT' : locale === 'es' ? 'es-ES' : locale === 'ar' ? 'ar' : locale);
        if (path === '/' || path === '/campaigns') await expect(page.locator('.card').first()).toBeVisible();
        if (path.startsWith('/campaigns/')) await expect(page.locator('#campaign-funding')).toBeVisible();
        await page.evaluate(async () => {
          await document.fonts.ready;
          await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
        });
        await argosScreenshot(page, `public-synthetic/${locale}/${width}/${name}`, { fullPage: true });
      });
    }
