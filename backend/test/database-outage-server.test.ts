import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import net from 'node:net';
import path from 'node:path';

// Real production-mode server process, but every PostgreSQL URL points to a
// local closed port. No hosted database, live quota, RPC or real data is used.
test('database outage at startup stays alive and returns honest 503 health, with no retry per health request', async () => {
  const reserve = net.createServer();
  await new Promise<void>((resolve) => reserve.listen(0, '127.0.0.1', resolve));
  const address = reserve.address() as net.AddressInfo;
  const port = address.port;
  await new Promise<void>((resolve) => reserve.close(() => resolve()));
  const root = path.resolve(import.meta.dirname, '../..');
  const child = spawn(process.execPath, ['--import', 'tsx', path.join(root, 'backend/src/server.ts')], {
    cwd: root,
    env: {
      ...process.env,
      NODE_ENV: 'production',
      EMBEDDED_HOST: '',
      HOST: '127.0.0.1',
      PORT: String(port),
      COMMUNITY_REQUIRE_POSTGRES: '1',
      COMMUNITY_DATABASE_URL: 'postgres://fixture:fixture@127.0.0.1:1/fixture',
      SOROBAN_JOURNAL_BACKEND: 'postgres',
      SOROBAN_JOURNAL_DATABASE_URL: 'postgres://fixture:fixture@127.0.0.1:1/fixture',
      EVENT_ARCHIVE_BACKEND: 'postgres',
      EVENT_ARCHIVE_DATABASE_URL: 'postgres://fixture:fixture@127.0.0.1:1/fixture',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '';
  child.stdout.on('data', (b) => {
    output += b;
  });
  child.stderr.on('data', (b) => {
    output += b;
  });
  try {
    let response: Response | undefined;
    for (let i = 0; i < 800; i++) {
      if (child.exitCode !== null) assert.fail(`server exited: ${output}`);
      try {
        response = await fetch(`http://127.0.0.1:${port}/health`);
        break;
      } catch {
        await new Promise((r) => setTimeout(r, 25));
      }
    }
    assert.ok(response, output);
    assert.equal(response.status, 503);
    assert.equal((await response.json()).ok, false);
    for (let i = 0; i < 50; i++) assert.equal((await fetch(`http://127.0.0.1:${port}/health`)).status, 503);
    await new Promise((r) => setTimeout(r, 100));
    assert.equal(child.exitCode, null, output);
    assert.doesNotMatch(output, /UnhandledPromiseRejection|Unhandled 'error' event/);
  } finally {
    if (child.exitCode === null && child.signalCode === null) {
      const exited = new Promise<void>((resolve) => child.once('exit', () => resolve()));
      child.kill('SIGTERM');
      await exited;
    }
  }
});
