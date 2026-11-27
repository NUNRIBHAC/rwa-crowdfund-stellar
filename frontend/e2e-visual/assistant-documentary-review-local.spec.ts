import { test, expect } from './fixtures';
import { VISUAL_LOCALES, VISUAL_WIDTHS } from './inventory';

for (const locale of VISUAL_LOCALES)
  for (const width of VISUAL_WIDTHS)
    for (const theme of ['light', 'dark'])
      test(`assistant-documentary-review/${locale}/${width}/${theme}`, async ({ page }) => {
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
        page.on('request', (r) => {
          if (!['GET', 'HEAD', 'OPTIONS'].includes(r.method())) writes.push(r.url());
        });
        await page.route('**/api/**', (route) => route.fulfill({ json: { campaigns: [], enabled: false, providers: [] } }));
        await page.goto('/for-investors');
        const section = page.locator('.assistant-documentary-review');
        await expect(section).toBeVisible();
        await section.scrollIntoViewIfNeeded();
        await page.addStyleTag({ content: '.site-header { position: static !important; }' });
        await page.evaluate(() => document.fonts.ready);
        await expect(section.locator('ol > li p')).toHaveCount(5);
        await expect(section.locator('a')).toHaveCount(6);
        await expect(section.locator('button, input, form')).toHaveCount(0);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        expect(await section.locator('ol').evaluate((el) => getComputedStyle(el).direction)).toBe('ltr');
        expect(
          await section
            .locator('ol > li p')
            .first()
            .evaluate((el) => getComputedStyle(el).direction),
        ).toBe(locale === 'ar' ? 'rtl' : 'ltr');
        expect(await page.evaluate(() => document.documentElement.dataset.theme || 'navy')).toBe(theme === 'light' ? 'light' : 'navy');
        await section.screenshot({ path: `test-results/assistant-documentary-review/${locale}-${width}-${theme}.png` });
        expect(writes).toEqual([]);
        expect(errors).toEqual([]);
      });
