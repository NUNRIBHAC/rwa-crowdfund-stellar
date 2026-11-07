import { test } from 'node:test';
import assert from 'node:assert/strict';
import { StrKey } from '@stellar/stellar-sdk';
import { sorobanArchiveTargets } from '../src/soroban.js';

// The verbatim event archive must cover every registry contract: v1 crowdfund
// contracts under the bare campaign id, and each v2 contract-set member under
// its own key (deletion-history coverage needs both token and offering).
const c = (n: number) => StrKey.encodeContract(Buffer.alloc(32, n));

test('archive targets cover v1 contracts and each v2 contract-set member', () => {
  process.env.STELLAR_NETWORK = 'testnet';
  process.env.SOROBAN_CAMPAIGNS_JSON = JSON.stringify([
    { id: 'alpha', name: 'Alpha', contractId: c(1) },
    { id: 'beta', name: 'Beta', contractSet: 'v2', tokenContractId: c(2), offeringContractId: c(3) },
  ]);
  try {
    assert.deepEqual(sorobanArchiveTargets(), [
      { id: 'alpha', contractId: c(1) },
      { id: 'beta:token', contractId: c(2) },
      { id: 'beta:offering', contractId: c(3) },
    ]);
  } finally {
    delete process.env.SOROBAN_CAMPAIGNS_JSON;
  }
});

test('archive targets throw on an invalid registry like every other reader', () => {
  process.env.STELLAR_NETWORK = 'testnet';
  process.env.SOROBAN_CAMPAIGNS_JSON = JSON.stringify([
    { id: 'dup', name: 'A', contractId: c(1) },
    { id: 'dup', name: 'B', contractId: c(2) },
  ]);
  try {
    assert.throws(() => sorobanArchiveTargets(), /duplicate campaign registry entry/);
  } finally {
    delete process.env.SOROBAN_CAMPAIGNS_JSON;
  }
});
