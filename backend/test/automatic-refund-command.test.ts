import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, chmod, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { signWithIdentity } from '../scripts/automatic-refunds-testnet.ts';

test('CLI signer gets fixed testnet arguments and envelope over stdin, not shell interpolation', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'refund-cli-'));
  try {
    const binary = join(dir, 'fake-stellar');
    await writeFile(
      binary,
      '#!/usr/bin/env node\nlet x="";process.stdin.on("data",d=>x+=d);process.stdin.on("end",()=>{if(process.argv.slice(2).join("|")!=="tx|sign|--sign-with-key|local_testnet|--network-passphrase|Test SDF Network ; September 2015"||x!=="dW5zaWduZWQ=\\n"||process.env.STELLAR_SECRET_KEY)process.exit(1);console.log("c2lnbmVk");});\n',
    );
    await chmod(binary, 0o700);
    process.env.STELLAR_SECRET_KEY = 'ephemeral-fixture-not-a-key';
    try {
      assert.equal(await signWithIdentity(binary, 'local_testnet', 'dW5zaWduZWQ='), 'c2lnbmVk');
    } finally {
      delete process.env.STELLAR_SECRET_KEY;
    }
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
test('CLI signer rejects a seed-shaped argument, relative executable and shell fragments', async () => {
  for (const identity of ['S' + 'A'.repeat(55), 'name; echo bad', '../name', 'name space']) {
    // Secret-shaped StrKeys are disallowed separately from normal names.
    assert.throws(() => signWithIdentity('/bin/false', identity, 'eGRy'));
  }
  assert.throws(() => signWithIdentity('stellar', 'testnet', 'eGRy'));
});
test('standalone command without explicit opt-in blocks before accessing config or network', () => {
  assert.throws(
    () =>
      execFileSync(
        process.execPath,
        ['--import', 'tsx', fileURLToPath(new URL('../scripts/automatic-refunds-testnet.ts', import.meta.url)), '/nonexistent/private.json'],
        {
          cwd: process.cwd(),
          encoding: 'utf8',
          env: { HOME: process.env.HOME, PATH: process.env.PATH },
        },
      ),
    (error) => {
      assert.ok(error instanceof Error && 'stderr' in error && String(error.stderr).includes('AUTO_REFUND_COMMAND_BLOCKED'));
      return true;
    },
  );
});
