// Build-time only: emit public key/length/hash metadata, never media bytes.
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { manifest, staticAsset } from '../../infra/media-static/export.mjs';
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
const rows = manifest.map(({ key, bytes, sha256 }) => {
  const exported = staticAsset(key);
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
  return { key, bytes, sha256, pagesBytes: exported.length, pagesSha256: digest(exported) };
});
writeFileSync(new URL('../dist/public-media-index.json', import.meta.url), JSON.stringify(rows) + '\n');
