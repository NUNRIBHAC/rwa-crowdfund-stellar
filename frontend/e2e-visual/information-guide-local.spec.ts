import { test, expect } from './fixtures';
import { VISUAL_LOCALES, VISUAL_WIDTHS } from './inventory';
import { en } from '../src/i18n/locales/en';

for (const locale of VISUAL_LOCALES)
  for (const width of VISUAL_WIDTHS)
    for (const theme of ['light', 'dark'])
      test(`information-guide/${locale}/${width}/${theme}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 1000 });
        await page.addInitScript(
          ({ locale, theme }) => {
            localStorage.setItem('blockallisto-language', locale);
            localStorage.setItem('blockallisto-theme', theme);
          },
          { locale, theme },
        );
        const writes: string[] = [];
        const errors: string[] = [];
        page.on('pageerror', (error) => errors.push(error.message));
        page.on('request', (request) => {
          if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method())) writes.push(request.url());
        });
        await page.route('**/api/**', (route) => route.fulfill({ json: { campaigns: [], enabled: false, providers: [] } }));
        await page.goto('/for-investors');
        const guide = page.locator('.investor-information-guide');
        await expect(guide).toBeVisible();
        await guide.scrollIntoViewIfNeeded();
        await page.addStyleTag({ content: '.site-header { position: static !important; }' });
        await page.evaluate(() => document.fonts.ready);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        await expect(guide.locator('details')).toHaveCount(en.glossary.length + en.riskWarnings.items.length + 3);
        await guide.locator('details').first().locator('summary').click();
        await expect(guide.locator('details[open]')).toHaveCount(1);
        await guide.screenshot({ path: `test-results/information-guide/${locale}-${width}-${theme}-terms.png` });
        await guide.getByRole('button').nth(3).click();
        await expect(guide.locator('details')).toHaveCount(1);
        await guide.locator('summary').click();
        await guide.screenshot({ path: `test-results/information-guide/${locale}-${width}-${theme}-fees.png` });
        await page.screenshot({ fullPage: true, path: `test-results/information-guide/${locale}-${width}-${theme}-fees-full.png` });
        await guide.getByRole('searchbox').fill('zzz-synthetic-no-match');
        await expect(guide.getByRole('status')).toBeVisible();
        await guide.screenshot({ path: `test-results/information-guide/${locale}-${width}-${theme}-empty.png` });
        await guide.getByRole('searchbox').fill('');
        await guide.getByRole('button').nth(4).click();
        await expect(guide.locator('details')).toHaveCount(2);
        await guide.locator('summary').first().click();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        await guide.screenshot({ path: `test-results/information-guide/${locale}-${width}-${theme}-assumptions.png` });
        expect(writes).toEqual([]);
        expect(errors).toEqual([]);
      });
