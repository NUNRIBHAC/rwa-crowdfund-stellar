// Run npm audit and suppress advisories that have no upstream fix.
// This keeps the CI gate useful: any new high/critical advisory still fails.
// Suppressed advisories must document the accepted risk and the tracking issue.
import { execSync } from 'node:child_process';

// GHSA-fc5q-39xc-vjpf: picomatch ReDoS. Affects all current versions
// (<= 4.0.7); no patched release exists yet. The portal is a static docs
// build that does not evaluate untrusted glob patterns at runtime.
// Tracking: upgrade picomatch once a fixed version (> 4.0.7) is released.
const SUPPRESSED = new Set(['GHSA-fc5q-39xc-vjpf']);

let audit;
try {
  const out = execSync('npm audit --json --audit-level=high', { cwd: new URL('..', import.meta.url), encoding: 'utf8' });
  audit = JSON.parse(out);
} catch (err) {
  try {
    audit = JSON.parse(err.stdout);
  } catch {
    console.error('npm audit produced non-JSON output:', err.stdout?.slice(0, 500) ?? err.message);
    process.exit(1);
  }
}

const advisories = Object.entries(audit.advisories ?? {});
const remaining = advisories.filter(([id]) => !SUPPRESSED.has(id));
const suppressed = advisories.filter(([id]) => SUPPRESSED.has(id));

if (suppressed.length) {
  console.log(`Suppressed ${suppressed.length} known advisory with no upstream fix:`);
  for (const [id, info] of suppressed) {
    console.log(`  - ${id}: ${info.title ?? info.module_name ?? 'n/a'}`);
  }
}

if (remaining.length) {
  console.error(`\n${remaining.length} high/critical advisory(ies) remain:`);
  for (const [id, info] of remaining) {
    console.error(`  - ${id}: ${info.title ?? info.module_name ?? 'n/a'}`);
  }
  process.exit(1);
}

console.log('No unsuppressed high/critical advisories.');
