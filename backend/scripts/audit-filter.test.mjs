import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const script = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'audit-filter.mjs');

function run(args = []) {
  const result = spawnSync('node', [script, ...args], {
    encoding: 'utf8',
    cwd: path.resolve(path.dirname(script), '../..'),
  });
  return { exitCode: result.status, stdout: result.stdout, stderr: result.stderr };
}

test('audit-filter passes for the root workspace with only picomatch findings', () => {
  const result = run();
  assert.equal(result.exitCode, 0, `stderr: ${result.stderr}\nstdout: ${result.stdout}`);
  assert.match(result.stderr, /unpatched picomatch advisory/);
});

test('audit-filter passes for the portal project with only picomatch findings', () => {
  const result = run(['portal']);
  assert.equal(result.exitCode, 0, `stderr: ${result.stderr}\nstdout: ${result.stdout}`);
  assert.match(result.stderr, /unpatched picomatch advisory/);
});
