// Build both real audience configurations with a temporary private canary.
// A public build must never contain the canary or register an internal route.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, readdirSync, rmSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import { join } from 'node:path';
import process from 'node:process';
import console from 'node:console';
const portal = fileURLToPath(new URL('../', import.meta.url));
const fixture = join(portal, 'docs-internal', 'ci-private-isolation-canary.md');
const marker = 'BLOCKALLISTO_PRIVATE_AUDIENCE_CANARY_9d1b7c';
const audience = process.argv[2];
assert.ok(['public', 'internal'].includes(audience), 'provide public or internal audience');
function build(audience) {
  const result = spawnSync(process.execPath, ['node_modules/@docusaurus/core/bin/docusaurus.mjs', 'build', '--out-dir', 'build-' + audience], {
    cwd: portal,
    env: { ...process.env, DOCS_AUDIENCE: audience },
    stdio: 'inherit',
  });
  if (result.error) throw result.error;
  assert.equal(result.status, 0, audience + ' build failed');
}
function* files(dir) {
  for (const item of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, item.name);
    if (item.isDirectory()) yield* files(path);
    else yield path;
  }
}
let wrote = false;
try {
  writeFileSync(fixture, '# Private audience isolation canary\n\n' + marker + '\n', { flag: 'wx' });
  wrote = true;
  build(audience);
  if (audience === 'public') {
    let inspected = 0;
    for (const path of files(join(portal, 'build-public'))) {
      if (!/\.(html|js|json|xml|txt|map)$/.test(path)) continue;
      const text = readFileSync(path, 'utf8');
      assert.ok(!text.includes(marker), 'private canary in public output: ' + path);
      if (path.endsWith('.xml') || path.endsWith('.html'))
        assert.ok(!/https?:[^\s<"']*\/internal\//.test(text), 'internal route in public HTML/sitemap: ' + path);
      inspected++;
    }
    assert.ok(inspected > 0, 'public artifact scan must not be empty');
    console.log('Portal public isolation passed; scanned ' + inspected + ' artifacts.');
  } else {
    const internalPage = join(portal, 'build-internal', 'internal', 'ci-private-isolation-canary', 'index.html');
    assert.ok(readFileSync(internalPage, 'utf8').includes(marker), 'internal fixture must actually render');
    console.log('Portal internal build passed; private canary rendered.');
  }
} finally {
  if (wrote) rmSync(fixture);
}
