import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mailerFromEnv, LogMailer, AllowlistMailer, BrevoMailer } from '../src/mailer.js';
for (const deployment of [undefined, '', 'production', 'prod', 'live', 'unknown']) {
  test(`log provider refuses ${JSON.stringify(deployment)} without logging message bodies`, () => {
    const lines: string[] = [];
    const old = console.warn;
    console.warn = (...a: unknown[]) => lines.push(a.join(' '));
    try {
      assert.equal(mailerFromEnv({ COMMUNITY_EMAIL_PROVIDER: 'log', DEPLOYMENT_ENV: deployment, NODE_ENV: 'production' }), null);
      assert.ok(lines.every((s) => !s.includes('token-inside')));
    } finally {
      console.warn = old;
    }
  });
}
for (const deployment of ['staging', 'demo', 'development', 'test', ' Staging ']) {
  test(`explicit nonproduction ${deployment} preserves opt-in`, () =>
    assert.ok(mailerFromEnv({ COMMUNITY_EMAIL_PROVIDER: 'log', DEPLOYMENT_ENV: deployment, NODE_ENV: 'production' }) instanceof LogMailer));
}
test('production valid Brevo config remains selected without send', () =>
  assert.ok(
    mailerFromEnv({
      COMMUNITY_EMAIL_PROVIDER: 'brevo',
      DEPLOYMENT_ENV: 'production',
      BREVO_API_KEY: 'synthetic',
      COMMUNITY_EMAIL_FROM: 'sender@example.invalid',
    }) instanceof BrevoMailer,
  ));
test('production missing Brevo config stays failclosed', () =>
  assert.equal(mailerFromEnv({ COMMUNITY_EMAIL_PROVIDER: 'brevo', DEPLOYMENT_ENV: 'production' }), null));
test('explicit staging allowlist preserved', () =>
  assert.ok(
    mailerFromEnv({ COMMUNITY_EMAIL_PROVIDER: 'log', DEPLOYMENT_ENV: 'staging', COMMUNITY_EMAIL_ALLOWED_RECIPIENTS: 'user@example.invalid' }) instanceof
      AllowlistMailer,
  ));
test('production allowlist does not permit log provider', () =>
  assert.equal(
    mailerFromEnv({ COMMUNITY_EMAIL_PROVIDER: 'log', DEPLOYMENT_ENV: 'production', COMMUNITY_EMAIL_ALLOWED_RECIPIENTS: 'user@example.invalid' }),
    null,
  ));

for (const allowed of [undefined, 'synthetic@example.invalid']) {
  test(`current hosted Brevo configuration remains selected with allowlist ${Boolean(allowed)}`, () => {
    const mailer = mailerFromEnv({
      NODE_ENV: 'production',
      COMMUNITY_EMAIL_PROVIDER: 'brevo',
      BREVO_API_KEY: 'synthetic',
      COMMUNITY_EMAIL_FROM: 'synthetic@example.invalid',
      COMMUNITY_EMAIL_ALLOWED_RECIPIENTS: allowed,
    });
    assert.ok(allowed ? mailer instanceof AllowlistMailer : mailer instanceof BrevoMailer);
  });
}
test('NODE_ENV=test cannot override an explicit production deployment', () => {
  assert.equal(mailerFromEnv({ NODE_ENV: 'test', DEPLOYMENT_ENV: 'production', COMMUNITY_EMAIL_PROVIDER: 'log' }), null);
});
