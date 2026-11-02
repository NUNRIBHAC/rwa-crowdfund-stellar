import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { AllowlistMailer, BrevoMailer, MailerError, allowedRecipientsFromEnv, mailerFromEnv, type Mailer } from '../src/mailer.js';

test('mailerFromEnv: unset/unknown/log and half-configured brevo fail closed', () => {
  assert.equal(mailerFromEnv({} as NodeJS.ProcessEnv), null);
  assert.equal(mailerFromEnv({ COMMUNITY_EMAIL_PROVIDER: 'carrier-pigeon' } as NodeJS.ProcessEnv), null);
  assert.ok(mailerFromEnv({ COMMUNITY_EMAIL_PROVIDER: 'log' } as NodeJS.ProcessEnv));
  // brevo without key or sender must not produce a mailer (503 at routes).
  assert.equal(mailerFromEnv({ COMMUNITY_EMAIL_PROVIDER: 'brevo' } as NodeJS.ProcessEnv), null);
  assert.equal(mailerFromEnv({ COMMUNITY_EMAIL_PROVIDER: 'brevo', BREVO_API_KEY: 'k' } as NodeJS.ProcessEnv), null);
  assert.ok(
    mailerFromEnv({
      COMMUNITY_EMAIL_PROVIDER: 'brevo',
      BREVO_API_KEY: 'k',
      COMMUNITY_EMAIL_FROM: 'demo@example.com',
    } as NodeJS.ProcessEnv),
  );
});

test('BrevoMailer posts the documented v3 payload and surfaces failures', async () => {
  const seen: { auth: string | undefined; body: any }[] = [];
  const server = http.createServer((req, res) => {
    let raw = '';
    req.on('data', (c) => (raw += c));
    req.on('end', () => {
      seen.push({ auth: req.headers['api-key'] as string | undefined, body: JSON.parse(raw) });
      if (seen.length === 1) {
        res.writeHead(201, { 'content-type': 'application/json' });
        res.end('{"messageId":"<1@example.com>"}');
      } else {
        res.writeHead(400, { 'content-type': 'application/json' });
        res.end('{"code":"invalid_parameter","message":"bad sender"}');
      }
    });
  });
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  try {
    const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/v3/smtp/email`;
    const mailer = new BrevoMailer('test-api-key', 'demo@example.com', url);
    await mailer.send({ to: 'user@example.org', subject: 'Verify', text: 'token inside' });
    assert.equal(seen[0].auth, 'test-api-key');
    assert.deepEqual(seen[0].body, {
      sender: { email: 'demo@example.com' },
      to: [{ email: 'user@example.org' }],
      subject: 'Verify',
      textContent: 'token inside',
    });
    await assert.rejects(() => mailer.send({ to: 'user@example.org', subject: 'x', text: 'y' }), /rejected the send \(400\)/);
  } finally {
    server.close();
  }
});

test('allowlist guard: non-listed recipients never reach the provider, listed ones do', async () => {
  const sent: string[] = [];
  const inner: Mailer = {
    async send(m) {
      sent.push(m.to);
    },
  };
  const mailer = new AllowlistMailer(inner, new Set(['nunrib@sapo.pt']));
  await assert.rejects(
    () => mailer.send({ to: 'visitor@example.com', subject: 'x', text: 'y' }),
    (e: unknown) => {
      assert.ok(e instanceof MailerError);
      assert.equal(e.status, 503);
      assert.equal(e.code, 'email_recipient_restricted');
      return true;
    },
  );
  assert.deepEqual(sent, []); // provider never called for a blocked recipient
  await mailer.send({ to: ' Nunrib@SAPO.pt ', subject: 'x', text: 'y' }); // normalized
  assert.equal(sent.length, 1);
});

test('mailerFromEnv wraps any configured provider with the allowlist when set', () => {
  const base = { COMMUNITY_EMAIL_PROVIDER: 'log' };
  const unrestricted = mailerFromEnv({ ...base });
  assert.ok(unrestricted);
  assert.ok(!(unrestricted instanceof AllowlistMailer));
  const guarded = mailerFromEnv({ ...base, COMMUNITY_EMAIL_ALLOWED_RECIPIENTS: 'nunrib@sapo.pt' });
  assert.ok(guarded instanceof AllowlistMailer);
  assert.equal(allowedRecipientsFromEnv({}), null);
  assert.equal(allowedRecipientsFromEnv({ COMMUNITY_EMAIL_ALLOWED_RECIPIENTS: ' , ' }), null);
  assert.deepEqual([...allowedRecipientsFromEnv({ COMMUNITY_EMAIL_ALLOWED_RECIPIENTS: 'A@b.c, D@e.f' })!], ['a@b.c', 'd@e.f']);
});
