import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { assertExplicitFileStorePath, createCommunityTestDirectory } from '../src/test-storage-guard.js';
import { communityStoreFromEnv } from '../src/community.js';
const env = { NODE_ENV: 'test' };
test('an explicit inherited community file is not permission to mutate it in tests', async () => {
  const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'live-like-'));
  const file = path.join(outside, 'community.json');
  fs.writeFileSync(file, 'sentinel');
  const saved = { ...process.env };
  try {
    delete process.env.COMMUNITY_DATABASE_URL;
    delete process.env.SOROBAN_JOURNAL_DATABASE_URL;
    delete process.env.COMMUNITY_REQUIRE_POSTGRES;
    process.env.SOROBAN_JOURNAL_BACKEND = 'file';
    process.env.COMMUNITY_STORE_PATH = file;
    await assert.rejects(() => communityStoreFromEnv(), /process-issued/);
    assert.equal(fs.readFileSync(file, 'utf8'), 'sentinel');
  } finally {
    process.env = saved;
    fs.rmSync(outside, { recursive: true, force: true });
  }
});
test('rejects empty, relative, deployment and arbitrary temporary community paths', () => {
  for (const file of [
    undefined,
    '',
    '  ',
    './data/community-store.json',
    '/app/data/community-store.json',
    '/var/oled/live/store.json',
    '/tmp/arbitrary-test.json',
  ])
    assert.throws(() => assertExplicitFileStorePath(file, 'COMMUNITY_STORE_PATH', env), /test isolation/);
});
test('allows only files directly inside a new process-issued directory, including subsequent writes', async () => {
  const dir = createCommunityTestDirectory(),
    file = path.join(dir, 'community.json');
  try {
    assert.doesNotThrow(() => assertExplicitFileStorePath(file, 'COMMUNITY_STORE_PATH', env));
    fs.writeFileSync(file, '{}');
    assert.doesNotThrow(() => assertExplicitFileStorePath(file, 'COMMUNITY_STORE_PATH', env));
    assert.throws(() => assertExplicitFileStorePath(dir + '/../live.json', 'COMMUNITY_STORE_PATH', env), /process-issued/);
    assert.throws(() => assertExplicitFileStorePath(path.join(dir, 'nested', 'store.json'), 'COMMUNITY_STORE_PATH', env), /process-issued/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
test('rejects file symlinks, dangling symlinks, hard links and replacement root directories', () => {
  const dir = createCommunityTestDirectory(),
    other = fs.mkdtempSync(path.join(os.tmpdir(), 'outside-')),
    file = path.join(dir, 'store.json'),
    target = path.join(other, 'live.json');
  fs.writeFileSync(target, 'sentinel');
  try {
    fs.symlinkSync(target, file);
    assert.throws(() => assertExplicitFileStorePath(file, 'COMMUNITY_STORE_PATH', env), /process-issued/);
    fs.unlinkSync(file);
    fs.symlinkSync(path.join(other, 'absent'), file);
    assert.throws(() => assertExplicitFileStorePath(file, 'COMMUNITY_STORE_PATH', env), /process-issued/);
    fs.unlinkSync(file);
    fs.linkSync(target, file);
    assert.throws(() => assertExplicitFileStorePath(file, 'COMMUNITY_STORE_PATH', env), /process-issued/);
    fs.unlinkSync(file);
    fs.rmdirSync(dir);
    fs.symlinkSync(other, dir);
    assert.throws(() => assertExplicitFileStorePath(file, 'COMMUNITY_STORE_PATH', env), /process-issued/);
    fs.unlinkSync(dir);
    assert.equal(fs.readFileSync(target, 'utf8'), 'sentinel');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
    fs.rmSync(other, { recursive: true, force: true });
  }
});
test('production behavior is unchanged and does not issue test storage roots', () => {
  assert.doesNotThrow(() => assertExplicitFileStorePath('/app/data/community.json', 'COMMUNITY_STORE_PATH', { NODE_ENV: 'production' }));
  const old = process.env.NODE_ENV,
    context = process.env.NODE_TEST_CONTEXT;
  delete process.env.NODE_TEST_CONTEXT;
  process.env.NODE_ENV = 'production';
  try {
    assert.throws(() => createCommunityTestDirectory(), /only in test/);
  } finally {
    process.env.NODE_ENV = old;
    if (context !== undefined) process.env.NODE_TEST_CONTEXT = context;
  }
});
