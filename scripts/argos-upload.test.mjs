import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { URL } from 'node:url';
import { QUOTA_MESSAGE, SKIPPED_MESSAGE, isScreenshotQuotaError, uploadScreenshots } from './argos-upload.mjs';

for (const [name, error] of Object.entries({
  'exact APIError message': { status: 402, message: QUOTA_MESSAGE },
  'exact APIError data': { status: 402, data: { error: QUOTA_MESSAGE } },
})) {
  test(`known quota: ${name}`, async () => {
    const warnings = [];
    let calls = 0;
    const result = await uploadScreenshots(
      async () => {
        calls++;
        throw error;
      },
      (message) => warnings.push(message),
    );
    assert.equal(calls, 1);
    assert.deepEqual(result, { status: 'skipped', reason: 'screenshot-capacity' });
    assert.deepEqual(warnings, [`::warning::${SKIPPED_MESSAGE}`]);
  });
}

for (const [name, error] of Object.entries({
  'unrelated payment 402': { status: 402, message: 'Payment method refused' },
  '401 with quota message': { status: 401, message: QUOTA_MESSAGE },
  '403 with Free Plan': { status: 403, message: 'Free Plan token invalid' },
  '500 with quota data': { status: 500, data: { error: QUOTA_MESSAGE } },
  'network failure': new Error('Network failed'),
  'only Free Plan substring': { status: 402, message: 'Free Plan unavailable' },
  'extended message': { status: 402, message: `${QUOTA_MESSAGE} Other error` },
  'missing status': { message: QUOTA_MESSAGE },
  'string status': { status: '402', message: QUOTA_MESSAGE },
  'missing message': { status: 402 },
  'null error': null,
  'undefined error': undefined,
})) {
  test(`other errors remain fatal: ${name}`, async () => {
    assert.equal(isScreenshotQuotaError(error), false);
    const warnings = [];
    let caught = false;
    try {
      await uploadScreenshots(
        async () => {
          throw error;
        },
        (message) => warnings.push(message),
      );
    } catch (actual) {
      caught = true;
      assert.equal(actual, error);
    }
    assert.equal(caught, true);
    assert.deepEqual(warnings, []);
  });
}

test('successful upload keeps exact capture options and emits no warning', async () => {
  const warnings = [];
  const result = await uploadScreenshots(
    async (options) => {
      assert.deepEqual(options, { root: 'screenshots', files: ['**/*.png'] });
    },
    (message) => warnings.push(message),
  );
  assert.deepEqual(result, { status: 'uploaded' });
  assert.deepEqual(warnings, []);
});

test('capture failures cannot be bypassed and upload retains main-only secret gate', () => {
  const workflow = readFileSync(new URL('../.github/workflows/visual.yml', import.meta.url), 'utf8');
  assert.match(workflow, /run: npx playwright test/);
  assert.doesNotMatch(workflow, /continue-on-error|always\(\)|\|\| true/);
  assert.match(workflow, /if: github.ref == 'refs\/heads\/main' && \(github.event_name == 'push' \|\| github.event_name == 'workflow_dispatch'\)/);
  assert.match(workflow, /run: node \.\.\/scripts\/argos-upload\.mjs/);
  assert.match(workflow, /run: node --test scripts\/argos-upload\.test\.mjs/);
  assert.ok(workflow.indexOf('run: npx playwright test') < workflow.indexOf('- name: Upload screenshots'));
});
