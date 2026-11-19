import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import net from 'node:net';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '../..');

async function freePort(): Promise<number> {
  const reserve = net.createServer();
  await new Promise<void>((resolve) => reserve.listen(0, '127.0.0.1', resolve));
  const { port } = reserve.address() as net.AddressInfo;
  await new Promise<void>((resolve) => reserve.close(() => resolve()));
  return port;
}

async function readHealth(extraEnv: Record<string, string>): Promise<Record<string, unknown>> {
  const port = await freePort();
  const child = spawn(process.execPath, ['--import', 'tsx', path.join(root, 'backend/src/server.ts')], {
    cwd: root,
    env: {
      ...process.env,
      NODE_ENV: 'production',
      EMBEDDED_HOST: '',
      HOST: '127.0.0.1',
      PORT: String(port),
      COMMUNITY_REQUIRE_POSTGRES: '',
      COMMUNITY_DATABASE_URL: '',
      SOROBAN_JOURNAL_BACKEND: '',
      ...extraEnv,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  try {
    for (let i = 0; i < 200; i++) {
      try {
        const response = await fetch(`http://127.0.0.1:${port}/health`);
        return (await response.json()) as Record<string, unknown>;
      } catch {
        await new Promise<void>((resolve) => setTimeout(resolve, 100));
      }
    }
    throw new Error('server did not answer /health');
  } finally {
    child.kill('SIGKILL');
  }
}

// Release detection reads this field. Unset must report null so an unknown
// deploy identity is never guessed.
test('health reports null build identity when BUILD_COMMIT and BUILD_IMAGE are unset', async () => {
  const body = await readHealth({ BUILD_COMMIT: '', BUILD_IMAGE: '' });
  assert.deepEqual(body.build, { commit: null, image: null });
});

test('health reports the build identity supplied at activation time', async () => {
  const body = await readHealth({ BUILD_COMMIT: 'a0d08a9', BUILD_IMAGE: 'blockallisto-app:reviewed-release' });
  assert.deepEqual(body.build, { commit: 'a0d08a9', image: 'blockallisto-app:reviewed-release' });
});
