// Build-time only: emit public key/length/hash metadata, never media bytes.
// Release git archives intentionally omit assets/fonts. Keep this path independent
// of source media; checkout-only tests verify every transformed CSS digest.
import { readFileSync, writeFileSync } from 'node:fs';
const manifest = JSON.parse(readFileSync(new URL('../../infra/media-static/manifest.json', import.meta.url), 'utf8'));
const css = JSON.parse(readFileSync(new URL('../../infra/media-static/pages-css-metadata.json', import.meta.url), 'utf8'));
const cssByKey = new Map(css.map((row) => [row.key, row]));
if (cssByKey.size !== css.length || css.length !== manifest.filter((row) => row.key.endsWith('.css')).length) throw new Error('Invalid Pages CSS metadata');
const rows = manifest.map(({ key, bytes, sha256 }) => {
  // Existing published Pages/B2 digest text was deliberately preserved during
  // the six-image-only upload, not overwritten with newer repo metadata.
  // 2026-11-15 full589asset response verification is the baseline.
  if (key === 'fonts/SHA256SUMS.txt')
    return {
      key,
      bytes: 79248,
      sha256: '13893f9ae39a3bfea97daae5a046d8aa7994aa3baae73b7aa211682ead54219f',
      pagesBytes: 79248,
      pagesSha256: '13893f9ae39a3bfea97daae5a046d8aa7994aa3baae73b7aa211682ead54219f',
    };
  const exported = key.endsWith('.css') ? cssByKey.get(key) : { bytes, sha256 };
  if (!exported || !Number.isSafeInteger(exported.bytes) || exported.bytes < 1 || !/^[a-f0-9]{64}$/.test(exported.sha256))
    throw new Error('Invalid Pages metadata: ' + key);
  return { key, bytes, sha256, pagesBytes: exported.bytes, pagesSha256: exported.sha256 };
});
writeFileSync(new URL('../dist/public-media-index.json', import.meta.url), JSON.stringify(rows) + '\n');
