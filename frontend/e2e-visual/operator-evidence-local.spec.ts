import { test, expect } from './fixtures';
import { VISUAL_LOCALES, VISUAL_WIDTHS } from './inventory';
import { readFileSync } from 'node:fs';
const catalog = (locale: string) => JSON.parse(readFileSync(`i18n-json/ui/${locale}.json`, 'utf8'));
const fixture = () => ({
  campaignId: 'synthetic',
  revision: 'a'.repeat(64),
  state: 'available',
  revisedOn: '2026-11-25',
  sources: [
    {
      id: 'source',
      title: 'SYNTHETIC independent registry source 2026. مثال عربي طويل مع English mixed content.',
      url: 'https://example.org/fact',
      publisher: 'independent',
      retrievedOn: '2026-11-25',
    },
  ],
  claims: [
    {
      id: 'claim',
      area: 'issuer',
      text: 'SYNTHETIC fact for local UI tests only. English and العربية with a long mixed-direction statement, never an actual issuer attestation.',
      status: 'checked_fact',
      sourceIds: ['source'],
      review: { checkedOn: '2026-11-25', note: 'SYNTHETIC human-review fixture only, not real evidence.' },
    },
  ],
  corrections: [
    { id: 'correction', claimId: 'claim', correctedOn: '2026-11-25', note: 'SYNTHETIC correction requiring human re-review.', sourceIds: ['source'] },
  ],
  unknownAreas: ['team', 'track_record', 'financials', 'offer_documents', 'milestones'],
});
for (const locale of VISUAL_LOCALES)
  for (const width of VISUAL_WIDTHS)
    for (const theme of ['light', 'dark'])
      for (const state of ['edit', 'preview', 'error', 'saved'])
        test(`editor/${locale}/${width}/${theme}/${state}`, async ({ page }) => {
          const copy = catalog(locale);
          let evidence = fixture();
          let posts = 0;
          await page.setViewportSize({ width, height: 900 });
          await page.addInitScript(
            ({ locale, theme }) => {
              localStorage.setItem('blockallisto-language', locale);
              localStorage.setItem('blockallisto-theme', theme);
              localStorage.setItem('blockallisto-community-token', 'synthetic-local-session');
            },
            { locale, theme },
          );
          const errors: string[] = [];
          page.on('pageerror', (e) => errors.push(e.message));

          await page.route('**/api/**', async (route) => {
            const path = new URL(route.request().url()).pathname;
            if (path === '/api/auth/me')
              return route.fulfill({
                json: {
                  account: { publicKey: 'GSYNTHETIC', authMethod: 'wallet', linkedProviders: [], linkedAuthMethods: [], displayName: 'SYNTHETIC OPERATOR' },
                  isOperator: true,
                },
              });
            if (path === '/api/auth/demo-onboarding')
              return route.fulfill({
                json: {
                  progress: { identity: 'not_started', risksAcknowledged: false, updatedAt: 0 },
                  assessmentSaved: false,
                  assessmentCurrent: false,
                  warningReady: false,
                  eligibility: 'demo_incomplete',
                  demo: true,
                  realInvestmentEligible: false,
                  realIdentityVerified: false,
                },
              });
            if (path === '/api/campaigns')
              return route.fulfill({
                json: {
                  campaigns: [
                    {
                      id: 'synthetic',
                      name: 'SYNTHETIC LOCAL UI CAMPAIGN',
                      contractId: 'CSYNTHETIC',
                      raised: '0',
                      balance: null,
                      withdrawn: false,
                      config: { creator: 'GSYNTHETIC', token: 'CSYNTHETIC', goal: '1000000000', deadline: '1894000000' },
                    },
                  ],
                },
              });
            if (path.endsWith('/evidence')) {
              if (route.request().method() === 'POST') {
                posts++;
                if (state === 'error') return route.fulfill({ status: 409, json: { error: 'SYNTHETIC RAW SERVER TEXT MUST NOT DISPLAY' } });
                evidence = { ...evidence, revision: 'b'.repeat(64) };
                return route.fulfill({ json: { revision: evidence.revision } });
              }
              return route.fulfill({ json: { evidence } });
            }
            return route.fulfill({
              json: {
                enabled: false,
                completed: [],
                business: { contribution: null },
                investor: { contribution: null },
                nextAction: null,
                sessions: [],
                socialProviders: [],
                applications: [],
                comments: [],
                tickets: [],
                audit: [],
                news: [],
                reports: [],
                episodes: [],
                rewards: [],
                documents: [],
                activity: [],
                companies: [],
                notifications: [],
                holdings: [],
                rows: [],
              },
            });
          });
          await page.goto('/account?fixtures=0');
          const tab = page.getByRole('button', { name: copy.issuerEvidence.title, exact: true });
          await expect(tab).toBeVisible();
          await tab.click();
          const editor = page.locator('.evidence-editor');
          await expect(editor).toBeVisible();
          await editor.locator('select').nth(0).selectOption('synthetic');
          await editor.locator('select').nth(1).selectOption('claim');
          await editor.locator('select').nth(2).selectOption('review');
          await editor.locator('textarea').nth(0).fill('SYNTHETIC public review note only. العربية with English and 2026-11-25.');
          await editor.locator('textarea').nth(1).fill('SYNTHETIC replacement fact. Not an actual attestation. العربية English 2026-11-25.');
          await editor.locator('input[type=checkbox]').nth(0).check();
          await editor.locator('input[type=checkbox]').nth(1).check();
          await editor.locator('input:not([type])').fill('SYNTHETIC independent public-source fixture, العربية and English long text');
          await editor.locator('input[type=url]').fill('https://example.org/synthetic-long-public-source-for-local-only-verification');
          await editor.locator('input[type=checkbox]').last().check();
          if (state !== 'edit') {
            await editor.getByRole('button', { name: copy.evidenceEditor.preview, exact: true }).click();
            await expect(editor.getByRole('button', { name: copy.evidenceEditor.publish, exact: true })).toBeVisible();
          }
          if (state === 'error' || state === 'saved') {
            await editor.getByRole('button', { name: copy.evidenceEditor.publish, exact: true }).click();
            await expect(editor.getByText(state === 'error' ? copy.evidenceEditor.failed : copy.evidenceEditor.saved, { exact: false })).toBeVisible();
            expect(posts).toBe(1);
          } else expect(posts).toBe(0);
          await expect(page.getByText('SYNTHETIC RAW SERVER TEXT MUST NOT DISPLAY')).toHaveCount(0);
          expect(errors).toEqual([]);
          expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
          await page.evaluate(() => scrollTo(0, 0));
          await page.screenshot({ fullPage: true, path: `test-results/editor/${locale}-${width}-${theme}-${state}.png` });
          await editor.screenshot({ path: `test-results/editor/${locale}-${width}-${theme}-${state}-editor.png` });
        });
