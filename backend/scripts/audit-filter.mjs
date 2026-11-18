#!/usr/bin/env node
// Wrapper around `npm audit --audit-level=high` that tolerates the single
// unpatched picomatch ReDoS advisory (GHSA-fc5q-39xc-vjpf / npm id 1247710)
// until the maintainer ships a fixed release or the toolchain stops depending
// on affected versions.
//
// It is fail-closed: it exits 1 (and therefore blocks CI) when npm audit
// reports a high/critical advisory whose root cause is anything other than
// picomatch, and when npm audit itself fails (ENOLOCK, network, unparseable
// output, or a result we cannot attribute to a known advisory).
//
// Usage:
//   node backend/scripts/audit-filter.mjs            # root workspace
//   node backend/scripts/audit-filter.mjs portal     # portal sub-project
//
// Exit codes:
//   0 - no high/critical advisories, or every such advisory is picomatch
//   1 - unrelated high/critical advisory found, or npm audit failed

import { spawn } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';

// npm advisory id (GHSA-fc5q-39xc-vjpf) and package name for picomatch.
const PICOMATCH_ADVISORY_ID = 1247710;
const PICOMATCH_ADVISORY_PKG = 'picomatch';

// Decide the fate of an `npm audit --json` document. Pure and unit-testable.
//
// npm audit lists every vulnerable package as a `vulnerabilities` entry. The
// *root cause* advisory appears as an object in the `via` of the directly
// affected package entry (e.g. { source: 1247710, name: 'picomatch', ... } on
// npm 7-11; npm 12 keeps the object but drops `source`). Transitive dependents
// are listed separately with string-only `via` chains (e.g. ["picomatch"] or
// ["micromatch"]) and add no new advisory objects.
//
// The gate passes only when every advisory object in the whole document is
// picomatch. If any other advisory object exists, or no advisory object can be
// attributed, the gate fails closed.
export function classifyAudit(data) {
  if (data?.error) {
    const code = data.error.code || data.error.summary || 'audit error';
    return { status: 'fail', reason: `npm audit failed: ${code}` };
  }

  const highOrCritical = Object.values(data?.vulnerabilities || {}).filter((v) => v.severity === 'high' || v.severity === 'critical');
  if (highOrCritical.length === 0) {
    return { status: 'pass', reason: undefined };
  }

  const roots = collectRootAdvisories(highOrCritical);
  if (roots.size === 0) {
    return {
      status: 'fail',
      reason: 'high/critical advisories present but their root cause could not be attributed',
    };
  }

  const unrelated = [...roots.values()].filter((a) => a.name !== PICOMATCH_ADVISORY_PKG && a.source !== PICOMATCH_ADVISORY_ID);
  if (unrelated.length === 0) {
    return { status: 'pass', reason: undefined };
  }

  const detail = unrelated.map((a) => `  - ${a.name}${a.source ? ` (advisory ${a.source})` : ''} (${a.severity})`).join('\n');
  return {
    status: 'fail',
    reason: `${unrelated.length} high/critical advisory/advisories not caused by picomatch:\n${detail}`,
  };
}

// Collect the distinct advisory objects (the root causes) named anywhere in
// the `via` arrays of the given high/critical vulnerability entries.
function collectRootAdvisories(entries) {
  const roots = new Map();
  for (const entry of entries) {
    const via = Array.isArray(entry.via) ? entry.via : [];
    for (const hop of via) {
      if (typeof hop === 'object' && hop !== null && hop.name) {
        roots.set(hop.name, { name: hop.name, source: hop.source, severity: hop.severity || entry.severity });
      }
    }
  }
  return roots;
}

async function main() {
  const [, , subDir = '.'] = process.argv;
  const cwd = subDir === '.' ? process.cwd() : path.resolve(process.cwd(), subDir);

  const result = await new Promise((resolve) => {
    const npm = spawn('npm', ['audit', '--audit-level=high', '--json'], {
      cwd,
      shell: false,
    });
    let stdout = '';
    let stderr = '';
    npm.stdout.on('data', (c) => (stdout += c));
    npm.stderr.on('data', (c) => (stderr += c));
    npm.on('close', (code) => resolve({ code, stdout, stderr }));
    npm.on('error', (err) => resolve({ code: null, stdout, stderr, error: err }));
  });

  if (result.error) {
    console.error(`audit-filter: unable to run npm audit: ${result.error.message}`);
    process.exit(1);
  }

  let data;
  try {
    data = JSON.parse(result.stdout);
  } catch {
    console.error('audit-filter: npm audit produced no parseable JSON output');
    if (result.stderr) process.stderr.write(result.stderr);
    process.exit(1);
  }

  const verdict = classifyAudit(data);
  if (verdict.status === 'fail') {
    console.error(`audit-filter: ${verdict.reason}`);
    process.exit(1);
  }

  if (countHighCritical(data) > 0) {
    console.warn('audit-filter: ignoring all high/critical findings caused by the unpatched picomatch advisory.');
  }
  process.exit(0);
}

function countHighCritical(data) {
  return Object.values(data?.vulnerabilities || {}).filter((v) => v.severity === 'high' || v.severity === 'critical').length;
}

// Only run the CLI when invoked directly (not imported by tests).
if (process.argv[1] === new URL(import.meta.url).pathname) {
  main();
}
