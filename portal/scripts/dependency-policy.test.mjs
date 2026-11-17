import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { URL } from 'node:url';
const root = new URL('../', import.meta.url);
test('portal locks patched worker/serializer versions without hiding advisories', () => {
  const pkg = JSON.parse(readFileSync(new URL('package.json', root), 'utf8'));
  const lock = JSON.parse(readFileSync(new URL('package-lock.json', root), 'utf8'));
  assert.equal(pkg.overrides.tinypool, '2.2.0');
  assert.equal(pkg.overrides['serialize-javascript'], '7.1.4');
  for (const [name, version] of Object.entries(pkg.overrides)) {
    const matches = Object.entries(lock.packages).filter(([key]) => key.endsWith('/' + name));
    assert.ok(matches.length > 0, name);
    for (const [, value] of matches) assert.equal(value.version, version);
  }
});
test('CI explicitly audits and builds the independently locked public/private portal', () => {
  const workflow = readFileSync(new URL('../.github/workflows/ci.yml', root), 'utf8');
  assert.match(workflow, /node portal\/scripts\/audit-with-exceptions.mjs/);
  assert.match(workflow, /npm ci --prefix portal --ignore-scripts/);
  assert.match(workflow, /node --test portal\/scripts\/dependency-policy.test.mjs/);
  assert.match(workflow, /node portal\/scripts\/check-build-isolation.mjs/);
});

test('audit exception file is valid and every entry has a removal trigger', () => {
  const raw = readFileSync(new URL('.audit-exceptions.json', root), 'utf8');
  const parsed = JSON.parse(raw);
  assert.ok(Array.isArray(parsed.exceptions));
  for (const e of parsed.exceptions) {
    assert.ok(typeof e.id === 'string' && e.id.length > 0, 'exception id required');
    assert.ok(typeof e.title === 'string' && e.title.length > 0, 'exception title required');
    assert.ok(typeof e.severity === 'string', 'exception severity required');
    assert.ok(typeof e.package === 'string' && e.package.length > 0, 'exception package required');
    assert.ok(typeof e.affectedRange === 'string', 'exception affectedRange required');
    assert.ok(typeof e.removalTrigger === 'string' && e.removalTrigger.length > 0, 'exception removalTrigger required');
    assert.ok(typeof e.reason === 'string' && e.reason.length > 0, 'exception reason required');
  }
});

test('patched serializer and worker retain the portal call shapes', async () => {
  const { default: serialize } = await import('serialize-javascript');
  const { default: Tinypool } = await import('tinypool');
  const { mkdtempSync, writeFileSync, rmSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const dir = mkdtempSync(join(tmpdir(), 'portal-worker-'));
  let pool;
  try {
    const worker = join(dir, 'worker.mjs');
    writeFileSync(worker, 'export default (task) => ({ rendered: task.pathnames.length });\n');
    pool = new Tinypool({ filename: worker, minThreads: 1, maxThreads: 1, runtime: 'worker_threads', isolateWorkers: false });
    assert.deepEqual(await pool.run({ pathnames: ['/docs/one', '/docs/two'] }), { rendered: 2 });
    assert.equal(serialize({ test: 'value' }), '{"test":"value"}');
    assert.ok(!serialize({ test: '</script>' }).includes('</script>'));
  } finally {
    await pool?.destroy();
    rmSync(dir, { recursive: true, force: true });
  }
});
