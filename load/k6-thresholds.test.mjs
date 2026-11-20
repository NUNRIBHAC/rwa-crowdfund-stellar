import { URL } from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
for (const name of ['browse-journey', 'contribution-burst', 'refund-storm']) {
  test(`${name} fails on any failed semantic check, for both profiles`, () => {
    const source = readFileSync(new URL(`./k6-${name}.js`, import.meta.url), 'utf8');
    const optionsSource = source
      .slice(source.indexOf('const PROFILES'), source.indexOf('export default'))
      .replace('export const options', 'globalThis.options');
    for (const profile of ['low', 'medium']) {
      const ctx = { __ENV: { K6_PROFILE: profile } };
      vm.runInNewContext(optionsSource, ctx);
      assert.equal(ctx.options.thresholds.checks.join(), 'rate==1');
      assert.ok(ctx.options.vus > 0);
      assert.ok(ctx.options.duration);
    }
  });
}
