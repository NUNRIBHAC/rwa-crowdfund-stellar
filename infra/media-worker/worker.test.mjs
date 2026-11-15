import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { URL } from 'node:url';
import { Buffer } from 'node:buffer';
const { Request, Response } = globalThis;
// Import as ESM without changing the historical Worker's deployment format.
const source = await readFile(new URL('./worker.js', import.meta.url), 'utf8');
const worker = (await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'))).default;
const social = [
  'discord.svg',
  'email.svg',
  'facebook.svg',
  'farcaster.svg',
  'instagram.svg',
  'linkedin.png',
  'telegram.svg',
  'threads.svg',
  'x.svg',
  'youtube.svg',
];
test('all13 Pages aliases map to their existing private B2 keys;6derivatives accepted', async () => {
  const originalFetch = globalThis.fetch;
  const originalCaches = globalThis.caches;
  const downloads = [];
  globalThis.caches = { default: { match: async () => undefined, put: async () => {} } };
  globalThis.fetch = async (url, options) => {
    if (String(url).includes('b2_authorize_account'))
      return Response.json({ authorizationToken: 'test-only', apiInfo: { storageApi: { downloadUrl: 'https://download.example' } } });
    downloads.push(decodeURIComponent(new URL(url).pathname));
    assert.equal(options.headers.Authorization, 'test-only');
    return new Response('fixture', { headers: { 'Content-Type': 'image/svg+xml' } });
  };
  const env = { B2_KEY_ID: 'fixture', B2_KEY: 'fixture' };
  try {
    for (const name of social) {
      const r = await worker.fetch(new Request('https://worker.example/social%20icons/' + name), env);
      assert.equal(r.status, 200);
      assert.equal(downloads.at(-1), '/file/blockallisto-media/public/social icons/' + name);
    }
    for (const name of ['icon-192.png', 'icon-512.png', 'icon-512-maskable.png']) {
      const r = await worker.fetch(new Request('https://worker.example/' + name), env);
      assert.equal(r.status, 200);
      assert.equal(downloads.at(-1), '/file/blockallisto-media/public/icons/' + name);
    }
    for (const width of [480, 800, 1280])
      for (const ext of ['avif', 'webp']) {
        const key = `campaigns/demo-solar-farm-${width}.${ext}`;
        assert.equal((await worker.fetch(new Request('https://worker.example/' + key), env)).status, 200);
        assert.equal(downloads.at(-1), '/file/blockallisto-media/public/' + key);
      }
    const before = downloads.length;
    for (const key of [
      'social%20icons/unknown.svg',
      'social%20icons/private.txt',
      'other%20folder/x.svg',
      'social%2520icons/x.svg',
      'social%20icons/x.svg/secret',
      'foo%2F..%2Fsecret.svg',
      'private.pdf',
    ]) {
      assert.equal((await worker.fetch(new Request('https://worker.example/' + key), env)).status, 404, key);
    }
    assert.equal(downloads.length, before, 'invalid paths never contact B2');
    assert.equal((await worker.fetch(new Request('https://worker.example/icon-192.png', { method: 'POST' }), env)).status, 405);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalCaches === undefined) delete globalThis.caches;
    else globalThis.caches = originalCaches;
  }
});
