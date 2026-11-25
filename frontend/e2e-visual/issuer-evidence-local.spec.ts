import { test, expect } from './fixtures';
import { VISUAL_LOCALES, VISUAL_WIDTHS } from './inventory';

const areas = ['issuer', 'team', 'track_record', 'financials', 'offer_documents', 'milestones'];
for (const locale of VISUAL_LOCALES)
  for (const width of VISUAL_WIDTHS)
    for (const theme of ['light', 'dark'])
      for (const state of ['not_provided', 'unavailable', 'issuer_claim', 'corrected'])
        test(`evidence/${locale}/${width}/${theme}/${state}`, async ({ page }) => {
          await page.setViewportSize({ width, height: 900 });
          await page.addInitScript(
            ({ locale, theme }) => {
              localStorage.setItem('blockallisto-language', locale);
              localStorage.setItem('blockallisto-theme', theme);
            },
            { locale, theme },
          );
          await page.route('**/api/**', async (route) => {
            const path = new URL(route.request().url()).pathname;
            if (path === '/api/campaigns')
              return route.fulfill({
                json: {
                  campaigns: [
                    {
                      id: 'demo-solar',
                      name: 'SYNTHETIC UI TEST ONLY',
                      contractId: 'CSYNTHETIC',
                      raised: '600000000',
                      balance: null,
                      withdrawn: false,
                      config: { creator: 'GSYNTHETIC', token: 'CSYNTHETIC', goal: '1000000000', deadline: '1894000000' },
                    },
                  ],
                },
              });
            if (path.endsWith('/evidence')) {
              const present = state === 'issuer_claim' || state === 'corrected';
              return route.fulfill({
                json: {
                  evidence: {
                    campaignId: 'demo-solar',
                    state: present ? 'available' : state,
                    revisedOn: present ? '2026-11-25' : null,
                    sources: present
                      ? [
                          {
                            id: 'test-source',
                            title: 'SYNTHETIC SOURCE FOR UI TEST ONLY',
                            url: 'https://example.com',
                            publisher: 'issuer',
                            retrievedOn: '2026-11-25',
                          },
                        ]
                      : [],
                    claims: present
                      ? [
                          {
                            id: 'test-claim',
                            area: 'issuer',
                            text: 'SYNTHETIC CLAIM FOR UI TEST ONLY. Not evidence about this sample campaign.',
                            status: 'issuer_claim',
                            sourceIds: ['test-source'],
                          },
                        ]
                      : [],
                    corrections:
                      state === 'corrected'
                        ? [
                            {
                              id: 'test-correction',
                              claimId: 'test-claim',
                              correctedOn: '2026-11-25',
                              note: 'SYNTHETIC CORRECTION FOR UI TEST ONLY',
                              sourceIds: ['test-source'],
                            },
                          ]
                        : [],
                    unknownAreas: areas,
                  },
                },
              });
            }
            return route.fulfill({ json: { enabled: false, providers: [], comments: [], news: [], reports: [], episodes: [], rewards: [], documents: [] } });
          });
          await page.goto('/campaigns/demo-solar?fixtures=0');
          const section = page.locator('.issuer-evidence');
          await expect(section).toBeVisible();
          await expect(section.locator('[role="status"]')).toHaveCount(state === 'unavailable' ? 1 : 0);
          await expect(section.locator('article')).toHaveCount(state === 'issuer_claim' || state === 'corrected' ? 1 : 0);
          if (state !== 'unavailable') await expect(section.locator('h3').last()).toBeVisible();
          if (state === 'corrected') await expect(section.locator('article section')).toHaveCount(1);
          expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
          if (locale === 'ar') expect(await section.locator('h2').evaluate((element) => getComputedStyle(element).direction)).toBe('rtl');
          await page.evaluate(() => scrollTo(0, 0));
          await page.screenshot({ fullPage: true, path: `test-results/evidence/${locale}-${width}-${theme}-${state}.png` });
        });
