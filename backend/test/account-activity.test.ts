import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Keypair } from '@stellar/stellar-sdk';

process.env.STELLAR_NETWORK = 'testnet';

const { accountActivity } = await import('../src/soroban.js');
const { injectJournalBackendForTests, resetJournalBackendForTests } = await import('../src/journal.js');

const alice = Keypair.random().publicKey();
const bob = Keypair.random().publicKey();

const fakeJournal = {
  read: async () => ({
    intents: [
      {
        hash: 'h1',
        campaign: 'demo',
        actor: alice,
        action: 'contribute',
        xdr: 'UNSIGNED',
        signedXdr: 'SIGNED',
        status: 'SUCCESS',
        amount: '10.5',
        createdAt: '2026-10-30T10:00:00Z',
        updatedAt: '2026-10-30T10:01:00Z',
      },
      {
        hash: 'h2',
        campaign: 'demo',
        actor: bob,
        action: 'contribute',
        xdr: 'UNSIGNED',
        signedXdr: 'SIGNED',
        status: 'PENDING',
        amount: '5',
        createdAt: '2026-10-30T11:00:00Z',
      },
      { hash: 'h3', campaign: 'demo', actor: alice, action: 'refund', xdr: 'UNSIGNED', status: 'SUBMITTED', createdAt: '2026-10-31T09:00:00Z' },
    ],
  }),
  save: async () => {
    throw new Error('read-only path must not save');
  },
};

test("accountActivity returns only the actor's intents, newest first, without envelope material", async () => {
  injectJournalBackendForTests(fakeJournal as any);
  try {
    const rows = await accountActivity(alice);
    assert.deepEqual(
      rows.map((r: any) => r.hash),
      ['h3', 'h1'],
    );
    for (const row of rows) {
      assert.equal(row.actor, undefined, 'actor echoed unnecessarily');
      assert.equal('xdr' in row, false, 'unsigned envelope leaked');
      assert.equal('signedXdr' in row, false, 'signed envelope leaked');
    }
    assert.equal(rows[1].amount, '10.5');
    assert.equal(rows[0].amount, null);
    assert.equal(rows[0].status, 'SUBMITTED');
  } finally {
    resetJournalBackendForTests();
  }
});

test('accountActivity rejects a malformed actor', async () => {
  injectJournalBackendForTests(fakeJournal as any);
  try {
    await assert.rejects(() => accountActivity('not-a-wallet'));
    await assert.rejects(() => accountActivity(''));
  } finally {
    resetJournalBackendForTests();
  }
});

test('accountActivity excludes quarantined rows and other actors on a native-summary backend', async () => {
  const summaryJournal = {
    readSummary: async () => ({
      intents: [
        { hash: 'ok1', campaign: 'demo', actor: alice, action: 'contribute', status: 'SUCCESS', amount: '3', createdAt: '2026-10-30T10:00:00Z' },
        { hash: 'ok2', campaign: 'demo', actor: bob, action: 'contribute', status: 'SUCCESS', amount: '4', createdAt: '2026-10-30T11:00:00Z' },
      ],
      quarantined: [{ hash: 'corrupt1', reason: 'xdr is not a parseable Stellar transaction envelope', possiblySigned: true }],
    }),
    save: async () => {
      throw new Error('read-only path must not save');
    },
  };
  injectJournalBackendForTests(summaryJournal as any);
  try {
    const rows = await accountActivity(alice);
    assert.deepEqual(
      rows.map((r: any) => r.hash),
      ['ok1'],
      "only alice's valid row; quarantined and other-actor rows excluded",
    );
  } finally {
    resetJournalBackendForTests();
  }
});
