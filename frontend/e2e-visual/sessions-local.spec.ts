import { test, expect } from './fixtures';
import { VISUAL_LOCALES, VISUAL_WIDTHS } from './inventory';
import { readFileSync } from 'node:fs';
import { argosScreenshot } from '@argos-ci/playwright';

// Explicit local fixtures only. No account writes, real sessions or provider calls.
for (const locale of VISUAL_LOCALES)
  for (const width of VISUAL_WIDTHS)
    for (const theme of ['light', 'navy'])
      for (const state of ['loading', 'populated', 'empty', 'error'])
        test(`sessions/${locale}/${width}/${theme}/${state}`, async ({ page }) => {
          const copy = JSON.parse(readFileSync(`i18n-json/ui/${locale}.json`, 'utf8'));
          const errors: string[] = [],
            writes: string[] = [];
          page.on('pageerror', (error) => errors.push(error.message));
          page.on('request', (request) => {
            if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method())) writes.push(request.url());
          });
          await page.setViewportSize({ width, height: 1000 });
          await page.addInitScript(
            ({ locale, theme }) => {
              localStorage.setItem('blockallisto-language', locale);
              localStorage.setItem('blockallisto-theme', theme);
              localStorage.setItem('blockallisto-community-token', 'synthetic-local-session');
            },
            { locale, theme },
          );
          let release!: () => void;
          const pending = new Promise<void>((resolve) => {
            release = resolve;
          });
          await page.route('**/api/**', async (route) => {
            const path = new URL(route.request().url()).pathname;
            if (path === '/api/auth/me')
              return route.fulfill({ json: { account: { publicKey: 'GSYNTHETIC', authMethod: 'wallet', totpEnabled: false }, isOperator: false } });
            if (path === '/api/campaigns') return route.fulfill({ json: { campaigns: [] } });
            if (path === '/api/auth/sessions') {
              if (state === 'loading') await pending;
              if (state === 'error') return route.fulfill({ status: 500, json: { code: 'internal_error', error: 'SYNTHETIC RAW TEXT MUST NOT DISPLAY' } });
              return route.fulfill({
                json: { sessions: state === 'empty' ? [] : [{ id: 'SYNTHETIC-CURRENT', current: true, createdAt: 1, expiresAt: 1900000000000 }] },
              });
            }
            return route.fulfill({ status: 503, json: { code: 'feature_unavailable', error: 'unavailable' } });
          });
          try {
            await page.goto('/account');
            await expect(page.locator('html')).toHaveAttribute('lang', locale === 'pt' ? 'pt-PT' : locale === 'es' ? 'es-ES' : locale);
            expect(await page.locator('html').getAttribute('data-theme')).toBe(theme === 'light' ? 'light' : null);
            const heading = page.getByRole('heading', { name: copy.community.security.sessionsTitle, exact: true });
            await expect(heading).toBeVisible();
            const section = page.getByRole('region', { name: copy.community.security.title, exact: true });
            const loading = section.getByRole('status').filter({ hasText: copy.community.loading });
            const empty = section.getByText(copy.community.security.empty, { exact: true });
            if (state === 'loading') await expect(loading).toBeVisible();
            if (state === 'populated') await expect(page.getByText('SYNTHETIC-CURRENT', { exact: true })).toBeVisible();
            if (state === 'empty') await expect(empty).toBeVisible();
            if (state === 'error') await expect(section.getByRole('alert').filter({ hasText: copy.community.errorInternal })).toBeVisible();
            if (state !== 'empty') await expect(empty).toHaveCount(0);
            if (state !== 'loading') await expect(loading).toHaveCount(0);
            await expect(page.getByText('SYNTHETIC RAW TEXT MUST NOT DISPLAY', { exact: true })).toHaveCount(0);
            await heading.scrollIntoViewIfNeeded();
            await page.evaluate(() => document.fonts.ready);
            expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
            await argosScreenshot(page, `sessions-local/${locale}/${width}/${theme}/${state}`, { element: section });
            expect(errors).toEqual([]);
            expect(writes).toEqual([]);
          } finally {
            release();
          }
        });
