import { test, expect } from './fixtures';
import { VISUAL_LOCALES } from './inventory';

// Geometry regression for long localized CTA labels, not linguistic acceptance.
const modes = [
  { name: 'live', search: '?fixtures=0', expectedHref: '/campaigns/demo-solar' },
  { name: 'default-preview', search: '', expectedHref: '/campaigns/fixture-alentejo-solar?fixtures=1' },
] as const;

for (const locale of VISUAL_LOCALES)
  for (const width of [320, 390, 820, 1440])
    for (const mode of modes) {
      test(`discovery card CTA clears its stats: ${locale}/${width}/${mode.name}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.route('**/api/**', (route) => {
          if (new URL(route.request().url()).pathname === '/api/campaigns') {
            return route.fulfill({
              json: {
                campaigns: [
                  {
                    id: 'demo-solar',
                    name: 'SYNTHETIC CARD',
                    contractId: 'CSYNTHETIC',
                    raised: '566000000',
                    balance: null,
                    withdrawn: false,
                    config: { creator: 'GSYNTHETIC', token: 'CSYNTHETIC', goal: '5000000000', deadline: '1794000000' },
                  },
                ],
              },
            });
          }
          return route.fulfill({ status: 503, json: {} });
        });
        await page.addInitScript((language) => {
          localStorage.clear();
          localStorage.setItem('blockallisto-language', language);
          localStorage.setItem('blockallisto-theme', 'light');
        }, locale);
        for (const path of ['/', '/campaigns']) {
          await page.goto(path + mode.search);
          await expect(page.locator('.card-details-link .btn')).toHaveCount(mode.name === 'default-preview' ? (path === '/' ? 3 : 44) : 1);
          const action = page.locator('.card-details-link .btn').first();
          await expect(action).toHaveAttribute('href', mode.expectedHref);
          await action.scrollIntoViewIfNeeded();
          expect(
            await action.evaluate((element) => {
              const box = element.getBoundingClientRect();
              const card = element.closest('.card')!;
              const parent = card.getBoundingClientRect();
              const stats = card.querySelector('.stat-grid')!.getBoundingClientRect();
              return {
                fragments: element.getClientRects().length,
                contained: box.left >= parent.left && box.right <= parent.right && box.bottom <= parent.bottom,
                textFits: element.scrollWidth <= element.clientWidth + 1,
                clearsStats: box.top >= stats.bottom + 8,
                pageFits: document.documentElement.scrollWidth <= innerWidth,
              };
            }),
          ).toEqual({ fragments: 1, contained: true, textFits: true, clearsStats: true, pageFits: true });
        }
      });
    }
