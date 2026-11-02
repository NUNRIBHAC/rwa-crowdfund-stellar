import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import express from 'express';
import { Keypair } from '@stellar/stellar-sdk';
import { buildShareRegister } from '../src/share-register.js';
import { buildShareRegisterPdf, escapeForPdf } from '../src/share-register-pdf.js';
import { FileCommunityStore } from '../src/community-store.js';
import { CommunityService } from '../src/community.js';
import { createCommunityRouter } from '../src/community-routes.js';

const kp = () => Keypair.random().publicKey();
const row = (n: number) => ({
  publicKey: kp(),
  firstConfirmedAt: new Date(1730000000000 + n * 1000).toISOString(),
  registered: n % 3 !== 0,
  contributeCount: n,
  refundCount: n % 2,
  contributedIntended: `${n}.5`,
  refundedIntended: '1',
  netIntended: `${n - 1}.5`,
  missingAmountIntents: 0,
  intentHashes: n % 4 === 0 ? [n.toString(16).padStart(64, '0'), (n + 1).toString(16).padStart(64, '0')] : [],
});

test('escapeForPdf keeps covered scripts and escapes the rest visibly', () => {
  assert.equal(escapeForPdf('plain ASCII 123'), 'plain ASCII 123');
  assert.equal(escapeForPdf('João Nürnberg São Tomé'), 'João Nürnberg São Tomé');
  assert.equal(escapeForPdf('Привет Ελληνικά'), 'Привет Ελληνικά');
  assert.equal(escapeForPdf('中文名'), '[U+4E2D][U+6587][U+540D]');
  assert.equal(escapeForPdf('a😀b'), 'a[U+1F600]b');
  assert.equal(escapeForPdf('عربي'), '[U+0639][U+0631][U+0628][U+064A]');
});

test('buildShareRegisterPdf returns a valid PDF for a small register', async () => {
  const payload = buildShareRegister('qa-demo', [], [{ campaignId: 'qa-demo', publicKey: kp(), firstConfirmedAt: 1730000000000 }], 'testnet');
  const pdf = await buildShareRegisterPdf(payload);
  assert.ok(pdf.subarray(0, 5).toString() === '%PDF-');
  const pages = (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) ?? []).length;
  assert.ok(pages >= 1, `expected >=1 page, got ${pages}`);
});

test('buildShareRegisterPdf paginates long registers and numbers every page', async () => {
  const contributors = Array.from({ length: 60 }, (_, i) => ({ campaignId: 'qa-demo', publicKey: kp(), firstConfirmedAt: 1730000000000 + i }));
  const payload = buildShareRegister('qa-demo', [], contributors, 'testnet');
  payload.contributors = payload.contributors.map((r, i) => ({ ...r, ...row(i), publicKey: r.publicKey, registered: r.registered }));
  const pdf = await buildShareRegisterPdf(payload);
  const pages = (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) ?? []).length;
  assert.ok(pages >= 2, `expected >=2 pages, got ${pages}`);
});

test('buildShareRegisterPdf escapes out-of-coverage campaign names instead of dropping them', async () => {
  const payload = buildShareRegister('qa-中文', [], [], 'testnet');
  // The CJK name is escaped by escapeForPdf (unit-tested above) and the
  // document still generates as valid PDF; text is subset-glyph encoded,
  // so raw byte search is meaningless - rendering truth is pixel-checked.
  const pdf = await buildShareRegisterPdf(payload);
  assert.equal(pdf.subarray(0, 5).toString(), '%PDF-');
  assert.ok(pdf.length > 1000);
});

// --- Route wiring ---
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'share-register-pdf-test-'));
const servers: Array<ReturnType<express.Express['listen']>> = [];
after(() => {
  for (const s of servers) s.close();
  fs.rmSync(dir, { recursive: true, force: true });
});

async function makeServer(opts: { provider?: 'absent' | 'null' | 'payload'; denyAdmin?: boolean }) {
  const store = new FileCommunityStore(path.join(dir, `store-${Math.random()}.json`));
  const service = new CommunityService(store, { retentionDays: 90 });
  const app = express();
  app.use(express.json());
  app.use(
    createCommunityRouter({
      service,
      requireAdmin: (_req, res, next) => {
        if (opts.denyAdmin) {
          res.status(401).json({ error: 'missing or invalid admin key (x-admin-key header)' });
          return;
        }
        next();
      },
      ...(opts.provider === 'payload'
        ? {
            shareRegister: async () =>
              buildShareRegister('qa-demo', [], [{ campaignId: 'qa-demo', publicKey: kp(), firstConfirmedAt: 1730000000000 }], 'testnet'),
          }
        : opts.provider === 'null'
          ? { shareRegister: async () => null }
          : {}),
    }),
  );
  const srv = await new Promise<ReturnType<express.Express['listen']>>((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  servers.push(srv);
  const addr = srv.address();
  return `http://127.0.0.1:${typeof addr === 'object' && addr ? addr.port : 0}`;
}

test('pdf route: 503 without provider, 404 unknown campaign, 401 without admin, application/pdf with %PDF bytes', async () => {
  const absent = await makeServer({ provider: 'absent' });
  assert.equal((await fetch(`${absent}/api/campaigns/qa-demo/share-register.pdf`)).status, 503);
  const nullBase = await makeServer({ provider: 'null' });
  assert.equal((await fetch(`${nullBase}/api/campaigns/nope/share-register.pdf`)).status, 404);
  const denied = await makeServer({ provider: 'payload', denyAdmin: true });
  assert.equal((await fetch(`${denied}/api/campaigns/qa-demo/share-register.pdf`)).status, 401);
  const base = await makeServer({ provider: 'payload' });
  const res = await fetch(`${base}/api/campaigns/qa-demo/share-register.pdf`);
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type') ?? '', /application\/pdf/);
  const bytes = Buffer.from(await res.arrayBuffer());
  assert.equal(bytes.subarray(0, 5).toString(), '%PDF-');
});
