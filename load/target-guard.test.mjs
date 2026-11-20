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

// The k6 scenarios import this exact module (pure ESM, no node APIs); these
// tests cover the shipped k6 code path.
import { assertK6Target, parseAllowlist, parseTargetAuthority } from './target-guard-k6.js';

test('k6 guard: loopback userinfo does not mask a remote destination', () => {
  // http://localhost:4000@evil.example - "localhost" is the username, the
  // real destination is evil.example. Must refuse even with the opt-in set,
  // because credentials are never allowed in a target URL.
  assert.throws(() => assertK6Target('http://localhost:4000@evil.example', { K6_ALLOW_REMOTE: '1', K6_TARGET_ALLOWLIST: 'evil.example' }), /credentials/);
  assert.throws(() => assertK6Target('http://localhost@127.0.0.1:4000', {}), /credentials/);
  assert.equal(parseTargetAuthority('http://localhost:4000').host, 'localhost');
  assert.deepEqual(parseTargetAuthority('http://[::1]:4000/'), { host: '[::1]', port: ':4000' });
});

test('k6 guard: remote targets need opt-in plus allowlisted host', () => {
  assert.throws(() => assertK6Target('http://staging.example.com', {}), /refusing non-loopback/);
  assert.throws(() => assertK6Target('http://staging.example.com', { K6_ALLOW_REMOTE: '1' }), /refusing non-loopback/);
  assert.throws(
    () => assertK6Target('http://evil.example', { K6_ALLOW_REMOTE: '1', K6_TARGET_ALLOWLIST: 'staging.example.com' }),
    /not in the allowlist|refusing/,
  );
  assert.doesNotThrow(() => assertK6Target('http://staging.example.com', { K6_ALLOW_REMOTE: '1', K6_TARGET_ALLOWLIST: 'staging.example.com' }));
  assert.doesNotThrow(() => assertK6Target('http://staging.example.com:8443', { K6_ALLOW_REMOTE: '1', K6_TARGET_ALLOWLIST: 'staging.example.com:8443' }));
  assert.doesNotThrow(() => assertK6Target('http://127.0.0.1:4000', {}));
});

test('k6 guard: every allowlist entry is validated before the decision', () => {
  assert.throws(() => parseAllowlist('ok.example, https://sneaky.example'), /malformed allowlist entry/);
  assert.throws(() => assertK6Target('http://a.example', { K6_ALLOW_REMOTE: '1', K6_TARGET_ALLOWLIST: 'a.example,bad entry!' }), /malformed allowlist entry/);
  assert.deepEqual(parseAllowlist('a.example, b.example:443 ,'), ['a.example', 'b.example:443']);
});

test('node guard: userinfo is refused even for real loopback destinations', () => {
  assert.throws(() => assertAllowedTarget('http://user:pass@127.0.0.1:4000', { optIn: '1' }), /credentials/);
});
