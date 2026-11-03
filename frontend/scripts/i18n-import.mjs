// Regenerate the i18n TS sources from the Weblate-facing JSON files
// (frontend/i18n-json/). This is the return path for translations edited in
// Weblate: JSON in, canonical TS out, prettier-normalized.
//
// Regeneration replaces the whole file: comments inside locale/legal files do
// not survive a sync, so documentation belongs in the header or the schema
// types, not inline.
//
// Non-translatable leaves (empty optional fields, numeric answer indices)
// are absent from the JSON by design (see i18n-export.mjs); they are
// re-injected from the English TS tree so the regenerated TS stays whole.
// A locale may not add content where the English base is blank or numeric,
// and may not drop any translatable base key.
//
// --check: verify the TS sources' DATA matches the JSON (semantic compare,
// not byte compare), exit 1 on drift. Complements i18n-export --check so both
// directions of the projection are proven lossless in CI.
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';
import { isMachineField } from './i18n-machine-fields.mjs';
import { blocksToJson, jsonToBlocks, validateLegalAgainstBase } from './i18n-legal-codec.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const LOCALES = ['en', 'pt', 'es', 'fr', 'de', 'zh-TW', 'zh-CN', 'ja', 'ko', 'ar', 'hi'];
const VAR_NAMES = { 'zh-TW': 'zhTW', 'zh-CN': 'zhCN' };
const LEGAL_DOCS = ['termsOfService', 'privacyPolicy', 'riskDisclosure', 'legalNotice', 'conflictsOfInterest', 'complaintsManagement', 'businessContinuity'];
const HEADER =
  '// Generated from frontend/i18n-json/ by scripts/i18n-import.mjs.\n// Edit the JSON (Weblate) or this file, then run npm run i18n:export / i18n:import to sync.\n';

function toJs(source) {
  let s = source;
  s = s.replace(/^import type[^\n]*\n/gm, '');
  s = s.replace(/^export type[^\n]*\n/gm, '');
  s = s.replace(/export const (\w+)(: [A-Za-z[\]{}'; |]+)? = /, 'export default ');
  s = s.replace(/ as Record<string, string>/g, '');
  s = s.replace(/ as \{[^}]*\}\[\]/g, '');
  s = s.replace(/ as string\[\]/g, '');
  return s;
}

async function loadTsModule(absPath) {
  const js = toJs(readFileSync(absPath, 'utf8'));
  const url = 'data:text/javascript;base64,' + Buffer.from(js).toString('base64');
  const mod = await import(url);
  return mod.default;
}

function varName(locale) {
  return VAR_NAMES[locale] ?? locale;
}

// Components index these maps with runtime strings, so the committed sources
// widen them with `as Record<string, string>`. JSON cannot carry the cast, so
// regeneration re-applies it at the same three keys (loadTsModule strips it
// again for the projection - the roundtrip stays stable).
const RECORD_CAST_KEYS = ['industryLabels', 'statusLabels', 'actionLabels'];
const RECORD_CAST_RE = new RegExp(`^(\\s*)"(${RECORD_CAST_KEYS.join('|')})": \\{$`);
function applyRecordCasts(ts) {
  const lines = ts.split('\n');
  const pending = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(RECORD_CAST_RE);
    if (m) {
      pending.push(m[1]);
      continue;
    }
    // The cast target can be the last property of its object, so the closing
    // brace may carry no trailing comma.
    if (pending.length > 0 && (lines[i] === `${pending[pending.length - 1]}},` || lines[i] === `${pending[pending.length - 1]}}`)) {
      const indent = pending.pop();
      lines[i] = lines[i].endsWith(',') ? `${indent}} as Record<string, string>,` : `${indent}} as Record<string, string>`;
    }
  }
  return ts === applyRecordCasts.__last ? ts : lines.join('\n');
}

function renderLocale(locale, tree) {
  const body = applyRecordCasts(JSON.stringify(tree, null, 2));
  if (locale === 'en') {
    return `${HEADER}\nexport const en = ${body};\n\nexport type Messages = typeof en;\n`;
  }
  return `${HEADER}\nimport type { Messages } from './en';\n\nexport const ${varName(locale)}: Messages = ${body};\n`;
}

function renderLegal(blocks) {
  return `${HEADER}\nimport type { LegalBlock } from './types';\n\nexport const blocks: LegalBlock[] = ${JSON.stringify(blocks, null, 2)};\n`;
}

function deepEqual(a, b, path, diffs) {
  if (typeof a !== typeof b) {
    diffs.push(`${path}: type ${typeof a} vs ${typeof b}`);
    return;
  }
  if (a === null || b === null || typeof a !== 'object') {
    if (a !== b) diffs.push(`${path}: value differs`);
    return;
  }
  const aArr = Array.isArray(a),
    bArr = Array.isArray(b);
  if (aArr !== bArr) {
    diffs.push(`${path}: array vs object`);
    return;
  }
  if (aArr) {
    if (a.length !== b.length) {
      diffs.push(`${path}: array length ${a.length} vs ${b.length}`);
      return;
    }
    a.forEach((v, i) => deepEqual(v, b[i], `${path}[${i}]`, diffs));
    return;
  }
  const ka = Object.keys(a),
    kb = Object.keys(b);
  if (ka.length !== kb.length || ka.some((k, i) => k !== kb[i])) {
    diffs.push(`${path}: key set/order differs`);
    return;
  }
  for (const k of ka) deepEqual(a[k], b[k], `${path}.${k}`, diffs);
}

// Overlay the projected JSON onto the English base tree: JSON leaves win,
// leaves the projection deliberately omits (blank strings, non-string
// scalars) come back from the base. Validated before merging, so a type
// mismatch can never cross the overlay.
function mergeOverBase(base, value, path = '') {
  if (isMachineField(path)) return base;
  if (typeof base === 'string' || base === null || typeof base !== 'object') {
    return value === undefined ? base : value;
  }
  if (Array.isArray(base)) {
    return base.map((b, i) => mergeOverBase(b, Array.isArray(value) ? value[i] : undefined, `${path}[${i}]`));
  }
  const out = {};
  for (const k of Object.keys(base)) out[k] = mergeOverBase(base[k], value?.[k], `${path}.${k}`);
  return out;
}

// Every translatable string leaf's {placeholder} set and every { one, other }
// leaf's shape must match the English base exactly: translators edit values,
// never the variable contract or the plural structure. Leaves the projection
// omits (base value is a blank string or a non-string scalar) must stay
// absent; adding content there is rejected. Arrays keep the base's length
// (per-locale arrays are parallel structures, e.g. legal blocks).
function validateAgainstBase(base, value, path, diffs) {
  if (isMachineField(path)) {
    if (value !== undefined && value !== null) diffs.push(`${path}: machine field must stay out of the projection`);
    return;
  }
  if (typeof base === 'string' && base.trim() === '') {
    if (value !== undefined) diffs.push(`${path}: blank base field must stay out of the projection`);
    return;
  }
  if (base === null || (typeof base !== 'object' && typeof base !== 'string')) {
    if (value !== undefined) diffs.push(`${path}: non-translatable ${typeof base} leaf must stay out of the projection`);
    return;
  }
  if (typeof base === 'string' && typeof value === 'string') {
    const ph = (t) => [...t.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
    const a = ph(base),
      b = ph(value);
    if (a.join(',') !== b.join(',')) diffs.push(`${path}: placeholders {${a}} vs {${b}}`);
    return;
  }
  if (typeof base !== typeof value) {
    diffs.push(`${path}: type ${typeof base} vs ${typeof value}`);
    return;
  }
  if (base === null || typeof base !== 'object') {
    if (typeof base !== typeof value) diffs.push(`${path}: primitive type differs`);
    return;
  }
  const bArr = Array.isArray(base),
    vArr = Array.isArray(value);
  if (bArr !== vArr) {
    diffs.push(`${path}: array vs object`);
    return;
  }
  if (bArr) {
    if (base.length !== value.length) {
      diffs.push(`${path}: array length ${value.length} vs base ${base.length}`);
      return;
    }
    base.forEach((v, i) => validateAgainstBase(v, value[i], `${path}[${i}]`, diffs));
    return;
  }
  const kb = Object.keys(base),
    kv = Object.keys(value);
  // Keys whose base value the projection omits (blank strings, non-string
  // scalars) are not required in the JSON; everything else is.
  const required = kb.filter((k) => {
    const b = base[k];
    if (isMachineField(`${path}.${k}`)) return false;
    if (typeof b === 'string') return b.trim() !== '';
    return b !== null && typeof b === 'object';
  });
  if (required.some((k) => !(k in value))) {
    diffs.push(`${path}: missing keys ${required.filter((k) => !(k in value))}`);
    return;
  }
  for (const k of kv) {
    if (!(k in base)) {
      diffs.push(`${path}: unexpected key ${k}`);
      continue;
    }
    validateAgainstBase(base[k], value[k], `${path}.${k}`, diffs);
  }
}

const check = process.argv.includes('--check');
const drift = [];
const written = [];

const enTree = await loadTsModule(join(ROOT, 'src/i18n/locales/en.ts'));

for (const locale of LOCALES) {
  const uiJson = JSON.parse(readFileSync(join(ROOT, 'i18n-json/ui', `${locale}.json`), 'utf8'));
  const legalJson = JSON.parse(readFileSync(join(ROOT, 'i18n-json/legal', `${locale}.json`), 'utf8'));

  if (check) {
    const diffs = [];
    validateAgainstBase(enTree, uiJson, `ui.${locale}`, diffs);
    deepEqual(await loadTsModule(join(ROOT, 'src/i18n/locales', `${locale}.ts`)), mergeOverBase(enTree, uiJson), `ui.${locale}`, diffs);
    const hasTs = (doc) => existsSync(join(ROOT, 'src/i18n/legal', `${doc}.${locale}.ts`));
    if (locale !== 'en') {
      // Docs with no per-locale TS file are intentionally untranslated (the
      // resolver serves English); they stay out of the JSON and out of the
      // base comparison instead of pretending a stale translation exists.
      const legalBase = JSON.parse(readFileSync(join(ROOT, 'i18n-json/legal/en.json'), 'utf8'));
      const baseFiltered = Object.fromEntries(Object.entries(legalBase).filter(([d]) => hasTs(d)));
      const jsonFiltered = Object.fromEntries(Object.entries(legalJson).filter(([d]) => hasTs(d)));
      validateLegalAgainstBase(baseFiltered, jsonFiltered, `legal.${locale}`, diffs);
    }
    for (const doc of LEGAL_DOCS) {
      if (!(doc in legalJson)) {
        if (hasTs(doc)) diffs.push(`legal.${locale}.${doc}: missing from JSON`);
        continue;
      }
      if (!hasTs(doc)) {
        diffs.push(`legal.${locale}.${doc}: JSON present but no TS source (untranslated docs use the English fallback)`);
        continue;
      }
      let projected;
      try {
        projected = blocksToJson(await loadTsModule(join(ROOT, 'src/i18n/legal', `${doc}.${locale}.ts`)), `legal.${locale}.${doc}`);
      } catch (e) {
        diffs.push(`legal.${locale}.${doc}: TS projection failed: ${e.message}`);
        continue;
      }
      deepEqual(projected, legalJson[doc], `legal.${locale}.${doc}`, diffs);
    }
    for (const doc of LEGAL_DOCS) {
      if (!(doc in legalJson)) continue;
      try {
        jsonToBlocks(legalJson[doc], `legal.${locale}.${doc}`);
      } catch (e) {
        diffs.push(`legal.${locale}.${doc}: JSON does not decode: ${e.message}`);
      }
    }
    const extra = Object.keys(legalJson).filter((d) => !LEGAL_DOCS.includes(d));
    for (const d of extra) diffs.push(`legal.${locale}.${d}: unknown doc in JSON`);
    if (diffs.length > 0) drift.push(...diffs);
    continue;
  }

  const uiDiffs = [];
  validateAgainstBase(enTree, uiJson, `ui.${locale}`, uiDiffs);
  if (uiDiffs.length > 0) throw new Error(`ui.${locale}: projection rejected:\n  ${uiDiffs.join('\n  ')}`);
  writeFileSync(join(ROOT, 'src/i18n/locales', `${locale}.ts`), renderLocale(locale, mergeOverBase(enTree, uiJson)));
  written.push(`locales/${locale}.ts`);
  for (const doc of LEGAL_DOCS) {
    if (!(doc in legalJson)) {
      if (existsSync(join(ROOT, 'src/i18n/legal', `${doc}.${locale}.ts`))) throw new Error(`legal.${locale}.${doc}: missing from JSON`);
      continue; // intentionally untranslated: resolver falls back to English
    }
    writeFileSync(join(ROOT, 'src/i18n/legal', `${doc}.${locale}.ts`), renderLegal(jsonToBlocks(legalJson[doc], `legal.${locale}.${doc}`)));
  }
  written.push(`legal/*.${locale}.ts`);
}

if (check) {
  if (drift.length > 0) {
    console.error('i18n TS/JSON semantic drift - run npm run i18n:import or i18n:export to sync:');
    for (const d of drift.slice(0, 20)) console.error('  ' + d);
    if (drift.length > 20) console.error(`  ... and ${drift.length - 20} more`);
    process.exit(1);
  }
  console.log('i18n TS sources are semantically in sync with the JSON projection.');
} else {
  execFileSync('npx', ['prettier', '--write', 'src/i18n/locales', 'src/i18n/legal'], { cwd: ROOT, stdio: 'inherit' });
  console.log(`regenerated ${written.length} locale groups from frontend/i18n-json/`);
}
