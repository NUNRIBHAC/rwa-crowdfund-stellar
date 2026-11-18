#!/usr/bin/env node
// Run `npm audit` and fail only on high/critical advisories that are not
// documented, unfixable exceptions. This keeps CI green when a transitive
// dependency has a known advisory with no patched version available, while still
// catching new high/critical issues.
//
// Usage: node audit-with-exceptions.mjs [directory]
//   directory  optional path to the package to audit (defaults to the parent
//              directory of this script for backwards compatibility).

import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const targetDir = resolve(process.argv[2] || join(__dirname, '..'));

// Known advisories with no fix available. Add an entry only when:
//  - the vulnerability is in a transitive dependency,
//  - no patched version exists on npm,
//  - the team has reviewed the risk and accepts it.
const ALLOWED_ADVISORIES = new Set([
  // picomatch ReDoS; all current versions (<=4.0.7) are flagged. Several
  // dependencies (Docusaurus, micromatch, vitest/fast-glob) transitively depend
  // on picomatch. Tracked upstream at GHSA-fc5q-39xc-vjpf.
  'GHSA-fc5q-39xc-vjpf',
]);

function runAudit() {
  return new Promise((resolve, reject) => {
    const child = spawn('npm', ['audit', '--json'], {
      cwd: targetDir,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (data) => {
      stdout += data;
    });
    child.stderr.on('data', (data) => {
      stderr += data;
    });

    child.on('close', (code) => {
      // `npm audit` exits non-zero when vulnerabilities are found, but still
      // prints the JSON report on stdout.
      resolve({ code, stdout, stderr });
    });

    child.on('error', reject);
  });
}

function collectReachableAdvisories(startVuln, highCriticalVulns) {
  const reachable = new Set();
  const stack = [startVuln];
  const visited = new Set();

  while (stack.length > 0) {
    const vuln = stack.pop();
    if (visited.has(vuln.name)) continue;
    visited.add(vuln.name);

    for (const entry of vuln.via) {
      if (typeof entry === 'object') {
        reachable.add(entry.url?.split('/').pop());
      } else if (typeof entry === 'string' && highCriticalVulns[entry]) {
        stack.push(highCriticalVulns[entry]);
      }
    }
  }

  return reachable;
}

function isAllowed(vuln, highCriticalVulns) {
  const reachableAdvisories = collectReachableAdvisories(vuln, highCriticalVulns);

  if (reachableAdvisories.size === 0) {
    // A high/critical severity with no explicit advisory object means the
    // package is flagged only because it depends on other flagged packages.
    // If every dependency path leads to allowed advisories, treat it as
    // allowed. If it has no high/critical deps at all, something unexpected
    // happened; fail open (block) so we investigate.
    const hasHighCriticalDeps = vuln.via.some((entry) => typeof entry === 'string' && highCriticalVulns[entry]);
    return hasHighCriticalDeps;
  }

  return [...reachableAdvisories].every((id) => ALLOWED_ADVISORIES.has(id));
}

async function main() {
  const { stdout, stderr } = await runAudit();

  if (stderr) {
    process.stderr.write(stderr);
  }

  let report;
  try {
    report = JSON.parse(stdout);
  } catch {
    // If npm audit didn't produce valid JSON, pass through its output and
    // fail so we notice tooling changes.
    console.log(stdout);
    process.exit(1);
  }

  const allVulns = report.vulnerabilities || {};
  const highOrCritical = Object.entries(allVulns)
    .map(([name, info]) => ({ name, ...info }))
    .filter((v) => v.severity === 'high' || v.severity === 'critical');

  const highCriticalVulns = Object.fromEntries(highOrCritical.map((v) => [v.name, v]));

  const allowed = [];
  const blocked = [];

  for (const v of highOrCritical) {
    if (isAllowed(v, highCriticalVulns)) {
      allowed.push(v);
    } else {
      blocked.push(v);
    }
  }

  if (allowed.length > 0) {
    console.warn(
      `::warning::Allowing ${allowed.length} known high/critical advisory package(s) because they only transitively depend on excepted advisories with no fix available: ${allowed.map((v) => v.name).join(', ')}`,
    );
  }

  if (blocked.length > 0) {
    console.error(`Found ${blocked.length} blocking high/critical advisory package(s):`);
    for (const v of blocked) {
      const urls = v.via
        .filter((e) => typeof e === 'object')
        .map((e) => e.url)
        .join(', ');
      console.error(`  - ${v.name} (${v.severity}): ${urls || v.via.join(', ')}`);
    }
    process.exit(1);
  }

  console.log('No blocking high/critical advisories found.');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
