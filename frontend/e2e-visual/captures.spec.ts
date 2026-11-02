import { test } from '@playwright/test';
import { argosScreenshot } from '@argos-ci/playwright';

// Every API call resolves to the same unavailable response so the rendered
// state is deterministic. No wallet, no backend, no live data.
test.beforeEach(async ({ page }) => {
  await page.route('**/api/**', (route) =>
    route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'synthetic capture: API offline' }),
    }),
  );
});

const PAGES: Array<{ path: string; name: string }> = [
  { path: '/', name: 'home' },
  { path: '/how-it-works', name: 'how-it-works' },
  { path: '/investments', name: 'investments-api-offline' },
  { path: '/faq', name: 'faq' },
  { path: '/risk-warnings', name: 'risk-warnings' },
];

for (const { path, name } of PAGES) {
  test(`capture ${name}`, async ({ page }) => {
    await page.goto(path);
    // Let data-fetching settle into the designed offline state.
    await page.waitForTimeout(2000);
    await argosScreenshot(page, name);
  });
}
