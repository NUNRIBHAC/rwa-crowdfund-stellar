import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { manifest, staticAsset } from '../../infra/media-static/export.mjs';
const root = fileURLToPath(new URL('../../', import.meta.url));
const metadata = JSON.parse(readFileSync(new URL('../../infra/media-static/pages-css-metadata.json', import.meta.url), 'utf8'));

test('metadata covers exactly every transformed CSS asset with verified source hashes', () => {
  assert.deepEqual(
    metadata.map((row) => row.key).sort(),
    manifest
      .filter((row) => row.key.endsWith('.css'))
      .map((row) => row.key)
      .sort(),
  );
  for (const row of metadata) {
    const bytes = staticAsset(row.key);
    assert.equal(row.bytes, bytes.length, row.key);
    assert.equal(row.sha256, createHash('sha256').update(bytes).digest('hex'), row.key);
  }
});

test('release git archive builds identical media index without any font source directory', () => {
  const dir = mkdtempSync(join(tmpdir(), 'media-index-archive-'));
  try {
    const archive = join(dir, 'release.tar');
    execFileSync('git', ['archive', '--format=tar', '-o', archive, 'HEAD'], { cwd: root });
    const target = join(dir, 'release');
    mkdirSync(target);
    execFileSync('tar', ['-xf', archive, '-C', target]);
    assert.equal(existsSync(join(target, 'assets/fonts')), false, 'keep font export-ignore');
    assert.equal(
      existsSync(join(target, 'frontend/media-external/campaigns/businesses-20261122')),
      false,
      'campaign photo bytes stay outside VM build archives',
    );
    mkdirSync(join(target, 'backend/dist'), { recursive: true });
    execFileSync(process.execPath, ['backend/scripts/media-index.mjs'], { cwd: target });
    const rows = JSON.parse(readFileSync(join(target, 'backend/dist/public-media-index.json'), 'utf8'));
    assert.equal(rows.length, manifest.length);
    for (const row of rows) {
      if (row.key === 'fonts/SHA256SUMS.txt') {
        assert.deepEqual(row, {
          key: row.key,
          bytes: 79248,
          sha256: '13893f9ae39a3bfea97daae5a046d8aa7994aa3baae73b7aa211682ead54219f',
          pagesBytes: 79248,
          pagesSha256: '13893f9ae39a3bfea97daae5a046d8aa7994aa3baae73b7aa211682ead54219f',
        });
        continue;
      }
      const source = manifest.find((item) => item.key === row.key);
      assert.equal(row.bytes, source.bytes, row.key);
      assert.equal(row.sha256, source.sha256, row.key);
      const bytes = staticAsset(row.key);
      assert.equal(row.pagesBytes, bytes.length, row.key);
      assert.equal(row.pagesSha256, createHash('sha256').update(bytes).digest('hex'), row.key);
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
