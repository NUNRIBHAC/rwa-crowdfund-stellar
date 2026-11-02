import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Keypair } from '@stellar/stellar-sdk';

process.env.STELLAR_NETWORK = 'testnet';

const { accountPayouts } = await import('../src/soroban.js');
const { injectJournalBackendForTests, resetJournalBackendForTests } = await import('../src/journal.js');

const alice = Keypair.random().publicKey();
const bob = Keypair.random().publicKey();

const fakeJournal = {
  read: async () => ({
    intents: [
      // completed refund: a payout
      {
        hash: 'r1',
        campaign: 'demo',
        actor: alice,
        action: 'refund',
        xdr: 'UNSIGNED',
        signedXdr: 'SIGNED',
        status: 'SUCCESS',
        amount: '10000000',
        createdAt: '2026-10-30T10:00:00Z',
        updatedAt: '2026-10-30T10:05:00Z',
      },
      // completed creator withdrawal: a payout
      {
        hash: 'w1',
        campaign: 'demo',
        actor: alice,
        action: 'withdraw',
        xdr: 'UNSIGNED',
        signedXdr: 'SIGNED',
        status: 'SUCCESS',
        amount: '20000000',
        createdAt: '2026-10-31T09:00:00Z',
        updatedAt: '2026-10-31T09:05:00Z',
      },
      // contribution: a position, never a payout
      {
        hash: 'c1',
        campaign: 'demo',
        actor: alice,
        action: 'contribute',
        xdr: 'UNSIGNED',
        signedXdr: 'SIGNED',
        status: 'SUCCESS',
        amount: '30000000',
        createdAt: '2026-11-01T08:00:00Z',
      },
      // prepared refund: not completed, must not appear as a payout
      {
        hash: 'r2',
        campaign: 'demo',
        actor: alice,
        action: 'refund',
        xdr: 'UNSIGNED',
        signedXdr: 'SIGNED',
        status: 'PENDING',
        amount: '40000000',
        createdAt: '2026-11-01T09:00:00Z',
      },
      // failed withdrawal: not a payout
      {
        hash: 'w2',
        campaign: 'demo',
        actor: alice,
        action: 'withdraw',
        xdr: 'UNSIGNED',
        status: 'FAILED',
        amount: '50000000',
        createdAt: '2026-11-01T10:00:00Z',
      },
      // another wallet's completed refund: not alice's
      {
        hash: 'r3',
        campaign: 'demo',
        actor: bob,
        action: 'refund',
        xdr: 'UNSIGNED',
        signedXdr: 'SIGNED',
        status: 'SUCCESS',
        amount: '60000000',
        createdAt: '2026-11-01T11:00:00Z',
      },
    ],
  }),
  save: async () => {
    throw new Error('read-only path must not save');
  },
};

test("accountPayouts lists only the actor's completed refunds/withdrawals, newest first, no envelopes", async () => {
  injectJournalBackendForTests(fakeJournal as any);
  try {
    const rows = await accountPayouts(alice);
    assert.deepEqual(
      rows.map((r: any) => r.hash),
      ['w1', 'r1'],
      'only SUCCESS refund/withdraw intents, newest first',
    );
    for (const row of rows) {
      assert.equal('xdr' in row, false, 'unsigned envelope leaked');
      assert.equal('signedXdr' in row, false, 'signed envelope leaked');
    }
    assert.equal(rows[0].action, 'withdraw');
    assert.equal(rows[1].action, 'refund');
    assert.equal(rows[1].amount, '10000000');
  } finally {
    resetJournalBackendForTests();
  }
});

test('accountPayouts returns an empty list when no completed payouts exist', async () => {
  injectJournalBackendForTests(fakeJournal as any);
  try {
    const nobody = Keypair.random().publicKey();
    assert.deepEqual(await accountPayouts(nobody), []);
  } finally {
    resetJournalBackendForTests();
  }
});

test('accountPayouts rejects a malformed actor', async () => {
  injectJournalBackendForTests(fakeJournal as any);
  try {
    await assert.rejects(() => accountPayouts('not-a-wallet'));
    await assert.rejects(() => accountPayouts(''));
  } finally {
    resetJournalBackendForTests();
  }
});
