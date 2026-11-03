import test from 'node:test';
import assert from 'node:assert/strict';
import { Keypair, Address, nativeToScVal } from '@stellar/stellar-sdk';
import { confirmedAmountFromResult, transferEventsFromResult } from '../src/soroban.js';

const wallet = Keypair.random().publicKey();
const other = Keypair.random().publicKey();
const contract = 'CALB4COOJD7M7NO4UPUAWBNP5MUWSVHZKEJTXT57P7S5HFMZY2J3PAGZ';
const sv = (a: string) => new Address(a).toScVal();
const ev = (from: string, to: string, units: bigint) => ({
  body: {
    v0: {
      topics: [
        nativeToScVal('transfer', { type: 'symbol' }),
        sv(from),
        sv(to),
        nativeToScVal('USDC:GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5', { type: 'string' }),
      ],
      data: nativeToScVal(units, { type: 'i128' }),
    },
  },
});
const res = (...events: unknown[]) => ({ events: { contractEventsXdr: [events] } });

test('confirmed refund amount is the contract -> wallet transfer event', () => {
  assert.equal(confirmedAmountFromResult(res(ev(contract, wallet, 10000000n)), 'refund', wallet, contract), '1');
  assert.equal(confirmedAmountFromResult(res(ev(contract, wallet, 15000000n)), 'refund', wallet, contract), '1.5');
});

test('confirmed contribute amount is the wallet -> contract transfer event', () => {
  assert.equal(confirmedAmountFromResult(res(ev(wallet, contract, 235000000n)), 'contribute', wallet, contract), '23.5');
});

test('ambiguous, missing or unrelated events stay UNKNOWN (undefined), never 0', () => {
  assert.equal(confirmedAmountFromResult(res(), 'refund', wallet, contract), undefined);
  assert.equal(confirmedAmountFromResult({}, 'refund', wallet, contract), undefined);
  assert.equal(confirmedAmountFromResult(res(ev(contract, other, 10000000n)), 'refund', wallet, contract), undefined);
  assert.equal(confirmedAmountFromResult(res(ev(contract, wallet, 1n), ev(contract, wallet, 2n)), 'refund', wallet, contract), undefined);
  assert.equal(confirmedAmountFromResult(res(ev(wallet, contract, 10000000n)), 'refund', wallet, contract), undefined);
  assert.equal(confirmedAmountFromResult(res(ev(contract, wallet, 10000000n)), 'withdraw', wallet, contract), undefined);
  assert.deepEqual(transferEventsFromResult({ events: { contractEventsXdr: [[{ body: {} }, null]] } }), []);
});
