import { test, expect } from './fixtures';
test.setTimeout(120000);
import { PUBLIC_PAGES, VISUAL_LOCALES, VISUAL_WIDTHS } from './inventory';
for (const locale of VISUAL_LOCALES)
  for (const width of VISUAL_WIDTHS)
    for (const theme of ['dark', 'light'])
      test(`${locale}-${width}-${theme}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.addInitScript(
          ({ locale, theme }) => {
            localStorage.setItem('blockallisto-language', locale);
            localStorage.setItem('blockallisto-theme', theme);
          },
          { locale, theme },
        );
        await page.route('**/api/**', (r) =>
          r.fulfill({
            status: 200,
            contentType: 'application/json',
            body: '{"campaigns":[],"news":[],"events":[],"items":[],"posts":[],"podcasts":[],"jobs":[],"enabled":false,"providers":[],"comments":[],"reports":[],"episodes":[],"rewards":[],"documents":[]}',
          }),
        );
        await page.goto('/tile-wall');
        await expect(page.locator('[data-approved-paragraph]')).toHaveCount(11);
        await expect(page.locator('.wall-tile')).toHaveCount(48);
        await expect(page.locator('footer a[href="/tile-wall"]')).toHaveCount(1);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        if (locale === 'ar') {
          expect(await page.locator('.tile-wall-grid').evaluate((e) => getComputedStyle(e).direction)).toBe('ltr');
          expect(
            await page
              .locator('.founding-campaign p')
              .first()
              .evaluate((e) => getComputedStyle(e).direction),
          ).toBe('rtl');
        }
        await page.screenshot({ path: `test-results/tile-wall/wall-${locale}-${width}-${theme}-campaign.png`, fullPage: true });
        await page.locator('.tile-wall-controls input').fill('90');
        await expect(page.locator('.tile-wall-controls output')).toHaveText('90%');
        await page.locator('.tile-wall-controls button').first().click();
        await expect(page.locator('.is-refunding')).toHaveCount(1);
        await page.waitForTimeout(2100);
        await page.screenshot({ path: `test-results/tile-wall/wall-${locale}-${width}-${theme}-refund.png`, fullPage: true });
        await page.emulateMedia({ reducedMotion: 'reduce' });
        expect(
          await page
            .locator('.wall-tile')
            .first()
            .evaluate((e) => getComputedStyle(e).animationName),
        ).toBe('none');
        await page.locator('.tile-wall-controls button').last().click();
        await expect(page.locator('.is-growing')).toHaveCount(1);
        for (const { path } of PUBLIC_PAGES) {
          await page.evaluate((path) => {
            history.pushState(null, '', path);
            dispatchEvent(new PopStateEvent('popstate'));
          }, path);
          await expect(page.locator('footer a[href="/tile-wall"]')).toHaveCount(1);
        }
      });
