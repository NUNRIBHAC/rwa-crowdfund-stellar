import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assertAllowedTarget } from './target-guard.mjs';

test('loopback targets need no opt-in', () => {
  for (const u of ['http://127.0.0.1:4000', 'http://localhost:4000', 'http://[::1]:4000']) {
    assert.equal(assertAllowedTarget(u, {}).hostname.length > 0, true);
  }
});

test('a remote target without the opt-in is refused', () => {
  assert.throws(() => assertAllowedTarget('https://staging.example.com', {}), /refusing non-loopback/);
  assert.throws(() => assertAllowedTarget('https://staging.example.com', { optIn: 'yes' }), /refusing non-loopback/);
});

test('a remote target needs the opt-in AND the allowlist entry', () => {
  assert.throws(() => assertAllowedTarget('https://staging.example.com', { optIn: '1' }), /not in the allowlist/);
  assert.throws(() => assertAllowedTarget('https://staging.example.com', { optIn: '1', allowlist: 'other.example.com' }), /not in the allowlist/);
  const url = assertAllowedTarget('https://staging.example.com', { optIn: '1', allowlist: 'staging.example.com, other.example.com' });
  assert.equal(url.hostname, 'staging.example.com');
});

test('unparseable targets are refused', () => {
  assert.throws(() => assertAllowedTarget('not a url', {}), /unparseable/);
});
