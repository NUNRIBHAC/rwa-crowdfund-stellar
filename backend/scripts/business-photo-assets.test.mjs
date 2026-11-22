import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { manifest, staticAsset } from '../../infra/media-static/export.mjs';
const records = JSON.parse(readFileSync(new URL('../../infra/media-static/business-photo-provenance.json', import.meta.url), 'utf8'));
test('all 44 illustrative business photos have seven bounded, hash-verified derivatives and source records', () => {
  assert.equal(records.length, 44);
  assert.equal(new Set(records.map((row) => row.campaignId)).size, 44);
  const selected = manifest.filter((row) => row.key.startsWith('campaigns/businesses-20261122/'));
  assert.equal(selected.length, 308);
  assert.equal(new Set(selected.map((row) => row.key)).size, 308);
  for (const row of records) {
    assert.match(row.sourceURL, /^https:\/\/(unsplash\.com|www\.pexels\.com)\//);
    assert.ok(row.creators.length);
    assert.ok(row.licenses.length);
    assert.equal(row.assets.length, 7);
    assert.deepEqual(
      row.assets.map((asset) => asset.key.slice(row.base.length)),
      ['480.avif', '480.webp', '800.avif', '800.webp', '1280.avif', '1280.webp', 'jpg'],
    );
    for (const asset of row.assets) {
      assert.ok(asset.bytes > 0 && asset.bytes < 1048576);
      const bytes = staticAsset(asset.key);
      assert.equal(bytes.length, asset.bytes, asset.key);
      assert.equal(createHash('sha256').update(bytes).digest('hex'), asset.sha256, asset.key);
      assert.deepEqual(
        manifest.find((entry) => entry.key === asset.key),
        asset,
      );
    }
  }
});
