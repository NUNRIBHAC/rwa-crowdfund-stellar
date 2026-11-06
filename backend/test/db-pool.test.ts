import { test } from 'node:test';
import assert from 'node:assert/strict';
import { poolMaxFromEnv } from '../src/db-pool.js';

test('poolMaxFromEnv: unset and empty values fall back to the default', () => {
  assert.equal(poolMaxFromEnv(undefined, 'X_POOL_MAX', 5), 5);
  assert.equal(poolMaxFromEnv('', 'X_POOL_MAX', 5), 5);
  assert.equal(poolMaxFromEnv('   ', 'X_POOL_MAX', 10), 10);
});

test('poolMaxFromEnv: valid positive integers are honored', () => {
  assert.equal(poolMaxFromEnv('1', 'X_POOL_MAX', 5), 1);
  assert.equal(poolMaxFromEnv('2', 'X_POOL_MAX', 5), 2);
  assert.equal(poolMaxFromEnv(' 7 ', 'X_POOL_MAX', 5), 7);
});

test('poolMaxFromEnv: invalid values fail closed and name the variable', () => {
  for (const bad of ['0', '-3', 'abc', '2.5', '3x', 'NaN', 'Infinity']) {
    assert.throws(() => poolMaxFromEnv(bad, 'X_POOL_MAX', 5), /X_POOL_MAX must be a positive integer/);
  }
});
