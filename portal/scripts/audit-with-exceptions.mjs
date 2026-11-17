#!/usr/bin/env node
// Run `npm audit` and fail only on high/critical advisories that are not
// documented, unfixable exceptions. This keeps the portal CI green when a
// transitive dependency has a known advisory with no patched version available,
// while still catching new high/critical issues.

import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const portalRoot = join(__dirname, '..');

// Known advisories with no fix available. Add an entry only when:
//  - the vulnerability is in a transitive dependency,
//  - no patched version exists on npm,
//  - the team has reviewed the risk and accepts it for the docs portal.
const ALLOWED_ADVISORIES = new Set([
  // picomatch ReDoS; all current versions (<=4.0.7) are flagged and Docusaurus
  // depends on picomatch transitively. Tracked upstream at GHSA-fc5q-39xc-vjpf.
  'GHSA-fc5q-39xc-vjpf',
]);

function runAudit() {
  return new Promise((resolve, reject) => {
    const child = spawn('npm', ['audit', '--json'], {
      cwd: portalRoot,
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

function hasAllowedAdvisoryObject(vuln) {
  return vuln.via.some((entry) => {
    if (typeof entry !== 'object') return false;
    return ALLOWED_ADVISORIES.has(entry.url?.split('/').pop());
  });
}

function isAllowed(vuln, highCriticalVulns, memo = new Map()) {
  if (memo.has(vuln.name)) return memo.get(vuln.name);

  // A vulnerability is allowed if it directly matches an allowed advisory,
  // or if every high/critical dependency path that makes it vulnerable goes
  // through only other allowed vulnerabilities. Moderate or low deps do not
  // contribute to a high/critical severity, so we ignore them.
  if (hasAllowedAdvisoryObject(vuln)) {
    memo.set(vuln.name, true);
    return true;
  }

  const depNames = vuln.via.filter(
    (entry) => typeof entry === 'string' && highCriticalVulns[entry]
  );

  if (depNames.length === 0) {
    memo.set(vuln.name, false);
    return false;
  }

  const allAllowed = depNames.every((name) =>
    isAllowed(highCriticalVulns[name], highCriticalVulns, memo)
  );

  memo.set(vuln.name, allAllowed);
  return allAllowed;
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

  const highCriticalVulns = Object.fromEntries(
    highOrCritical.map((v) => [v.name, v])
  );

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
      `::warning::Allowing ${allowed.length} known high/critical advisory package(s) because they only transitively depend on excepted advisories with no fix available: ${allowed.map((v) => v.name).join(', ')}`
    );
  }

  if (blocked.length > 0) {
    console.error(
      `Found ${blocked.length} blocking high/critical advisory package(s):`
    );
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
