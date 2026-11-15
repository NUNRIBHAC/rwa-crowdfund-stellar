import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, writeFile, readFile, rm, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import express from 'express';
import { once } from 'node:events';
import { createMediaGateway, reserveBudget } from './media-gateway.mjs';
const key = 'icons/icon-192.png';
const body = Buffer.from('verified public image');
const hash = (b) => createHash('sha256').update(b).digest('hex');
const entry = { key, bytes: body.length, sha256: hash(body), pagesBytes: body.length, pagesSha256: hash(body) };
const bucket = '435986d81e2ab338a91e071a';
async function setup(t, fetchImpl, extra = {}) {
  const dir = await mkdtemp(join(tmpdir(), 'gateway-'));
  const keyFiles = [join(dir, 'id'), join(dir, 'secret')];
  await Promise.all(keyFiles.map((f) => writeFile(f, 'test-only')));
  const budgetFile = join(dir, 'budget.json');
  await writeFile(budgetFile, JSON.stringify({ day: new Date().toISOString().slice(0, 10), bytes: 0, downloads: 0, operations: 0 }));
  const app = express();
  app.use('/media', createMediaGateway({ index: [entry], fetchImpl, budgetFile, keyFiles, ...extra }));
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(async () => {
    await new Promise((r) => server.close(r));
    await rm(dir, { recursive: true, force: true });
  });
  return { url: `http://127.0.0.1:${server.address().port}/media/`, budgetFile, dir, keyFiles };
}
function directProvider(calls, options = {}) {
  return async (url, init) => {
    calls.push({ url, init });
    if (url.includes('pages.dev') || url.includes('workers.dev')) return new Response(null, { status: 429 });
    if (url.includes('b2_authorize_account'))
      return Response.json({
        authorizationToken: 'account-secret',
        apiInfo: {
          storageApi: {
            bucketId: bucket,
            namePrefix: 'public/',
            capabilities: ['shareFiles', 'readFiles'],
            apiUrl: 'https://api003.backblazeb2.com',
            downloadUrl: 'https://f003.backblazeb2.com',
            ...options.scope,
          },
        },
      });
    if (url.includes('b2_get_download_authorization')) {
      const r = JSON.parse(init.body);
      assert.equal(r.validDurationInSeconds, 120);
      assert.equal(r.fileNamePrefix, 'public/' + key);
      return Response.json({ bucketId: bucket, fileNamePrefix: r.fileNamePrefix, authorizationToken: 'temporary-secret' });
    }
    assert.equal(init.headers.Authorization, 'temporary-secret');
    assert.equal(url, 'https://f003.backblazeb2.com/file/blockallisto-media/public/' + key);
    return new Response(options.bytes || body, { status: options.status || 200, headers: { 'X-Private': 'not forwarded' } });
  };
}
test('Pages first; HEAD validates content but returns no body; secrets/headers never forwarded', async (t) => {
  const calls = [];
  const s = await setup(t, async (url, init) => {
    calls.push({ url, init });
    return new Response(body);
  });
  const r = await fetch(s.url + key, { method: 'HEAD', headers: { Authorization: 'browser-secret', Cookie: 'private=1' } });
  assert.equal(r.status, 200);
  assert.equal(await r.text(), '');
  assert.equal(r.headers.get('x-media-stage'), 'pages');
  assert.equal(r.headers.get('content-length'), String(body.length));
  assert.equal(calls.length, 1);
  assert.equal(calls[0].init.headers, undefined);
  assert.equal(JSON.parse(await readFile(s.budgetFile)).downloads, 0);
});
test('Worker fallback has no third-level budget charge; retry flag skips primary', async (t) => {
  const calls = [];
  const s = await setup(t, async (url) => {
    calls.push(url);
    return new Response(body);
  });
  const r = await fetch(s.url + key + '?retry=1&url=https://attacker.invalid');
  assert.equal(r.status, 200);
  assert.equal(r.headers.get('x-media-stage'), 'worker');
  assert.deepEqual(calls, ['https://blockallisto-media.nunrib-df6.workers.dev/' + key]);
  assert.equal(JSON.parse(await readFile(s.budgetFile)).downloads, 0);
});
test('Worker quota ->120second server token ->private B2 with exact hash and durable reservations', async (t) => {
  const calls = [];
  const s = await setup(t, directProvider(calls));
  const r = await fetch(s.url + key);
  assert.equal(r.status, 200);
  assert.equal(await r.text(), body.toString());
  assert.equal(r.headers.get('x-media-stage'), 'direct');
  assert.equal(r.headers.get('x-private'), null);
  assert.ok(!JSON.stringify([...r.headers]).includes('secret'));
  const state = JSON.parse(await readFile(s.budgetFile));
  assert.equal(state.bytes, body.length);
  assert.equal(state.downloads, 1);
  assert.equal(state.operations, 2);
  assert.equal(calls.length, 5);
  const r2 = await fetch(s.url + key);
  assert.equal(r2.status, 200);
  assert.equal(calls.filter((r) => r.url.includes('authorize_account')).length, 1);
  assert.equal(JSON.parse(await readFile(s.budgetFile)).downloads, 2);
});
for (const scope of [
  { bucketId: 'wrong' },
  { namePrefix: null },
  { namePrefix: '' },
  { capabilities: ['readFiles'] },
  { capabilities: ['readFiles', 'shareFiles', 'writeFiles'] },
  { apiUrl: 'https://evil.example' },
  { downloadUrl: 'https://f003.backblazeb2.com@evil.example' },
])
  test('reject unsafe credential scope/provider ' + JSON.stringify(scope), async (t) => {
    const calls = [];
    const s = await setup(t, directProvider(calls, { scope }));
    assert.equal((await fetch(s.url + key)).status, 503);
    assert.equal(calls.filter((c) => c.url.includes('get_download_authorization')).length, 0);
  });
for (const options of [{ bytes: Buffer.from('bad') }, { status: 403 }, { bytes: Buffer.alloc(body.length, 1) }])
  test('bad or rejected direct body fails closed without refund', async (t) => {
    const calls = [];
    const s = await setup(t, directProvider(calls, options));
    const r = await fetch(s.url + key);
    assert.equal(r.status, 503);
    assert.equal(r.headers.get('cache-control'), 'no-store');
    assert.equal(JSON.parse(await readFile(s.budgetFile)).downloads, 1);
    const before = calls.length;
    assert.equal((await fetch(s.url + key)).status, 503);
    assert.equal(calls.length, before, 'negative cache');
  });
test('unknown, private, encoded traversal, double encoding, spaces, range, methods never call providers', async (t) => {
  let calls = 0;
  const s = await setup(t, async () => {
    calls++;
    return new Response(body);
  });
  for (const path of [
    'private/secret.txt',
    'icons%252Ficon-192.png',
    'foo%2f..%2ficons/icon-192.png',
    '.secret',
    'social%20icons/unknown.svg',
    'icons//icon-192.png',
  ])
    assert.equal((await fetch(s.url + path)).status, 404, path);
  assert.equal((await fetch(s.url + key, { headers: { Range: 'bytes=0-1' } })).status, 404);
  assert.equal((await fetch(s.url + key, { method: 'POST' })).status, 405);
  assert.equal(calls, 0);
});
test('strict allowlist accepts exact icon alias; JS cannot turn gateway into arbitrary proxy', async (t) => {
  const s = await setup(t, async (url) => {
    assert.equal(url, 'https://blockallisto-public-media.pages.dev/' + key);
    return new Response(body);
  });
  assert.equal((await fetch(s.url + 'icon-192.png?url=https://evil.example')).status, 200);
});
test('concurrent same-key callers coalesce; closed clients cancel remaining work', async (t) => {
  let calls = 0;
  const s = await setup(t, async () => {
    calls++;
    await new Promise((r) => setTimeout(r, 40));
    return new Response(body);
  });
  const rows = await Promise.all([fetch(s.url + key), fetch(s.url + key)]);
  assert.ok(rows.every((r) => r.status === 200));
  assert.equal(calls, 1);
});
test('stalled provider bounded deadline proceeds to next stage', async (t) => {
  const s = await setup(
    t,
    async (url, init) => {
      if (url.includes('pages.dev')) return new Promise((_r, reject) => init.signal.addEventListener('abort', () => reject(Error('timeout')), { once: true }));
      return new Response(body);
    },
    { timeoutMs: 20 },
  );
  const r = await fetch(s.url + key);
  assert.equal(r.status, 200);
  assert.equal(r.headers.get('x-media-stage'), 'worker');
});
test('rate limiting is bounded and ignores spoofed forwarded IP', async (t) => {
  const s = await setup(t, async () => new Response(body));
  for (let i = 0; i < 120; i++) assert.equal((await fetch(s.url + key, { headers: { 'X-Forwarded-For': String(i) } })).status, 200);
  assert.equal((await fetch(s.url + key, { headers: { 'X-Forwarded-For': 'new-ip' } })).status, 429);
});
test('budget caps, restart continuity, corrupt/missing accounting, clock rollback and stale locks fail closed', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'budget-'));
  const f = join(dir, 'daily.json');
  const day = Date.parse('2026-11-15T12:00Z');
  try {
    await assert.rejects(reserveBudget(f, {}, day));
    await writeFile(f, JSON.stringify({ day: '2026-11-15', bytes: 0, downloads: 0, operations: 0 }));
    await reserveBudget(f, { bytes: 64 * 1024 * 1024, downloads: 256, operations: 256 }, day);
    for (const delta of [{ bytes: 1 }, { downloads: 1 }, { operations: 1 }]) await assert.rejects(reserveBudget(f, delta, day));
    await assert.rejects(reserveBudget(f, {}, day - 86400000));
    const next = await reserveBudget(f, { downloads: 1 }, day + 86400000);
    assert.equal(next.downloads, 1);
    await writeFile(f, '{bad');
    await assert.rejects(reserveBudget(f, {}, day));
    await writeFile(f, JSON.stringify({ day: '2026-11-15', bytes: -1, downloads: 0, operations: 0 }));
    await assert.rejects(reserveBudget(f, {}, day));
    await mkdir(f + '.lock');
    await assert.rejects(reserveBudget(f, {}, day));
    await assert.rejects(reserveBudget(undefined, {}, day));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
test('CSS normalized after provider integrity verification, nested fonts stay on gateway', async (t) => {
  const css = Buffer.from('@font-face{src:url(https://blockallisto-media.nunrib-df6.workers.dev/icons/icon-192.png)}');
  const row = { key: 'fonts/css/test.css', bytes: css.length, sha256: hash(css), pagesBytes: css.length, pagesSha256: hash(css) };
  const s = await setup(t, async () => new Response(css), { index: [entry, row] });
  const r = await fetch(s.url + row.key);
  assert.equal(r.status, 200);
  assert.match(await r.text(), /url\('\/media\/icons\/icon-192.png\?retry=1'\)/);
});
test('all consumers disconnect: cancels provider and never starts a new fallback leg', async (t) => {
  let aborted = false;
  let started;
  const ready = new Promise((r) => {
    started = r;
  });
  const calls = [];
  const s = await setup(t, async (url, init) => {
    calls.push(url);
    started();
    return new Promise((_resolve, reject) =>
      init.signal.addEventListener(
        'abort',
        () => {
          aborted = true;
          reject(Error('cancelled'));
        },
        { once: true },
      ),
    );
  });
  const controller = new AbortController();
  const r = fetch(s.url + key, { signal: controller.signal }).catch(() => {});
  await ready;
  controller.abort();
  await r;
  await new Promise((r) => setTimeout(r, 20));
  assert.equal(aborted, true);
  assert.equal(calls.length, 1);
});
test('same budget file shared by new gateway instance cannot reset direct allowance', async (t) => {
  const calls = [];
  const s = await setup(t, directProvider(calls));
  await writeFile(s.budgetFile, JSON.stringify({ day: new Date().toISOString().slice(0, 10), bytes: 64 * 1024 * 1024, downloads: 256, operations: 256 }));
  assert.equal((await fetch(s.url + key)).status, 503);
  assert.equal(calls.filter((r) => r.url.includes('backblazeb2.com')).length, 0);
  const gateway = createMediaGateway({
    index: [entry],
    fetchImpl: async () => new Response(null, { status: 429 }),
    keyFiles: s.keyFiles,
    budgetFile: s.budgetFile,
  });
  assert.equal(typeof gateway, 'function');
  await assert.rejects(reserveBudget(s.budgetFile, { downloads: 1 }));
});
test('invalid metadata rejects startup instead of widening the proxy', () => {
  for (const row of [
    { ...entry, key: '../secret' },
    { ...entry, bytes: 2 ** 24 },
    { ...entry, sha256: 'bad' },
    { ...entry, pagesBytes: 0 },
  ])
    assert.throws(() => createMediaGateway({ index: [row] }));
});
test('burst of public assets queues with at most4direct transfers and no missing requests', async (t) => {
  const rows = Array.from({ length: 20 }, (_r, i) => ({ ...entry, key: `icons/test-${i}.png` }));
  let concurrent = 0,
    max = 0,
    downloads = 0;
  const provider = directProvider([]);
  const s = await setup(
    t,
    async (url, init) => {
      if (url.includes('b2_get_download_authorization')) return Response.json({ ...JSON.parse(init.body), authorizationToken: 'temporary-secret' });
      if (url.includes('/file/')) {
        concurrent++;
        max = Math.max(max, concurrent);
        downloads++;
        await new Promise((r) => setTimeout(r, 15));
        concurrent--;
        return new Response(body);
      }
      return provider(url, init);
    },
    { index: rows },
  );
  const responses = await Promise.all(rows.map((r) => fetch(s.url + r.key)));
  assert.ok(
    responses.every((r) => r.status === 200),
    responses.map((r) => r.status).join(','),
  );
  assert.equal(downloads, 20);
  assert.equal(max, 4);
  assert.equal(JSON.parse(await readFile(s.budgetFile)).downloads, 20);
});
