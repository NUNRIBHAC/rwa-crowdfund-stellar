// Weblate roundtrip for transactional mail, kept separate from UI messages.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import { format, resolveConfig } from 'prettier';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const ts = resolve(root, 'backend/src/email-copy.ts');
const dir = resolve(root, 'frontend/i18n-json/mail');
const text = readFileSync(ts, 'utf8');
const js = text.replace('export const MAIL_COPY =', 'export default').replace(/ as const;\s*$/, ';');
const copy = (await import('data:text/javascript;base64,' + Buffer.from(js).toString('base64'))).default;
const mode = process.argv[2] ?? 'check';
const locales = ['en', 'pt', 'es', 'fr', 'de', 'ja', 'ko', 'zh-CN', 'zh-TW', 'ar', 'hi'];
const keys = Object.keys(copy.en);
const data = {};
mkdirSync(dir, { recursive: true });
for (const locale of locales) {
  const path = resolve(dir, locale + '.json');
  if (mode === 'export') {
    writeFileSync(path, await format(JSON.stringify(copy[locale]), { ...(await resolveConfig(path)), filepath: path }));
    continue;
  }
  data[locale] = JSON.parse(readFileSync(path, 'utf8'));
  if (JSON.stringify(Object.keys(data[locale]).sort()) !== JSON.stringify([...keys].sort())) throw new Error(locale + ': mail key set differs');
  for (const key of keys) {
    const value = data[locale][key];
    if (typeof value !== 'string' || !value.trim()) throw new Error(locale + '.' + key + ': expected nonempty mail string');
    const ph = (s) =>
      [...s.matchAll(/\{(\w+)\}/g)]
        .map((m) => m[1])
        .sort()
        .join();
    if (ph(value) !== ph(copy.en[key])) throw new Error(locale + '.' + key + ': mail placeholders differ');
    if (mode === 'check' && value !== copy[locale][key]) throw new Error(locale + '.' + key + ': mail JSON/TS drift');
  }
}
if (mode === 'import') {
  const content =
    '// Generated from frontend/i18n-json/mail/ by scripts/i18n-mail.mjs.\nexport const MAIL_COPY = ' + JSON.stringify(data, null, 2) + ' as const;\n';
  writeFileSync(ts, await format(content, { ...(await resolveConfig(ts)), filepath: ts }));
}
console.log('Mail catalogs: ' + mode + ' passed for ' + locales.length + ' locales.');
