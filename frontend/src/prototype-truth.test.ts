/// <reference types="node" />
// @vitest-environment node
import { expect, test } from 'vitest';
import { readFileSync } from 'node:fs';
import { en } from './i18n/locales/en';
import { blocks as privacy } from './i18n/legal/privacyPolicy.en';
import { blocks as notice } from './i18n/legal/legalNotice.en';

const text = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(text).join('');
  if (value && typeof value === 'object') return Object.values(value).map(text).join('');
  return '';
};
const source = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('fee copy separates escrow accounting, network charges and an unpublished commercial schedule', () => {
  expect(en.contributionTerms.fees).toMatch(/full contribution into escrow without a platform-fee deduction/);
  expect(en.contributionTerms.fees).toMatch(/Network fees in XLM are separate/);
  expect(en.contributionTerms.fees).toMatch(/real platform fee schedule is not published/);
  expect(en.contributionPreview.fees).toMatch(/full contribution counts toward the target/);
  expect(en.contributionPreview.fees).toMatch(/shown before signing/);
  expect(en.contributionPreview.outcomes).toMatch(/Refunds are not automatic/);
});

test('project, responsible-person and legal-template disclosures cannot stand in for authorisation', () => {
  expect(en.about.p2).toMatch(/not a company, not an authorised crowdfunding service provider/);
  expect(text(privacy)).toContain('Nuno Ribeiro is the data controller');
  expect(text(privacy)).toContain('blockallisto@gmail.com');
  expect(text(privacy)).toContain('not a claim of a registered company');
  expect(text(notice)).toContain('not evidence of any company registration or regulatory authorisation');
  expect(text(notice)).toContain('not been reviewed by a lawyer');
});

test('security self-review remains distinct from an independent audit', () => {
  const review = source('../../docs/security/crowdfund-v1-self-review-2026-11-01.md');
  expect(review).toMatch(/NOT an audit/);
  expect(review).toMatch(/NOT a substitute for one/);
  expect(source('./i18n/locales/en.ts')).toMatch(/not audited and must not be used with real funds/);
});

test('payment infrastructure stays simulation-only while no live-provider terms exist', () => {
  const service = source('../../backend/src/infrastructure/service.ts');
  const server = source('../../backend/src/infrastructure/server.ts');
  expect(service).toContain("mode: 'test_only'");
  expect(service).toContain("adapter.mode !== 'test_only'");
  expect(server).toContain("process.env.INFRA_MODE !== 'test_only'");
});
