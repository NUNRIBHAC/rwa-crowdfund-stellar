import { test, expect } from './fixtures';
import { VISUAL_LOCALES } from './inventory';

// Public navigation only. Private sections intentionally have empty markers
// when signed out; their anchors must still clear the measured sticky header.
for (const locale of VISUAL_LOCALES)
  for (const theme of ['light', 'navy'])
    for (const width of [390, 1280]) {
      test(`investor account anchors: ${locale}/${theme}/${width}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 960 });
        await page.emulateMedia({ reducedMotion: 'reduce' });
        const mutations: string[] = [];
        await page.route('**/api/**', async (route) => {
          const request = route.request();
          if (request.method() !== 'GET') {
            mutations.push(request.method() + ' ' + new URL(request.url()).pathname);
            return route.abort();
          }
          const path = new URL(request.url()).pathname;
          if (path === '/api/campaigns') return route.fulfill({ json: { campaigns: [], mode: 'soroban' } });
          if (path === '/api/auth/abuse-config') return route.fulfill({ json: { socialProviders: [] } });
          return route.fulfill({ status: path.startsWith('/api/auth/') ? 401 : 200, json: {} });
        });
        await page.addInitScript(
          ({ locale, theme }) => {
            localStorage.clear();
            localStorage.setItem('blockallisto-language', locale);
            localStorage.setItem('blockallisto-theme', theme);
          },
          { locale, theme },
        );
        for (const id of ['investor-holdings', 'investor-documents', 'investor-assessment']) {
          await page.goto('/for-investors');
          await page.locator(`.investors-resources a[href="/account#${id}"]`).click();
          await expect(page).toHaveURL(new RegExp(`/account#${id}$`));
          const target = page.locator(`#${id}`);
          await expect(target).toBeAttached();
          await page.evaluate(() => document.fonts.ready);
          // App rechecks fragment scrolling after fonts/header measurement.
          // One CSS pixel allows integer scroll offsets at fractional edges.
          await expect(async () => {
            const geometry = await target.evaluate((element) => ({
              top: element.getBoundingClientRect().top,
              headerBottom: document.querySelector('header')!.getBoundingClientRect().bottom,
              viewportHeight: innerHeight,
            }));
            expect(geometry.top).toBeGreaterThanOrEqual(geometry.headerBottom - 1);
            expect(geometry.top).toBeLessThan(geometry.viewportHeight);
          }).toPass({ timeout: 3000 });
          if (id === 'investor-assessment') await page.screenshot({ path: test.info().outputPath('assessment-anchor.png') });
        }
        expect(mutations).toEqual([]);
      });
    }
