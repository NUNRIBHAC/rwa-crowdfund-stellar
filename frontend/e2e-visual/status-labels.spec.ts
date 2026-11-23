import fs from 'node:fs';
import { test, expect } from './fixtures';
import { VISUAL_LOCALES } from './inventory';

const actor = 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF';
const statuses = ['BUILT', 'SIGNED', 'PENDING', 'SUCCESS', 'FAILED', 'NOT_FOUND', 'CANCELLED_UNSIGNED'];
const unknownStatuses = ['FUTURE_STATUS', '__proto__', 'constructor'];
const widths = [320, 390, 820, 1280, 1600];
const captureRoot = process.env.STATUS_CAPTURE_DIR;
if (captureRoot) fs.mkdirSync(captureRoot, { recursive: true });

// Explicit synthetic wallet/status data. Never sign, submit, or contact a real API.
for (const locale of VISUAL_LOCALES)
  for (const theme of ['light', 'navy']) {
    test(`transaction status labels: ${locale}/${theme}`, async ({ page }) => {
      test.setTimeout(120000);
      const messages = JSON.parse(fs.readFileSync(new URL(`../i18n-json/ui/${locale}.json`, import.meta.url), 'utf8')) as {
        intent: { statusLabels: Record<string, string> };
        account: { savedTxUnknown: string };
      };
      let status = 'BUILT';
      let source: 'journal' | 'saved' = 'journal';
      const writes: string[] = [];
      const pageErrors: string[] = [];
      const rows: { source: string; status: string; width: number; label: string }[] = [];
      page.on('pageerror', (error) => pageErrors.push(error.message));
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.addInitScript(
        ({ locale, theme, actor }) => {
          localStorage.setItem('blockallisto-language', locale);
          localStorage.setItem('blockallisto-theme', theme);
          (window as unknown as { freighter: boolean }).freighter = true;
          window.addEventListener('message', (event) => {
            if (event.source !== window || event.data?.source !== 'FREIGHTER_EXTERNAL_MSG_REQUEST') return;
            const request = event.data;
            if (!['REQUEST_ACCESS', 'REQUEST_CONNECTION_STATUS', 'REQUEST_PUBLIC_KEY'].includes(request.type)) {
              throw new Error('Status fixture attempted a signing or unsupported wallet operation');
            }
            window.postMessage(
              { source: 'FREIGHTER_EXTERNAL_MSG_RESPONSE', messagedId: request.messageId, publicKey: actor, isConnected: true },
              location.origin,
            );
          });
        },
        { locale, theme, actor },
      );
      const row = () => ({ actor, campaign: 'status-label-fixture', action: 'contribute', status, hash: 'a'.repeat(64), amount: null, createdAt: null });
      await page.route('**/api/**', (route) => {
        if (!['GET', 'HEAD', 'OPTIONS'].includes(route.request().method())) {
          writes.push(route.request().method() + ' ' + route.request().url());
          return route.abort();
        }
        const pathname = new URL(route.request().url()).pathname;
        if (pathname === '/api/account/activity') return route.fulfill({ json: { activity: source === 'journal' ? [row()] : [] } });
        return route.fulfill({
          json: {
            campaigns: [],
            enabled: false,
            providers: [],
            comments: [],
            news: [],
            reports: [],
            episodes: [],
            rewards: [],
            documents: [],
            holdings: [],
            payouts: [],
            activities: [],
            events: [],
            notifications: [],
            tickets: [],
            applications: [],
            items: [],
            intents: [],
            unavailable: [],
          },
        });
      });
      await page.goto('/account?fixtures=0');
      const themeState = await page.evaluate(() => ({
        theme: document.documentElement.dataset.theme ?? 'navy',
        header: getComputedStyle(document.querySelector('.site-header')!).backgroundColor,
      }));
      expect(themeState.theme).toBe(theme);
      expect(themeState.header).toBe(theme === 'light' ? 'rgb(255, 255, 255)' : 'rgb(20, 22, 58)');
      if (process.env.STATUS_THEME_ONLY) {
        await page.screenshot({ path: `${process.env.STATUS_THEME_ONLY}/${locale}-${theme}-page.png`, fullPage: true });
        return;
      }
      for (source of (process.env.STATUS_SOURCE ? [process.env.STATUS_SOURCE as 'journal' | 'saved'] : ['journal', 'saved']) as ('journal' | 'saved')[])
        for (status of [...statuses, ...unknownStatuses]) {
          const label = statuses.includes(status) ? messages.intent.statusLabels[status] : messages.account.savedTxUnknown;
          expect(label.trim()).not.toBe('');
          expect([...statuses, ...unknownStatuses]).not.toContain(label);
          await page.evaluate((intent) => localStorage.setItem('rwa-soroban-intent', JSON.stringify(intent)), { ...row(), xdr: 'SYNTHETIC-UNSIGNED-FIXTURE' });
          await page.reload();
          await page.locator('.header-actions .btn').click();
          await expect(page.locator('.wallet-chip')).toHaveCount(1);
          const panel = page.locator('.intent-head .status-chip');
          const account =
            source === 'journal'
              ? page
                  .locator('.activity-list li')
                  .filter({ has: page.locator('code', { hasText: 'status-label-fixture' }) })
                  .locator('strong')
              : page
                  .locator('p')
                  .filter({ has: page.locator('code', { hasText: 'status-label-fixture' }) })
                  .locator('strong');
          await expect(panel).toHaveText(label);
          await expect(account).toHaveText(label);
          await page.evaluate(() => document.fonts.ready);
          for (const width of widths) {
            await page.setViewportSize({ width, height: 1000 });
            for (const target of [panel, account]) {
              const geometry = await target.evaluate((element) => {
                const parent = element.closest('.intent-head, li, p')!;
                const bounds = parent.getBoundingClientRect();
                const rects = [...element.getClientRects()];
                return {
                  visible: rects.length > 0 && rects.every((r) => r.height > 0),
                  contained: rects.every((r) => r.left >= bounds.left - 1 && r.right <= bounds.right + 1 && r.left >= -1 && r.right <= innerWidth + 1),
                  pageFits: document.documentElement.scrollWidth <= innerWidth,
                  layoutDirection: getComputedStyle(document.documentElement).direction,
                };
              });
              expect(geometry, `${locale}/${theme}/${source}/${status}/${width}`).toEqual({
                visible: true,
                contained: true,
                pageFits: true,
                layoutDirection: 'ltr',
              });
            }
            if (captureRoot) {
              await panel.locator('xpath=..').screenshot({ path: `${captureRoot}/${locale}-${theme}-${source}-${status}-${width}-panel.png` });
              await account.locator('xpath=..').screenshot({ path: `${captureRoot}/${locale}-${theme}-${source}-${status}-${width}-account.png` });
            }
            rows.push({ source, status, width, label });
          }
        }
      expect(writes).toEqual([]);
      expect(pageErrors).toEqual([]);
      expect(rows).toHaveLength(process.env.STATUS_SOURCE ? 50 : 100);
      await test
        .info()
        .attach('status-matrix', { body: JSON.stringify({ locale, theme, rows, writes, pageErrors }, null, 2), contentType: 'application/json' });
    });
  }
