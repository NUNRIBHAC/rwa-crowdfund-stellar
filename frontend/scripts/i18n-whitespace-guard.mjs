#!/usr/bin/env node
// i18n whitespace composition regression guard.
//
// Guards the class of damage from 2026-11-05/06: silent leading/trailing
// whitespace changes in locale files (e.g. a dropped or introduced edge
// space), which Weblate's begin/end-space checks cannot reliably separate
// from legitimate locale typography.
//
// This is NOT an English-parity rule: it never compares a locale against
// the English source. It records the APPROVED edge-whitespace composition
// of every unit in every locale (baseline) and fails only when the
// composition CHANGES relative to that baseline. Intentional typography
// (CJK fullwidth punctuation without a leading space, French guillemet
// spacing, de/hi legal strings with a leading joiner space, RTL marks)
// stays valid because it is captured in the baseline itself.
//
// Usage:
//   node scripts/i18n-whitespace-guard.mjs --check   # CI: fail on any diff
//   node scripts/i18n-whitespace-guard.mjs --write   # regenerate baseline
//     (run --write only together with the intentional locale change itself,
//      in the same commit, so the diff documents the approval)
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const UI_DIR = path.resolve(here, '../i18n-json/ui');
const BASELINE = path.join(UI_DIR, '.whitespace-baseline.json');

const cls = (ch) => {
  if (ch === ' ') return 'SP';
  if (ch === ' ') return 'NBSP';
  if (ch === '\n') return 'NL';
  if (ch === '\t') return 'TAB';
  if (ch === '‎') return 'LRM';
  if (ch === '‏') return 'RLM';
  if (ch === '؜') return 'ALM';
  const cp = ch.codePointAt(0);
  // Other Unicode space separators (Zs): narrow no-break space etc.
  if ((cp >= 0x2000 && cp <= 0x200a) || cp === 0x202f || cp === 0x205f || cp === 0x3000 || cp === 0x1680) return 'Z';
  return null;
};

const signature = (s) => {
  const lead = [];
  let i = 0;
  while (i < s.length && cls(s[i])) {
    lead.push(cls(s[i]));
    i += 1;
  }
  const trail = [];
  let j = s.length - 1;
  while (j >= i && cls(s[j])) {
    trail.unshift(cls(s[j]));
    j -= 1;
  }
  return `${lead.join('+') || '-'}|${trail.join('+') || '-'}`;
};

const flatten = (obj, prefix = '', out = {}) => {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object') flatten(v, key, out);
    else if (typeof v === 'string') out[key] = v;
  }
  return out;
};

const collect = () => {
  const current = {};
  for (const fn of readdirSync(UI_DIR)) {
    if (!fn.endsWith('.json') || fn.startsWith('.')) continue;
    const locale = fn.replace(/\.json$/, '');
    const data = flatten(JSON.parse(readFileSync(path.join(UI_DIR, fn), 'utf8')));
    for (const [key, value] of Object.entries(data)) {
      current[`${locale}${key}`] = signature(value);
    }
  }
  return current;
};

const mode = process.argv[2];
const current = collect();

if (mode === '--write') {
  writeFileSync(BASELINE, `${JSON.stringify(current, null, 2)}\n`);
  console.log(`baseline written: ${Object.keys(current).length} unit signatures`);
  process.exit(0);
}
if (mode !== '--check') {
  console.error('usage: i18n-whitespace-guard.mjs --check | --write');
  process.exit(2);
}

if (!readFileSync(BASELINE, 'utf8')) {
  console.error('baseline missing or unreadable; run --write with an intentional-change commit');
  process.exit(2);
}
const baseline = JSON.parse(readFileSync(BASELINE, 'utf8'));

const problems = [];
for (const [id, sig] of Object.entries(current)) {
  if (!(id in baseline)) problems.push(`NEW unit without baseline entry: ${id} (${sig})`);
  else if (baseline[id] !== sig) problems.push(`composition changed: ${id} baseline=${baseline[id]} current=${sig}`);
}
for (const id of Object.keys(baseline)) {
  if (!(id in current)) problems.push(`unit removed but still in baseline: ${id}`);
}

if (problems.length) {
  console.error(`whitespace composition guard: ${problems.length} violation(s)`);
  for (const p of problems.slice(0, 50)) console.error(`  ${p}`);
  console.error('If the change is intentional locale typography, regenerate with --write in the same commit.');
  process.exit(1);
}
console.log(`whitespace composition guard: OK (${Object.keys(current).length} units match baseline)`);
