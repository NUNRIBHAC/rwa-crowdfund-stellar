import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { FileRefundStore } from '../src/automatic-refund-store.ts';

test('durable file record survives a fresh store; directory is private', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'refund-store-'));
  try {
    const first = new FileRefundStore(dir);
    await first.exclusive('key', async () => {
      await first.write('key', { campaign: 'c', contributor: 'a', state: 'signed', hash: 'h', signedXdr: 'xdr' });
    });
    const second = new FileRefundStore(dir);
    assert.equal((await second.read('key'))?.signedXdr, 'xdr');
    assert.equal((await stat(dir)).mode & 0o777, 0o700);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
test('second process adapter fails closed while a lock is held', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'refund-store-'));
  try {
    const first = new FileRefundStore(dir),
      second = new FileRefundStore(dir);
    await first.exclusive('key', async () => {
      await assert.rejects(
        second.exclusive('key', async () => {
          throw Error('must not run');
        }),
        { code: 'EEXIST' },
      );
    });
    await second.exclusive('key', async () => {});
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
test('exception releases only the acquired lock and leaves record intact', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'refund-store-'));
  try {
    const store = new FileRefundStore(dir);
    await assert.rejects(
      store.exclusive('key', async () => {
        await store.write('key', { campaign: 'c', contributor: 'a', state: 'pending' });
        throw Error('stop');
      }),
    );
    await store.exclusive('key', async () => {
      assert.equal((await store.read('key'))?.state, 'pending');
    });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
