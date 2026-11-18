// Run npm audit and suppress advisories that have no upstream fix.
// This keeps the CI gate useful: any new high/critical advisory still fails.
// Suppressed advisories must document the accepted risk and the tracking issue.
//
// Usage: node scripts/audit-with-suppressions.mjs [directory]
// The directory defaults to the repository root. Pass "portal" to audit the
// independently locked docs portal.
import { execSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// GHSA-fc5q-39xc-vjpf: picomatch ReDoS. Affects all current versions
// (<= 4.0.7); no patched release exists yet. The build tools only evaluate
// repository-owned glob patterns, never untrusted input.
// Tracking: remove this entry once a fixed version (> 4.0.7) is released.
const SUPPRESSED = new Set(['GHSA-fc5q-39xc-vjpf']);

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const targetDir = process.argv[2] ? resolve(repoRoot, process.argv[2]) : repoRoot;

let audit;
try {
  audit = JSON.parse(execSync('npm audit --json --audit-level=high', { cwd: targetDir, encoding: 'utf8' }));
} catch (err) {
  const stdout = typeof err.stdout === 'string' ? err.stdout : '';
  if (!stdout.trim()) {
    console.error('npm audit failed without JSON output:', err.message);
    process.exit(1);
  }
  try {
    audit = JSON.parse(stdout);
  } catch {
    console.error('npm audit produced non-JSON output:', stdout.slice(0, 500));
    process.exit(1);
  }
}

// Fail closed when the audit did not actually report. An unreachable registry,
// a broken mirror, or an unreadable lockfile makes npm audit exit non-zero
// without a `vulnerabilities` object. Passing here would turn an infrastructure
// failure into a green security gate, which the raw `npm audit --audit-level=high`
// command this script replaces did not do.
if (audit?.error) {
  console.error('npm audit reported an error:', JSON.stringify(audit.error).slice(0, 500));
  process.exit(1);
}
if (!audit || typeof audit.vulnerabilities !== 'object' || audit.vulnerabilities === null || Array.isArray(audit.vulnerabilities)) {
  console.error('npm audit returned no vulnerability data; treating the audit as failed.');
  process.exit(1);
}

// npm audit v11+ uses a `vulnerabilities` object keyed by package name.
// Each entry has a `severity` and a `via` array that may be package names or
// advisory objects containing the GHSA URL. Because a single advisory can
// surface on every package in the dependency tree, we suppress an entry when
// every advisory reachable from it is in the suppression list.
const vulnerabilities = audit.vulnerabilities ?? {};
const SEVERITIES = new Set(['high', 'critical']);

const advisoryUrlToId = (url) => {
  for (const id of SUPPRESSED) {
    if (url.includes(id)) return id;
  }
  return null;
};

const collectAdvisories = (name, seen = new Set()) => {
  if (seen.has(name)) return [];
  seen.add(name);
  const info = vulnerabilities[name];
  if (!info || !SEVERITIES.has(info.severity)) return [];
  const urls = [];
  for (const v of Array.isArray(info.via) ? info.via : []) {
    if (v != null && typeof v === 'object' && typeof v.url === 'string') {
      if (SEVERITIES.has(v.severity)) urls.push(v.url);
    } else if (typeof v === 'string' && v !== name) {
      urls.push(...collectAdvisories(v, seen));
    }
  }
  return urls;
};

const remaining = [];
const suppressed = [];

for (const [name, info] of Object.entries(vulnerabilities)) {
  if (!SEVERITIES.has(info.severity)) continue;
  const urls = collectAdvisories(name, new Set());
  const ids = urls.map(advisoryUrlToId).filter(Boolean);
  const isSuppressed = urls.length > 0 && ids.length === urls.length;
  if (isSuppressed) {
    suppressed.push({ name, title: info.title ?? ids[0] ?? name });
  } else {
    remaining.push({ name, severity: info.severity, title: info.title ?? name, urls });
  }
}

if (suppressed.length) {
  console.log(`Suppressed ${suppressed.length} known advisory/advisories with no upstream fix:`);
  for (const { name, title } of suppressed) {
    console.log(`  - ${name}: ${title}`);
  }
}

if (remaining.length) {
  console.error(`\n${remaining.length} high/critical advisory/advisories remain:`);
  for (const { name, severity, title } of remaining) {
    console.error(`  - ${name} (${severity}): ${title}`);
  }
  process.exit(1);
}

console.log('No unsuppressed high/critical advisories.');
