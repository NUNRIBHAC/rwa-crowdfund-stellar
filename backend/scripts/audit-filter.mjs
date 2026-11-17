#!/usr/bin/env node
// Wrapper around `npm audit --audit-level=high` that tolerates the single
// unpatched picomatch ReDoS advisory (GHSA-fc5q-39xc-vjpf / npm id 1247710)
// until the maintainer ships a fixed release or Docusaurus/vitest no longer
// depend on affected versions.
//
// Usage:
//   node backend/scripts/audit-filter.mjs            # root workspace
//   node backend/scripts/audit-filter.mjs portal     # portal sub-project
//
// Exit codes:
//   0  – no high/critical advisories, or only the picomatch advisory present
//   1  – other high/critical advisories found, or npm audit failed unexpectedly

import { spawn } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';

const [, , subDir = '.'] = process.argv;
const cwd = subDir === '.' ? process.cwd() : path.resolve(process.cwd(), subDir);

const npm = spawn('npm', ['audit', '--audit-level=high', '--json'], { cwd, shell: false });

let stdout = '';
npm.stdout.on('data', (chunk) => {
  stdout += chunk;
});

npm.on('close', (code) => {
  let data;
  try {
    data = JSON.parse(stdout);
  } catch {
    // If npm audit itself failed (e.g. network), propagate the failure.
    console.error('audit-filter: could not parse npm audit JSON output');
    process.stderr.write(stdout);
    process.exit(code === 0 ? 1 : code);
  }

  const vulnerabilities = Object.values(data.vulnerabilities || {});
  const highOrCritical = vulnerabilities.filter((v) => v.severity === 'high' || v.severity === 'critical');

  if (highOrCritical.length === 0) {
    process.exit(0);
  }

  // The picomatch advisory has no patched version and is pulled in by many
  // transitive deps (Docusaurus, vite, vitest, ...). Tolerate only that one
  // advisory by checking that every *direct* high/critical advisory (entries
  // whose "via" contains a numeric advisory id) is picomatch. Indirect
  // effects of picomatch are ignored along with it; any unrelated advisory
  // still fails the gate.
  const directAdvisories = highOrCritical.filter((v) => v.via?.some((x) => typeof x === 'number'));

  const otherDirect = directAdvisories.filter((v) => v.name !== 'picomatch');

  if (otherDirect.length === 0) {
    console.warn(`audit-filter: ignoring ${highOrCritical.length} high/critical finding(s) caused by the unpatched picomatch advisory.`);
    process.exit(0);
  }

  console.error(`audit-filter: ${otherDirect.length} high/critical advisory/advisories not related to picomatch:`);
  for (const v of otherDirect) {
    console.error(`  - ${v.name} (${v.severity}): ${JSON.stringify(v.via)}`);
  }
  process.exit(1);
});
