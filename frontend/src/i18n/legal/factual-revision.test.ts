/// <reference types="node" />
// @vitest-environment node
import { expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
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
    expect(data.businessContinuity.b01.p, file).toContain('2026-11-20');
    expect(data.businessContinuity.b04.ul.i01, file).toContain('PostgreSQL 17');
    expect(data.businessContinuity.b04.ul.i01, file).not.toMatch(/Render|Neon/);
    expect(data.businessContinuity.b04.ul.i02, file).toContain('2026');
    expect(data.businessContinuity.b04.ul.i02, file).not.toContain('[');
  }
});
