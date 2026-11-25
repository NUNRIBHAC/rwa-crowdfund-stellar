import { test, expect } from './fixtures';
import { VISUAL_LOCALES, VISUAL_WIDTHS } from './inventory';

for (const locale of VISUAL_LOCALES)
  for (const width of VISUAL_WIDTHS)
    for (const theme of ['light', 'dark'])
      test(`payment-path/${locale}/${width}/${theme}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 1000 });
        await page.addInitScript(
          ({ locale, theme }) => {
            localStorage.setItem('blockallisto-language', locale);
            localStorage.setItem('blockallisto-theme', theme);
            if (!localStorage.getItem('rwa-soroban-intent'))
              localStorage.setItem(
                'rwa-soroban-intent',
                JSON.stringify({
                  hash: 'a'.repeat(64),
                  campaign: 'SYNTHETIC TEST ONLY',
                  actor: 'fixture',
                  action: 'contribute',
                  amount: '10.1234567',
                  feeStroops: '10100',
                  status: 'BUILT',
                  xdr: 'SYNTHETIC-NOT-SIGNABLE',
                }),
              );
          },
          { locale, theme },
        );
        const writes: string[] = [],
          errors: string[] = [];
        page.on('pageerror', (error) => errors.push(error.message));
        page.on('request', (request) => {
          if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method())) writes.push(request.url());
        });
        await page.route('**/api/**', (route) => route.fulfill({ json: { campaigns: [], enabled: false, providers: [] } }));
        await page.goto('/for-investors');
        const panel = page.locator('.testnet-payment-path');
        await expect(panel).toBeVisible();
        expect(await page.evaluate(() => document.documentElement.dataset.theme || 'navy')).toBe(theme === 'light' ? 'light' : 'navy');
        await page.addStyleTag({ content: '.site-header { position: static !important; }' });
        await panel.scrollIntoViewIfNeeded();
        await page.evaluate(() => document.fonts.ready);
        await expect(panel.locator('dt')).toHaveCount(4);
        await expect(panel.locator('.intent-facts')).toHaveCSS('direction', 'ltr');
        if (locale === 'ar') {
          await expect(panel.locator('h3')).toHaveCSS('direction', 'rtl');
          await expect(panel.locator('h3')).toHaveCSS('text-align', 'left');
        }
        const cells = await panel.locator('.intent-facts > div').evaluateAll((nodes) =>
          nodes.map((node) => {
            const box = node.getBoundingClientRect();
            return { x: box.x, y: box.y };
          }),
        );
        for (let index = 1; index < cells.length; index++) {
          if (Math.abs(cells[index].y - cells[index - 1].y) < 1) expect(cells[index].x).toBeGreaterThan(cells[index - 1].x);
          else expect(cells[index].y).toBeGreaterThan(cells[index - 1].y);
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        await panel.screenshot({ path: `test-results/payment-path/${locale}-${width}-${theme}-contribution.png` });
        for (const action of ['contribute', 'refund', 'withdraw']) {
          await page.evaluate((action) => {
            const value = JSON.parse(localStorage.getItem('rwa-soroban-intent')!);
            value.action = action;
            value.status = 'SUCCESS';
            value.signedXdr = 'SYNTHETIC-NOT-SIGNABLE';
            value.paymentEvidence = { hash: value.hash, ledger: 123, confirmedAmount: '9.7654321' };
            localStorage.setItem('rwa-soroban-intent', JSON.stringify(value));
          }, action);
          await page.reload();
          await expect(panel).toBeVisible();
          await page.addStyleTag({ content: '.site-header { position: static !important; }' });
          await panel.scrollIntoViewIfNeeded();
          await page.evaluate(() => document.fonts.ready);
          await expect(panel.locator('dt')).toHaveCount(action === 'withdraw' ? 3 : 4);
          expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
          await expect(panel).toContainText('9.7654321');
          await panel.screenshot({ path: `test-results/payment-path/${locale}-${width}-${theme}-${action}-confirmed.png` });
          if (locale === 'ar' && width === 1440 && theme === 'light' && action === 'contribute') {
            await page.locator('head > style').evaluateAll((nodes) => nodes.forEach((node) => node.remove()));
            await panel.evaluate((node) => node.scrollIntoView({ block: 'center' }));
            await page.screenshot({ path: 'test-results/payment-path/ar-1440-light-confirmed-context.png' });
          }
        }
        expect(writes).toEqual([]);
        expect(errors).toEqual([]);
      });

test('payment-cache: exact evidence survives reload and old terminal status cannot invent it', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('blockallisto-language', 'en');
    if (!localStorage.getItem('rwa-soroban-intent'))
      localStorage.setItem(
        'rwa-soroban-intent',
        JSON.stringify({
          hash: 'a'.repeat(64),
          campaign: 'SYNTHETIC TEST ONLY',
          actor: 'fixture',
          action: 'contribute',
          amount: '10',
          feeStroops: '10100',
          status: 'PENDING',
          signedXdr: 'SYNTHETIC-NOT-SIGNABLE',
          xdr: 'SYNTHETIC-NOT-SIGNABLE',
        }),
      );
  });
  const writes: string[] = [];
  page.on('request', (request) => {
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method())) writes.push(request.url());
  });
  await page.route('**/api/**', (route) =>
    route.fulfill({
      json: route.request().url().includes('/soroban/transactions/')
        ? { hash: 'a'.repeat(64), status: 'SUCCESS', paymentEvidence: { hash: 'a'.repeat(64), ledger: 123, confirmedAmount: '9.75' } }
        : { campaigns: [], enabled: false, providers: [] },
    }),
  );
  await page.goto('/for-investors');
  const panel = page.locator('.testnet-payment-path');
  await expect(panel).not.toContainText('9.75');
  await page.getByRole('button', { name: 'Check ledger result', exact: true }).click();
  await expect(panel).toContainText('9.75 USDC');
  await page.reload();
  await expect(panel).toContainText('9.75 USDC');
  await page.evaluate(() => {
    const value = JSON.parse(localStorage.getItem('rwa-soroban-intent')!);
    delete value.paymentEvidence;
    localStorage.setItem('rwa-soroban-intent', JSON.stringify(value));
  });
  await page.reload();
  await expect(panel).not.toContainText('9.75');
  await expect(panel.getByText('Not verified', { exact: true })).toHaveCount(2);
  expect(writes).toEqual([]);
});
