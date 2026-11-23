import { expect, test } from 'vitest';
import { en } from '../i18n/locales/en';
import { SAMPLE_CATALOG } from './sampleCatalog';
import { SAMPLE_YIELD_TERMS } from './yield-calculator-instruments';
test('all44catalog identities have exactly one explicit sample yield mapping', () => {
  expect(SAMPLE_CATALOG).toHaveLength(44);
  expect(SAMPLE_YIELD_TERMS).toHaveLength(44);
  expect(new Set(SAMPLE_YIELD_TERMS.map((x) => x.campaignId)).size).toBe(44);
});
test.each(SAMPLE_YIELD_TERMS)('$campaignId agrees with existing English sample profile', (terms) => {
  const p = en.profiles.list.find((p) => p.campaignId === terms.campaignId)!;
  expect(p).toBeDefined();
  if (terms.annualRatePct !== null) {
    const displayed = Number(p.interestRate.match(/[\d.]+/)![0]);
    expect(terms.annualRatePct).toBe(displayed);
  } else {
    expect(p.interestRate).not.toMatch(/^[\d.]+%/);
  }
});
test('variable equity, donations and zero-coupon products never acquire a fixed coupon', () => {
  for (const campaign of SAMPLE_CATALOG) {
    const t = SAMPLE_YIELD_TERMS.find((x) => x.campaignId === campaign.id)!;
    if (
      ['share', 'donation', 'reward', 'pre-sale', 'revenue-linked-loan', 'warrant'].includes(campaign.instrument) ||
      (campaign.overlays as readonly string[]).includes('zero-coupon')
    ) {
      expect(t.annualRatePct).toBeNull();
    }
  }
});
