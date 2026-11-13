import { test, expect } from './fixtures';
import { VISUAL_LOCALES } from './inventory';

// Geometry regression for long localized CTA labels, not linguistic acceptance.
for (const locale of VISUAL_LOCALES)
  for (const width of [320, 390, 820, 1440]) {
    test(`journey CTA stays in one box: ${locale}/${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.route('**/api/**', (route) => route.fulfill({ status: 503, json: {} }));
      await page.addInitScript((language) => {
        localStorage.clear();
        localStorage.setItem('blockallisto-language', language);
        localStorage.setItem('blockallisto-theme', 'light');
      }, locale);
      await page.goto('/how-it-works');
      for (const audience of ['investor', 'issuer']) {
        await page.locator(`#journey-tab-${audience}`).click();
        const action = page.locator('.journey-final-action');
        await expect(action).toHaveAttribute('href', audience === 'investor' ? '/campaigns' : '/for-businesses');
        await action.scrollIntoViewIfNeeded();
        expect(
          await action.evaluate((element) => {
            const box = element.getBoundingClientRect();
            const parent = element.parentElement!.getBoundingClientRect();
            return {
              fragments: element.getClientRects().length,
              contained: box.left >= parent.left && box.right <= parent.right,
              textFits: element.scrollWidth <= element.clientWidth + 1,
              pageFits: document.documentElement.scrollWidth <= innerWidth,
            };
          }),
        ).toEqual({ fragments: 1, contained: true, textFits: true, pageFits: true });
      }
    });
  }
