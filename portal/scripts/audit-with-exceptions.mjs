#!/usr/bin/env node
// Run npm audit in the portal workspace and tolerate only documented,
// temporary exceptions. Exit code follows the effective security posture:
//   0 = no unhandled high/critical advisories remain
//   1 = at least one unhandled high/critical advisory is present
//
// This script never hides advisories: it prints every finding and clearly
// labels which are excepted and which must be fixed. A finding is excepted
// only when its entire transitive vulnerability chain ultimately resolves to
// an advisory listed in .audit-exceptions.json.

import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const portalRoot = dirname(here);

function loadExceptions() {
  const raw = readFileSync(join(portalRoot, '.audit-exceptions.json'), 'utf8');
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed.exceptions)) {
    throw new Error('.audit-exceptions.json must contain an exceptions array');
  }
  return parsed.exceptions;
}

function runAudit() {
  return new Promise((resolve, reject) => {
    const proc = spawn(
      'npm',
      ['audit', '--json', '--audit-level=high'],
      { cwd: portalRoot, stdio: ['ignore', 'pipe', 'pipe'] },
    );
    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    proc.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    proc.on('error', reject);
    proc.on('close', () => {
      try {
        resolve({ data: JSON.parse(stdout), stderr });
      } catch {
        reject(new Error(`npm audit did not produce JSON. stdout: ${stdout}\nstderr: ${stderr}`));
      }
    });
  });
}

function* rootAdvisories(vulnName, vulns, visited = new Set()) {
  if (visited.has(vulnName)) return;
  visited.add(vulnName);
  const vuln = vulns[vulnName];
  if (!vuln) return;
  for (const ref of vuln.via ?? []) {
    if (typeof ref === 'string') {
      // Transitive package reference; walk up.
      yield* rootAdvisories(ref, vulns, visited);
    } else if (typeof ref === 'object' && ref !== null) {
      yield { name: ref.name, title: ref.title, url: ref.url, severity: ref.severity, range: ref.range };
    }
  }
}

function matchedException(vulnName, vulns, exceptions) {
  for (const advisory of rootAdvisories(vulnName, vulns)) {
    const matched = exceptions.find((e) => advisory.url && advisory.url.includes(e.id));
    if (matched) return { advisory, exception: matched };
  }
  return null;
}

async function main() {
  const exceptions = loadExceptions();
  const { data } = await runAudit();

  const vulns = data.vulnerabilities || {};
  const findings = Object.entries(vulns).filter(
    ([, v]) => v.severity === 'high' || v.severity === 'critical',
  );

  let unhandled = 0;
  for (const [name, v] of findings) {
    const match = matchedException(name, vulns, exceptions);
    if (match) {
      console.log(
        `[EXCEPTED ${v.severity.toUpperCase()}] ${name}: ${match.exception.title} (${match.exception.id})`,
      );
    } else {
      unhandled += 1;
      const roots = Array.from(rootAdvisories(name, vulns));
      const urls = roots.map((a) => a.url).filter(Boolean).join(', ') || 'no advisory URL';
      console.log(`[UNHANDLED ${v.severity.toUpperCase()}] ${name}: ${urls}`);
    }
  }

  // Stale exceptions no longer match any high/critical finding.
  const matchedIds = new Set();
  for (const [name, v] of findings) {
    const match = matchedException(name, vulns, exceptions);
    if (match) matchedIds.add(match.exception.id);
  }
  for (const e of exceptions) {
    if (!matchedIds.has(e.id)) {
      console.log(
        `[STALE EXCEPTION] ${e.id} no longer matches any high/critical finding; remove it from .audit-exceptions.json`,
      );
    }
  }

  if (unhandled > 0) {
    console.error(`\nFATAL: ${unhandled} unhandled high/critical advisory(ies) found.`);
    process.exit(1);
  }

  console.log('\nOK: no unhandled high/critical advisories.');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
