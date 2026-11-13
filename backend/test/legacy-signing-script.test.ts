import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
test('legacy helper stops before any filesystem credential, API or signing access', () => {
  const script = new URL('../scripts/test-build-submit.mjs', import.meta.url);
  const preload = `globalThis.fetch=()=>{throw new Error('NETWORK_MUST_NOT_RUN')}; await import(${JSON.stringify(script.href)});`;
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', preload], {
    encoding: 'utf8',
    env: { ...process.env, API_URL: 'https://untrusted.invalid' },
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Disabled: legacy classic/);
  assert.doesNotMatch(result.stderr, /NETWORK_MUST_NOT_RUN|ENOENT|does not exist/);
  const source = readFileSync(script, 'utf8');
  assert.doesNotMatch(source, /fromSecret|\.sign\(|readFileSync|fetch\(/);
});
