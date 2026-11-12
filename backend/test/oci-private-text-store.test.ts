import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { OciPrivateTextStore, privateStorageIdentity, signPrivateObjectRequest, type OciTextConfig } from '../src/oci-private-text-store.js';
const config: OciTextConfig = {
  enabled: true,
  namespace: 'synthetic',
  region: 'eu-frankfurt-1',
  bucket: 'private-docs-test',
  prefix: 'applications',
  accessKey: 'SYNTHETIC',
  secretKey: 'synthetic-not-a-credential',
};
const id = () => '00000000-0000-4000-8000-000000000001';
const now = () => new Date('2026-11-09T12:00:00Z');
const sha = (text: string) => createHash('sha256').update(text).digest('hex');
const ref = (text = 'synthetic text') => ({
  storageId: privateStorageIdentity(config),
  key: `applications/${id()}.txt`,
  sha256: sha(text),
  bytes: Buffer.byteLength(text),
});

async function uploadText(store: OciPrivateTextStore, content: string) {
  const planned = store.plan(content);
  await store.upload(planned, content);
  return planned;
}

test('SigV4 matches published AWS GET object reference vector, not a self-generated expected signature', () => {
  // Public AWS documentation example, not a real credential.
  const signed = signPrivateObjectRequest(
    'GET',
    new URL('https://examplebucket.s3.amazonaws.com/test.txt'),
    Buffer.alloc(0),
    {
      region: 'us-east-1',
      accessKey: 'AKIAIOSFODNN7EXAMPLE',
      secretKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
    },
    new Date('2013-05-24T00:00:00Z'),
    { range: 'bytes=0-9' },
  );
  assert.equal(
    signed.authorization,
    'AWS4-HMAC-SHA256 Credential=AKIAIOSFODNN7EXAMPLE/20130524/us-east-1/s3/aws4_request,SignedHeaders=host;range;x-amz-content-sha256;x-amz-date,Signature=f0e8bdb87c964420e857bd35b5d6ed310bd44f0170aba48dd91039c6036bdb41',
  );
});
test('rejects disabled or incomplete configuration without network or secrets in error', () => {
  for (const patch of [
    { enabled: false },
    { namespace: '../x' },
    { region: 'https://evil' },
    { bucket: '../x' },
    { prefix: 'a/../b' },
    { accessKey: '' },
    { secretKey: '' },
  ]) {
    assert.throws(() => new OciPrivateTextStore({ ...config, ...patch } as OciTextConfig), /^Error: private document storage is not configured$/);
  }
});
test('PUT uses only fixed Oracle dedicated origin/path, header auth, timeout and no redirects; returns opaque metadata', async () => {
  let calls = 0;
  const store = new OciPrivateTextStore(
    config,
    (async (url, init) => {
      calls++;
      assert.equal(String(url), `https://synthetic.compat.objectstorage.eu-frankfurt-1.oci.customer-oci.com/private-docs-test/applications/${id()}.txt`);
      assert.equal(init?.method, 'PUT');
      assert.equal(init?.redirect, 'error');
      assert.equal(init?.cache, 'no-store');
      assert.ok(init?.signal);
      assert.equal(new TextDecoder().decode(init?.body as Uint8Array), 'synthetic text');
      assert.match((init?.headers as Record<string, string>).authorization, /^AWS4-HMAC-SHA256 /);
      assert.ok(!String(url).includes('SYNTHETIC'));
      return new Response(null, { status: 200 });
    }) as typeof fetch,
    now,
    id,
  );
  assert.deepEqual(await uploadText(store, 'synthetic text'), ref());
  assert.equal(calls, 1);
});
test('keeps 16KB byte and safe-text policy, invalid input never reaches transport', async () => {
  let calls = 0;
  const store = new OciPrivateTextStore(
    config,
    (async () => {
      calls++;
      return new Response(null);
    }) as typeof fetch,
    now,
    id,
  );
  for (const text of ['', 'x'.repeat(16001), 'á'.repeat(8001), '\u0000secret']) await assert.rejects(uploadText(store, text), /invalid private text document/);
  assert.equal(calls, 0);
  await uploadText(store, 'x'.repeat(16000));
  assert.equal(calls, 1);
});
test('read verifies exact length and SHA before returning UTF8 text', async () => {
  const store = new OciPrivateTextStore(config, (async () => new Response('synthetic text')) as typeof fetch, now, id);
  assert.equal(await store.read(ref()), 'synthetic text');
  await assert.rejects(store.read({ ...ref(), sha256: sha('wrong') }), /integrity failure/);
  await assert.rejects(store.read({ ...ref(), bytes: ref().bytes - 1 }), /integrity failure/);
  await assert.rejects(store.read({ ...ref(), bytes: ref().bytes + 1 }), /integrity failure/);
});
test('wrong prefix, traversal, malformed id and untrusted ref sizes are refused before request', async () => {
  let calls = 0;
  const store = new OciPrivateTextStore(
    config,
    (async () => {
      calls++;
      return new Response('x');
    }) as typeof fetch,
    now,
    id,
  );
  for (const key of ['../secret', `investments/${id()}.txt`, `applications/${id()}Xtxt`, 'applications/' + '-'.repeat(36) + '.txt']) {
    await assert.rejects(store.read({ ...ref(), key }), /invalid private document reference/);
    await assert.rejects(store.remove({ ...ref(), key }), /invalid private document reference/);
  }
  for (const bytes of [0, -1, 16001, 1.5]) await assert.rejects(store.read({ ...ref(), bytes }), /invalid private document reference/);
  assert.equal(calls, 0);
});
test('provider errors, redirects and fetch rejections expose only generic errors; no implicit retry', async () => {
  for (const result of [
    () => new Response('provider secret details', { status: 403 }),
    () => {
      throw new Error('sensitive endpoint credential');
    },
  ]) {
    let calls = 0;
    const store = new OciPrivateTextStore(
      config,
      (async () => {
        calls++;
        return result();
      }) as typeof fetch,
      now,
      id,
    );
    await assert.rejects(uploadText(store, 'synthetic text'), /^Error: private document storage unavailable$/);
    assert.equal(calls, 1);
  }
});
test('bounded streaming read cancels oversized body and masks provider stream error', async () => {
  const store = new OciPrivateTextStore(
    config,
    (async () =>
      new Response(
        new ReadableStream({
          start(c) {
            c.enqueue(new Uint8Array(20000));
            c.close();
          },
        }),
      )) as typeof fetch,
    now,
    id,
  );
  await assert.rejects(store.read(ref()), /integrity failure/);
  const broken = new OciPrivateTextStore(
    config,
    (async () =>
      new Response(
        new ReadableStream({
          pull() {
            throw new Error('sensitive');
          },
        }),
      )) as typeof fetch,
    now,
    id,
  );
  await assert.rejects(broken.read(ref()), /^Error: private document integrity failure$/);
});
test('DELETE is explicit scoped operation and does not expose object URL', async () => {
  const store = new OciPrivateTextStore(
    config,
    (async (_url, init) => {
      assert.equal(init?.method, 'DELETE');
      return new Response(null, { status: 204 });
    }) as typeof fetch,
    now,
    id,
  );
  assert.equal(await store.remove(ref()), undefined);
});
test('Oracle documented access key with plus signs is accepted; header and scope delimiters refused', async () => {
  // Public Oracle example, not a credential.
  const accessKey = 'gQ4+YC530sBa8qZI6WcbUbtH8oar0exampleuniqueID';
  const store = new OciPrivateTextStore(
    { ...config, accessKey },
    (async (_url, init) => {
      assert.ok((init?.headers as Record<string, string>).authorization.includes(`Credential=${accessKey}/`));
      return new Response(null);
    }) as typeof fetch,
    now,
    id,
  );
  assert.deepEqual(await uploadText(store, 'synthetic text'), ref());
  for (const unsafe of ['key\r\nInjected:value', 'key,next=value', 'key;next', 'key/scope', 'key value', 'key\tvalue']) {
    assert.throws(() => new OciPrivateTextStore({ ...config, accessKey: unsafe }), /storage is not configured/);
  }
});
test('success cleanup rejection never loses a confirmed PUT ref or turns successful DELETE into failure', async () => {
  const transport = (async () => ({
    ok: true,
    body: {
      cancel: async () => {
        throw new Error('sensitive provider cleanup detail');
      },
    },
  })) as unknown as typeof fetch;
  const store = new OciPrivateTextStore(config, transport, now, id);
  assert.deepEqual(await uploadText(store, 'synthetic text'), ref());
  assert.equal(await store.remove(ref()), undefined);
});
test('correct hash of invalid UTF8 still returns a generic integrity error', async () => {
  const invalid = new Uint8Array([255]);
  const store = new OciPrivateTextStore(config, (async () => new Response(invalid)) as typeof fetch, now, id);
  await assert.rejects(
    store.read({
      ...ref(),
      bytes: 1,
      sha256: createHash('sha256').update(invalid).digest('hex'),
    }),
    /^Error: private document integrity failure$/,
  );
});
test('planned reference survives ambiguous PUT failure and retries use only the same planned key', async () => {
  const keys: string[] = [];
  const store = new OciPrivateTextStore(
    config,
    (async (url) => {
      keys.push(String(url));
      throw new Error('timeout after remote write');
    }) as typeof fetch,
    now,
    id,
  );
  const planned = store.plan('synthetic text');
  await assert.rejects(store.upload(planned, 'synthetic text'), /storage unavailable/);
  assert.deepEqual(planned, ref());
  await assert.rejects(store.upload(planned, 'synthetic text'), /storage unavailable/);
  assert.equal(keys.length, 2);
  assert.equal(keys[0], keys[1]);
});
test('planned reference hash/bytes mismatch refuses transport', async () => {
  let calls = 0;
  const store = new OciPrivateTextStore(
    config,
    (async () => {
      calls++;
      return new Response(null);
    }) as typeof fetch,
    now,
    id,
  );
  await assert.rejects(store.upload(ref(), 'different text'), /integrity failure/);
  await assert.rejects(store.upload({ ...ref(), bytes: 2 }, 'synthetic text'), /integrity failure/);
  assert.equal(calls, 0);
});
test('exact website uploads prefix preserves its space, encodes URL and binds storage identity', async () => {
  const named = { ...config, prefix: 'website uploads' };
  let urlSeen = '';
  const store = new OciPrivateTextStore(
    named,
    (async (url) => {
      urlSeen = String(url);
      return new Response(null);
    }) as typeof fetch,
    now,
    id,
  );
  const planned = store.plan('synthetic text');
  assert.equal(planned.key, `website uploads/${id()}.txt`);
  await store.upload(planned, 'synthetic text');
  assert.ok(urlSeen.endsWith(`/website%20uploads/${id()}.txt`));
  assert.equal(planned.storageId, privateStorageIdentity(named));
  for (const patch of [{ bucket: 'other' }, { region: 'us-ashburn-1' }, { namespace: 'other' }, { prefix: 'renamed uploads' }]) {
    const other = new OciPrivateTextStore(
      { ...named, ...patch },
      (async () => {
        throw new Error('must not request');
      }) as typeof fetch,
      now,
      id,
    );
    await assert.rejects(other.read(planned), /storage identity mismatch/);
    await assert.rejects(other.remove(planned), /storage identity mismatch/);
    await assert.rejects(other.upload(planned, 'synthetic text'), /storage identity mismatch/);
  }
});
test('explicit owned DELETE treats confirmed 404 as absent; GET404 still fails closed', async () => {
  const store = new OciPrivateTextStore(config, (async () => new Response(null, { status: 404 })) as typeof fetch, now, id);
  await store.remove(ref());
  await assert.rejects(store.read(ref()), /storage unavailable/);
});
