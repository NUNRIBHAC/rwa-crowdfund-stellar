import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Keypair } from '@stellar/stellar-sdk';
import { walletDeletionHistory, type DeletionHistorySnapshot } from '../src/deletion-history.js';
const wallet = Keypair.random().publicKey();
const contract = 'CCUYSC424OJYEWFJHRCKMNBFQHRWWQQICXAZPRXJUM7PBTTYJFXN2Z73';
const snapshot = (): DeletionHistorySnapshot => ({
  networkPassphrase: 'testnet',
  expectedNetworkPassphrase: 'testnet',
  targetLedger: 1000,
  manifestComplete: true,
  coherent: true,
  campaigns: [{ campaignId: 'a', contractId: contract, createdLedger: 10 }],
  coverage: [
    {
      campaignId: 'a',
      contractId: contract,
      fromLedger: 10,
      throughLedger: 1000,
      allEventsVerified: true,
      gap: false,
      unreadableEvents: false,
      participantKeys: [],
    },
  ],
});
test('wallet history requires exact complete campaign/contract/lifetime coverage at one ledger', () => {
  assert.equal(walletDeletionHistory(snapshot(), wallet), 'clear');
  for (const change of [
    { coherent: false },
    { manifestComplete: false },
    { networkPassphrase: 'other' },
    { targetLedger: NaN },
    { targetLedger: 1000.5 },
    { campaigns: [] },
    { coverage: [] },
    { coverage: undefined },
  ])
    assert.equal(walletDeletionHistory({ ...snapshot(), ...change }, wallet), 'unavailable');
  for (const change of [
    { fromLedger: 11 },
    { throughLedger: 999 },
    { throughLedger: 1001 },
    { contractId: 'wrong' },
    { campaignId: 'wrong' },
    { allEventsVerified: false },
    { gap: true },
    { gap: undefined },
    { unreadableEvents: true },
    { participantKeys: ['invalid'] },
  ]) {
    const s = snapshot();
    Object.assign(s.coverage[0], change);
    assert.equal(walletDeletionHistory(s, wallet), 'unavailable');
  }
});
test('duplicates, missing manifest and malformed runtime evidence never become clear', () => {
  for (const value of [
    null,
    [],
    {},
    { coherent: true, manifestComplete: true },
    { ...snapshot(), campaigns: [...snapshot().campaigns, ...snapshot().campaigns] },
    { ...snapshot(), coverage: [...snapshot().coverage, ...snapshot().coverage] },
  ])
    assert.equal(walletDeletionHistory(value, wallet), 'unavailable');
  assert.equal(walletDeletionHistory(snapshot(), 'not-a-wallet'), 'unavailable');
});
test('historic participation blocks regardless of current balance and other participants do not', () => {
  const s = snapshot();
  s.coverage[0].participantKeys = [wallet];
  assert.equal(walletDeletionHistory(s, wallet), 'protected');
  s.coverage[0].participantKeys = [Keypair.random().publicKey()];
  assert.equal(walletDeletionHistory(s, wallet), 'clear');
  s.coverage[0].gap = true;
  assert.equal(walletDeletionHistory(s, wallet), 'unavailable');
});
