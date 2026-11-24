/// <reference types="node" />
// @vitest-environment node
import { expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { legalRevisionFor, HOSTING_CONFIGURATION_VERIFIED_ON, DATABASE_RESTORE_PROOF_ON } from '../../pages/legalMeta';
const dir = fileURLToPath(new URL('../../../i18n-json/legal/', import.meta.url));
it('all legal locales describe current session and hosting facts without a backup retention promise', () => {
  const files = readdirSync(dir).filter((f) => f.endsWith('.json'));
  expect(files).toHaveLength(11);
  for (const file of files) {
    const data = JSON.parse(readFileSync(`${dir}/${file}`, 'utf8'));
    expect(data.privacyPolicy.b06.p, file).toContain('HttpOnly');
    expect(data.privacyPolicy.b07.p, file).toContain('DELETE');
    expect(data.privacyPolicy.b13.p, file).toMatch(/Oracle[ -]Cloud/);
    expect(data.privacyPolicy.b13.p, file).not.toMatch(/Render|Neon/);
    expect(data.businessContinuity.b01.p, file).toContain(file === 'en.json' ? '2026-11-24' : '2026-11-20');
    expect(data.businessContinuity.b04.ul.i01, file).toContain('PostgreSQL 17');
    expect(data.businessContinuity.b04.ul.i01, file).not.toMatch(/Render|Neon/);
    expect(data.businessContinuity.b04.ul.i02, file).toContain('2026');
    expect(data.businessContinuity.b04.ul.i02, file).not.toContain('[');
  }
});

it('separates the copy revision from historical configuration and restore evidence', () => {
  const data = JSON.parse(readFileSync(`${dir}/en.json`, 'utf8'));
  expect(legalRevisionFor('privacyPolicy')).toBe('2026-11-24');
  expect(legalRevisionFor('businessContinuity')).toBe('2026-11-24');
  expect(legalRevisionFor('termsOfService')).toBe('');
  expect(data.businessContinuity.b01.p).toContain(legalRevisionFor('businessContinuity'));
  expect(data.privacyPolicy.b00.notice).toContain('24 November 2026');
  expect(HOSTING_CONFIGURATION_VERIFIED_ON).toBe('2026-11-19');
  expect(DATABASE_RESTORE_PROOF_ON).toBe('2026-11-20');
  expect(data.privacyPolicy.b13.p).toContain('On 19 November 2026');
  expect(data.businessContinuity.b04.ul.i02).toContain('not proof of a later successful backup');
  const meta = readFileSync(new URL('../../pages/legalMeta.ts', import.meta.url), 'utf8');
  expect(meta).not.toMatch(/NEON_REGION|LEGAL_LAST_UPDATED|2026-10-31/);
});
