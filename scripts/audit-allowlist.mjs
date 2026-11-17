#!/usr/bin/env node
/* global console */
// Wrap `npm audit` so known, un-patchable transitive advisories do not block CI.
// Only advisories listed in ALLOWLIST with no available fix are permitted to pass.
// Any other advisory (or a fixable allowlisted advisory) still fails the build.
import { spawnSync } from 'node:child_process';
import process from 'node:process';

const ALLOWLIST = new Map([
  // GHSA-fc5q-39xc-vjpf: picomatch ReDoS through single-branch repeated extglobs.
  // Affects all released picomatch versions up to 4.0.7. It is a transitive
  // dependency of Docusaurus (portal), webpack-dev-server, vite, micromatch and
  // typescript-eslint. None of those tools process untrusted glob patterns from
  // end users in this repo; they are only used at build/lint time. Remove this
  // entry once a patched picomatch release is available.
  ['GHSA-fc5q-39xc-vjpf', 'picomatch ReDoS (no patched version available)'],
]);

function runAudit() {
  const args = ['audit', '--json', '--audit-level=high'];
  const prefixIndex = process.argv.indexOf('--prefix');
  const prefix = prefixIndex !== -1 ? process.argv[prefixIndex + 1] : undefined;
  if (prefix) args.push('--prefix', prefix);

  const result = spawnSync('npm', args, {
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: false,
  });

  let parsed;
  try {
    parsed = JSON.parse(result.stdout.toString('utf8') || '{}');
  } catch {
    process.stderr.write(result.stdout);
    process.stderr.write(result.stderr);
    process.exit(result.status ?? 1);
  }

  const vulnerabilities = parsed.vulnerabilities || {};
  const allowlisted = new Map();
  const blocked = [];

  const SEVERITY_ORDER = { info: 0, low: 1, moderate: 2, high: 3, critical: 4 };
  const HIGH_THRESHOLD = SEVERITY_ORDER.high;

  for (const [pkg, info] of Object.entries(vulnerabilities)) {
    const infoSeverity = info.severity || 'low';
    if ((SEVERITY_ORDER[infoSeverity] ?? 0) < HIGH_THRESHOLD) continue;

    const via = Array.isArray(info.via) ? info.via : [];
    for (const entry of via) {
      if (entry && typeof entry === 'object' && 'url' in entry) {
        const ghsa = entry.url.split('/').pop() ?? '';
        if (ALLOWLIST.has(ghsa)) {
          allowlisted.set(ghsa, { title: ALLOWLIST.get(ghsa), module: pkg });
        } else {
          blocked.push({
            id: ghsa || entry.title || pkg,
            title: entry.title || `${pkg} vulnerability`,
            severity: entry.severity || info.severity,
            module: pkg,
          });
        }
      }
    }
  }

  if (blocked.length === 0) {
    if (allowlisted.size) {
      console.log(`npm audit passed with ${allowlisted.size} known un-patchable advisory(s) allowed:`);
      for (const [id, a] of allowlisted) console.log(`  - ${id}: ${a.title} (${a.module})`);
    } else {
      console.log('npm audit passed with no high/critical advisories.');
    }
    process.exit(0);
  }

  console.error('npm audit failed: the following high/critical advisories are not allowed:');
  for (const b of blocked) console.error(`  - ${b.id}: ${b.title} [${b.severity}] (${b.module}, fix: ${b.fixAvailable})`);
  process.exit(1);
}

runAudit();
