import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, mkdirSync, chmodSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const script = join(repoRoot, 'scripts', 'audit-with-suppressions.mjs');

// Runs the real script with a stub `npm` first on PATH, so we can simulate
// registry/transport failures without touching the network or a real registry.
function runWithStubbedNpm(npmBody) {
  const dir = mkdtempSync(join(tmpdir(), 'audit-stub-'));
  try {
    mkdirSync(join(dir, 'bin'), { recursive: true });
    const stub = join(dir, 'bin', 'npm');
    writeFileSync(stub, `#!/usr/bin/env node\n${npmBody}\n`);
    chmodSync(stub, 0o755);
    return spawnSync('node', [script], {
      cwd: repoRoot,
      encoding: 'utf8',
      env: { ...process.env, PATH: `${join(dir, 'bin')}:${process.env.PATH}` },
    });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test('registry outage (npm audit error JSON, exit non-zero) fails the gate closed', () => {
  const result = runWithStubbedNpm(
    `console.error('npm error contacting registry');
console.log(JSON.stringify({ auditReportVersion: 2, error: { code: 'EAI_AGAIN', summary: 'request to registry failed', detail: 'getaddrinfo ENOTFOUND' } }));
process.exit(1);`,
  );
  assert.notEqual(result.status, 0, 'a failed audit must not pass');
  assert.match(result.stderr, /npm audit reported an error/);
});

test('npm audit exit non-zero with no vulnerability data fails the gate closed', () => {
  const result = runWithStubbedNpm(`console.log(JSON.stringify({ auditReportVersion: 2 }));\nprocess.exit(1);`);
  assert.notEqual(result.status, 0, 'a report without vulnerability data must not pass');
  assert.match(result.stderr, /no vulnerability data/);
});

test('blank npm audit output fails the gate closed', () => {
  const result = runWithStubbedNpm('process.exit(1);');
  assert.notEqual(result.status, 0, 'blank audit output must not pass');
  assert.match(result.stderr, /failed without JSON output/);
});

test('a clean audit report passes and an unsuppressed advisory fails', () => {
  const clean = runWithStubbedNpm(`console.log(JSON.stringify({ auditReportVersion: 2, vulnerabilities: {}, metadata: {} }));\nprocess.exit(0);`);
  assert.equal(clean.status, 0, clean.stderr);
  assert.match(clean.stdout, /No unsuppressed high\/critical advisories\./);

  const advisory = runWithStubbedNpm(
    `console.log(JSON.stringify({ auditReportVersion: 2, vulnerabilities: { lodash: { severity: 'high', title: 'proto pollution', via: [{ url: 'https://github.com/advisories/GHSA-1111-2222-3333', severity: 'high' }] } }, metadata: {} }));
process.exit(1);`,
  );
  assert.notEqual(advisory.status, 0, 'a new high advisory must fail');
  assert.match(advisory.stderr, /1 high\/critical advisory\/advisories remain/);
});
