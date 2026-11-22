import { test, expect } from './fixtures';
import { VISUAL_LOCALES } from './inventory';

// Every preview contract link must remain above the title's stretched link.
// Check real hit targets for every link without opening thousands of tabs.
for (const locale of VISUAL_LOCALES)
  for (const width of [320, 390, 820, 1440])
    for (const theme of ['light', 'navy']) {
      test(`preview contract pointer targets: ${locale}/${width}/${theme}`, async ({ page }) => {
        test.setTimeout(90000);
        await page.setViewportSize({ width, height: 900 });
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.route('**/api/**', (route) =>
          route.fulfill({
            json:
              new URL(route.request().url()).pathname === '/api/campaigns'
                ? { campaigns: [] }
                : { enabled: false, providers: [], comments: [], news: [], reports: [], episodes: [], rewards: [], documents: [] },
          }),
        );
        await page.addInitScript(
          ({ locale, theme }) => {
            if (!/^https?:$/.test(location.protocol)) return;
            localStorage.clear();
            localStorage.setItem('blockallisto-language', locale);
            localStorage.setItem('blockallisto-theme', theme);
          },
          { locale, theme },
        );
        await page.goto('/');
        for (const [path, count] of [
          ['/', 3],
          ['/campaigns', 44],
        ] as const) {
          if (path !== '/')
            await page.evaluate((path) => {
              history.pushState(null, '', path);
              dispatchEvent(new PopStateEvent('popstate'));
            }, path);
          const links = page.locator('[data-testnet-contract]');
          await expect(links).toHaveCount(count);
          const closed = page.locator('.registry-closed:not([open]) > summary');
          if (await closed.count()) await closed.click();
          const targets = await links.evaluateAll((anchors) =>
            anchors.map((anchor) => {
              anchor.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' });
              const rect = anchor.getClientRects()[0];
              const hit = rect && document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
              return {
                href: anchor.getAttribute('href'),
                target: anchor.getAttribute('target'),
                rel: anchor.getAttribute('rel'),
                receivesPointer: !!hit && hit.closest('a') === anchor,
              };
            }),
          );
          expect(targets).toHaveLength(count);
          for (const target of targets) {
            expect(target.target).toBe('_blank');
            expect(target.rel).toBe('noopener noreferrer');
            expect(target.href).toMatch(/^\/campaigns\/fixture-[a-z0-9-]+\?fixtures=0$/);
            expect(target.receivesPointer, target.href ?? 'contract link').toBe(true);
          }
          expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        }
      });
    }
