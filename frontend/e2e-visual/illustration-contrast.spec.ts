import { test, expect } from '@playwright/test';

function contrast(foreground: string, background: string) {
  const luminance = (rgb: string) => {
    const channels = rgb
      .match(/[\d.]+/g)!
      .slice(0, 3)
      .map(Number)
      .map((n) => {
        const s = n / 255;
        return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
      });
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  };
  const a = luminance(foreground),
    b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}
for (const theme of ['navy', 'light'])
  for (const width of [390, 1280]) {
    test(`illustration selected contrast ${theme} ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.addInitScript(
        ({ theme }) => {
          localStorage.setItem('blockallisto-language', 'en');
          localStorage.setItem('blockallisto-theme', theme);
        },
        { theme },
      );
      await page.route('**/api/**', (route) => route.fulfill({ status: 503, json: { error: 'isolated visual check' } }));
      await page.goto('/');
      await page.locator('.home-contract > summary').click();
      for (const label of ['Goal reached', 'Goal missed']) {
        const button = page.getByRole('button', { name: label, exact: true });
        await button.click();
        for (const state of ['hover', 'active', 'focus', 'rest'] as const) {
          if (state === 'active') await page.mouse.down();
          if (state === 'focus') {
            await page.mouse.up();
            await page.mouse.move(0, 0);
            await button.focus();
          }
          if (state === 'rest') await button.blur();
          const colors = await button.evaluate((el) => ({ color: getComputedStyle(el).color, background: getComputedStyle(el).backgroundColor }));
          expect(colors.background).not.toContain('rgba');
          expect(contrast(colors.color, colors.background), `${label} ${state}: ${JSON.stringify(colors)}`).toBeGreaterThanOrEqual(4.5);
        }
      }
      await page.getByRole('button', { name: 'Goal missed', exact: true }).hover();
      await page.screenshot({ path: `/tmp/b43-contrast-${theme}-${width}.png` });
      expect(
        await page.locator('.funding-illustration').evaluate(
          (el) =>
            [...el.querySelectorAll('*')].filter((e) => {
              const r = e.getBoundingClientRect();
              return r.width > 0 && (r.left < 0 || r.right > innerWidth);
            }).length,
        ),
      ).toBe(0);
    });
  }
