// Export the i18n sources to Weblate-consumable nested monolingual JSON.
//
//   frontend/i18n-json/ui/<locale>.json    - the full UI message tree
//   frontend/i18n-json/legal/<locale>.json - the 7 legal documents, nested by doc id,
//     blocks encoded via scripts/i18n-legal-codec.mjs: one string unit per
//     translatable sentence (inline <b>/<i> markup and {v:name} constants
//     preserved in the text), block structure carried in the key path only -
//     no type discriminators or split fragments as translator units.
//
// 11 locales: en pt es fr de zh-TW zh-CN ja ko ar hi. English is the base.
// The dictionaries are plain data (placeholders as {var} substrings, plurals
// as { one, other } leaves), so the JSON is a lossless projection.
//
// --check: verify the committed JSON matches the TS sources, exit 1 on drift.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { format, resolveConfig } from 'prettier';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { blocksToJson } from './i18n-legal-codec.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'i18n-json');
const LOCALES = ['en', 'pt', 'es', 'fr', 'de', 'zh-TW', 'zh-CN', 'ja', 'ko', 'ar', 'hi'];
const LEGAL_DOCS = ['termsOfService', 'privacyPolicy', 'riskDisclosure', 'legalNotice', 'conflictsOfInterest', 'complaintsManagement', 'businessContinuity'];

// Strip the TS-only syntax so the module can be imported as plain JS. The
// dictionaries contain no functions anymore; anything left over fails the
// JSON-safety validation below, loudly.
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

function assertJsonSafe(value, path) {
  if (value === undefined) throw new Error(`${path}: undefined value would silently drop a key in JSON`);
  if (typeof value === 'function') throw new Error(`${path}: function leaf is not JSON-exportable`);
  if (typeof value === 'number' && !Number.isFinite(value)) throw new Error(`${path}: non-finite number`);
  if (value === null || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    value.forEach((v, i) => assertJsonSafe(v, `${path}[${i}]`));
    return;
  }
  if (Object.getPrototypeOf(value) !== Object.prototype) throw new Error(`${path}: non-plain object`);
  for (const [k, v] of Object.entries(value)) assertJsonSafe(v, `${path}.${k}`);
}

function render(tree) {
  return JSON.stringify(tree, null, 2) + '\n';
}

const check = process.argv.includes('--check');
const drift = [];

// Output is prettier-formatted in memory so the committed files satisfy
// format:check AND stay byte-identical to a fresh export (no CI fight).
async function emit(relPath, raw) {
  const abs = join(OUT, relPath);
  const content = await format(raw, { ...(await resolveConfig(abs)), filepath: abs });
  if (check) {
    const existing = existsSync(abs) ? readFileSync(abs, 'utf8') : null;
    if (existing !== content) drift.push(relPath);
  } else {
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, content);
  }
}

for (const locale of LOCALES) {
  const ui = await loadTsModule(join(ROOT, 'src/i18n/locales', `${locale}.ts`));
  assertJsonSafe(ui, `ui.${locale}`);
  await emit(join('ui', `${locale}.json`), render(ui));

  const legal = {};
  for (const doc of LEGAL_DOCS) {
    legal[doc] = blocksToJson(await loadTsModule(join(ROOT, 'src/i18n/legal', `${doc}.${locale}.ts`)), `legal.${locale}.${doc}`);
  }
  assertJsonSafe(legal, `legal.${locale}`);
  await emit(join('legal', `${locale}.json`), render(legal));
}

if (check) {
  if (drift.length > 0) {
    console.error('i18n JSON drift - run npm run i18n:export and commit the result:');
    for (const f of drift) console.error('  ' + f);
    process.exit(1);
  }
  console.log('i18n JSON is in sync with the TS sources.');
} else {
  console.log(`exported ${LOCALES.length} UI + ${LOCALES.length} legal JSON files to frontend/i18n-json/`);
}
