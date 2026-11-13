import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { manifest, staticAsset, exportStatic } from './export.mjs';
import { mediaOrigin, publicMediaPlugin } from '../../frontend/scripts/public-media-build.mjs';

test('all public files verify, aliases match and unknown/private paths fail', () => {
  assert.equal(manifest.length, 558);
  for (const item of manifest) assert.ok(staticAsset(item.key).length > 0, item.key);
  assert.deepEqual(staticAsset('social/x.svg'), staticAsset('social icons/x.svg'));
  assert.deepEqual(staticAsset('blockallisto-lockup-horizontal.svg'), staticAsset('logo/blockallisto-lockup-horizontal.svg'));
  assert.throws(() => staticAsset('../private/file.txt'));
  assert.throws(() => staticAsset('private/secret.txt'));
});
test('font CSS is independent of Worker, using portable relative paths', () => {
  const css = staticAsset('fonts/css/noto-sans-kr.css').toString();
  assert.ok(!css.includes('workers.dev'));
  assert.ok(css.includes('../noto-sans-kr/'));
});
test('Pages export is static only and has a checksum for every file', () => {
  const dir = mkdtempSync(join(tmpdir(), 'public-media-test-'));
  try {
    const out = join(dir, 'new');
    const count = exportStatic(out);
    const sums = JSON.parse(readFileSync(join(out, 'checksums.json'), 'utf8'));
    assert.equal(count, sums.length);
    assert.throws(() => exportStatic(out));
    assert.ok(readFileSync(join(out, '_headers'), 'utf8').includes('Access-Control-Allow-Origin: *'));
  } finally {
    rmSync(dir, { recursive: true });
  }
});
test('single exact origin, font secondary source, no widened origin syntax', () => {
  for (const bad of ['http://example.com', 'https://example.com/path', 'https://*.example.com', 'https://example.com x']) assert.throws(() => mediaOrigin(bad));
  const origin = 'https://test.invalid';
  const plugin = publicMediaPlugin(origin);
  const code = "@font-face { src: url('https://blockallisto-media.nunrib-df6.workers.dev/fonts/inter-400.woff2') format('woff2'); }";
  const output = plugin.transform(code, '/repo/frontend/src/styles.css').code;
  assert.ok(output.includes(origin + '/fonts/inter-400.woff2'));
  assert.ok(output.includes("url('/media/fonts/inter-400.woff2')"));
  assert.ok(!output.includes('workers.dev'));
});
