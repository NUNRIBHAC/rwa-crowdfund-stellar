// Repair Weblate serializer damage in frontend/i18n-json before the return
// flow (weblate/l10n -> main). Weblate's JSON writer drops unit-less empty
// containers (e.g. "news": []) and pretty-expands short arrays onto one
// line per element. Array expansion is normalized away by the
// i18n:import -> i18n:export round trip, but dropped empty containers are
// not: import can only re-inject leaves the English TS owns, and an empty
// array/object owns no units. This tool restores any empty container that
// exists at a path in the merge-base revision of the same file but is
// absent from the working copy, and re-orders keys back to base order so
// the repaired diff carries only real translation edits.
//
// Usage (requires a git checkout - it queries the merge base; it is a
// return-flow step, not part of the archive-safe i18n:check gate):
//   node scripts/i18n-weblate-repair.mjs              repair in place
//   node scripts/i18n-weblate-repair.mjs --check      report drift, exit 1
//   node scripts/i18n-weblate-repair.mjs --base-ref X repair against ref X
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

const GROUPS = ['ui', 'legal', 'mail'];
const LOCALES = ['en', 'pt', 'es', 'fr', 'de', 'zh-TW', 'zh-CN', 'ja', 'ko', 'ar', 'hi'];

export const isEmptyContainer = (v) =>
  (Array.isArray(v) && v.length === 0) || (v !== null && typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0);

// Pure repair: returns { fixed, repairs } where fixed is target with base's
// missing empty containers restored (in base key order) and repairs lists
// the restored dotted paths. Never restores non-empty subtrees or scalars:
// a missing non-empty key is a different failure class and stays visible.
export function repairTree(base, target, path = '', repairs = []) {
  if (base === null || typeof base !== 'object') return { fixed: target, repairs };
  if (Array.isArray(base)) {
    if (!Array.isArray(target)) return { fixed: target, repairs };
    // Parallel positions: null placeholders keep array indices stable.
    const fixed = target.slice();
    for (let i = 0; i < base.length && i < fixed.length; i++) {
      fixed[i] = repairTree(base[i], fixed[i], `${path}[${i}]`, repairs).fixed;
    }
    return { fixed, repairs };
  }
  if (target === null || typeof target !== 'object' || Array.isArray(target)) {
    return { fixed: target, repairs };
  }
  const merged = { ...target };
  for (const [k, bv] of Object.entries(base)) {
    const p = path ? `${path}.${k}` : k;
    if (!(k in merged)) {
      if (isEmptyContainer(bv)) {
        merged[k] = bv;
        repairs.push(p);
      }
      continue;
    }
    merged[k] = repairTree(bv, merged[k], p, repairs).fixed;
  }
  // Re-emit keys in base order, then any target-only keys (Weblate additions
  // keep their relative order at the end; import/export canonicalizes them).
  const ordered = {};
  for (const k of Object.keys(base)) if (k in merged) ordered[k] = merged[k];
  for (const k of Object.keys(merged)) if (!(k in ordered)) ordered[k] = merged[k];
  return { fixed: ordered, repairs };
}

function main() {
  const args = process.argv.slice(2);
  const check = args.includes('--check');
  const flagIdx = args.indexOf('--base-ref');
  const root = join(dirname(fileURLToPath(import.meta.url)), '..');
  const repoRoot = join(root, '..');
  const baseRef = flagIdx >= 0 ? args[flagIdx + 1] : execFileSync('git', ['merge-base', 'origin/main', 'HEAD'], { cwd: repoRoot, encoding: 'utf8' }).trim();

  let total = 0;
  for (const group of GROUPS) {
    for (const locale of LOCALES) {
      const rel = `frontend/i18n-json/${group}/${locale}.json`;
      const abs = join(repoRoot, rel);
      if (!existsSync(abs)) continue;
      let baseRaw;
      try {
        baseRaw = execFileSync('git', ['show', `${baseRef}:${rel}`], { cwd: repoRoot, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
      } catch {
        continue; // file did not exist at the merge base
      }
      const base = JSON.parse(baseRaw);
      const target = JSON.parse(readFileSync(abs, 'utf8'));
      const { fixed, repairs } = repairTree(base, target);
      if (repairs.length === 0) continue;
      total += repairs.length;
      console.log(`${rel}: ${repairs.length} empty container(s) ${check ? 'missing' : 'restored'}`);
      for (const p of repairs) console.log(`  ${p}`);
      if (!check) writeFileSync(abs, JSON.stringify(fixed, null, 2) + '\n');
    }
  }
  if (total === 0) {
    console.log('i18n weblate repair: no missing empty containers');
    return;
  }
  if (check) {
    console.error(`i18n weblate repair: ${total} empty container(s) dropped by the serializer - run npm run i18n:repair`);
    process.exit(1);
  }
  console.log(`i18n weblate repair: restored ${total} empty container(s) from ${baseRef.slice(0, 10)}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) main();
