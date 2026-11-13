import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createServer } from 'node:net';
import { once } from 'node:events';

// Run the actual production entry point, not an Express facsimile. This dedicated
// integration runs after both builds in CI, matching Docker runtime ordering.
test('production host serves SPA, built assets and discovery without weakening API JSON failures', { timeout: 30000 }, async () => {
  const dir = await mkdtemp(join(tmpdir(), 'production-host-'));
  await writeFile(join(dir, 'test.svg'), '<svg xmlns="http://www.w3.org/2000/svg"/>');
  await writeFile(join(dir, '.secret'), 'must not serve');
  const reserve = createServer();
  reserve.listen(0, '127.0.0.1');
  await once(reserve, 'listening');
  const port = (reserve.address() as { port: number }).port;
  await new Promise<void>((done) => reserve.close(() => done()));
  const cwd = resolve(import.meta.dirname, '../..');
  const child = spawn(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      `const { createCommunityTestDirectory } = await import('./backend/dist/test-storage-guard.js'); const root = createCommunityTestDirectory(); process.env.COMMUNITY_STORE_PATH = root + '/store.json'; console.log('COMMUNITY_TEST_ROOT=' + root); await import('./backend/scripts/host.mjs');`,
    ],
    {
      cwd,
      env: {
        ...process.env,
        NODE_ENV: 'test',
        HOST: '127.0.0.1',
        PORT: String(port),
        PUBLIC_MEDIA_DIR: dir,
        COMMUNITY_STORE_PATH: join(dir, 'store.json'),
        COMMUNITY_APPLICATION_UPLOAD_MODE: 'legacy-inline',
        COMMUNITY_PRIVATE_UPLOAD_ENABLED: '0',
        COMMUNITY_PRIVATE_CLEANUP_ENABLED: '0',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );
  let output = '';
  child.stdout.on('data', (data) => {
    output += String(data);
  });
  child.stderr.on('data', () => {});
  const base = `http://127.0.0.1:${port}`;
  try {
    const deadline = Date.now() + 15000;
    while (!output.includes(`host on ${port}`)) {
      assert.equal(child.exitCode, null, 'production host exited before ready');
      assert.ok(Date.now() < deadline, 'production host readiness timeout');
      await new Promise((done) => setTimeout(done, 20));
    }
    const media = await fetch(base + '/media/test.svg');
    assert.equal(media.status, 200);
    assert.match(media.headers.get('content-type') ?? '', /image\/svg/);
    assert.match(media.headers.get('cache-control') ?? '', /max-age=86400/);
    for (const invalid of ['/media/not-present.svg', '/media/missing-path', '/media/.secret']) {
      const response = await fetch(base + invalid);
      assert.notEqual(response.status, 200, invalid);
      assert.ok(!(await response.text()).includes('<div id="root">'), invalid);
    }
    let html = '';
    for (const path of ['/', '/account', '/campaigns', '/campaigns/test-deep-link']) {
      const response = await fetch(base + path);
      assert.equal(response.status, 200, path);
      assert.match(response.headers.get('content-type') ?? '', /text\/html/, path);
      const body = await response.text();
      assert.match(body, /<div id="root">/, path);
      if (path === '/') html = body;
    }
    for (const asset of [...html.matchAll(/(?:src|href)="(\/assets\/[^"?#]+\.(?:js|css))"/g)].map((match) => match[1])) {
      const response = await fetch(base + asset);
      assert.equal(response.status, 200, asset);
      assert.match(response.headers.get('content-type') ?? '', asset.endsWith('.css') ? /text\/css/ : /javascript/, asset);
    }
    assert.match(html, /\/assets\/[^" ]+\.js/);
    assert.match(html, /\/assets\/[^" ]+\.css/);
    const discovery = await fetch(base + '/.well-known/stellar.toml');
    assert.equal(discovery.status, 200);
    assert.match(discovery.headers.get('content-type') ?? '', /text\/plain/);
    assert.equal(discovery.headers.get('access-control-allow-origin'), '*');
    const missingAsset = await fetch(base + '/assets/absent-regression-test.js');
    assert.equal(missingAsset.status, 404);
    assert.doesNotMatch(await missingAsset.text(), /<div id="root">/);
    for (const path of ['/api', '/api/missing-regression-test']) {
      const response = await fetch(base + path);
      assert.equal(response.status, 404);
      assert.equal((await response.json()).code, 'not_found');
    }
    const malformed = await fetch(base + '/api/auth/challenge', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{' });
    assert.equal(malformed.status, 400);
    assert.equal((await malformed.json()).code, 'invalid_input');
    const oversized = await fetch(base + '/api/auth/challenge', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: 'x'.repeat(1100000) }),
    });
    assert.equal(oversized.status, 413);
    assert.equal((await oversized.json()).code, 'body_too_large');
    const legacy = await fetch(base + '/api/legacy-unsupported', { method: 'POST' });
    assert.equal(legacy.status, 410);
    assert.equal((await legacy.json()).code, 'feature_unavailable');
  } finally {
    if (child.exitCode === null) {
      child.kill('SIGTERM');
      await once(child, 'exit');
    }
    const childRoot = output.match(/^COMMUNITY_TEST_ROOT=(.+)$/m)?.[1];
    if (childRoot) await rm(childRoot, { recursive: true, force: true });
    await rm(dir, { recursive: true, force: true });
  }
});
