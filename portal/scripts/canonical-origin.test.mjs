import { URL } from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
test('canonical origin follows the audience without changing route visibility', () => {
  const source = readFileSync(new URL('../docusaurus.config.ts', import.meta.url), 'utf8');
  const expression = source.match(/url: (.+),/)[1];
  for (const [isInternal, host] of [
    [false, 'p01--public-docs--844r2xx6zwcs.code.run'],
    [true, 'p01--private-docs--844r2xx6zwcs.code.run'],
  ]) {
    const origin = vm.runInNewContext(expression, { isInternal });
    assert.equal(new URL(origin).hostname, host);
    assert.equal(new URL(origin).protocol, 'https:');
  }
  assert.ok(source.includes("DOCS_AUDIENCE === 'internal'"));
});
