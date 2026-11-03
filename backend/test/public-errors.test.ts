import { test } from 'node:test';
import assert from 'node:assert/strict';
import { publicFailure } from '../src/public-errors.js';
test('public failure never returns arbitrary error text or upstream codes', () => {
  for (const e of [new Error('SQL password diagnostic'), 'upstream body', { message: 'private', code: 'ECONNRESET' }, null]) {
    assert.deepEqual(publicFailure(e), { error: 'The request could not be completed. Please try again later.', code: 'API_UNAVAILABLE' });
  }
});
test('public failure preserves only known localized simulation codes', () => {
  for (const code of ['SIM_TRUSTLINE_MISSING', 'SIM_ACCOUNT_MISSING', 'SIM_INSUFFICIENT_BALANCE', 'SIM_REJECTED']) {
    assert.equal(publicFailure({ code, message: 'private SDK dump' }).code, code);
  }
  assert.equal(publicFailure({ code: 'constructor' }).code, 'API_UNAVAILABLE');
});
