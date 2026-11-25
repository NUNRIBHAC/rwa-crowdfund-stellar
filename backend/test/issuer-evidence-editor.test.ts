import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { CommunityService } from '../src/community.js';
import { FileCommunityStore } from '../src/community-store.js';

const seed = {
  campaignId: 'synthetic-only',
  revisedOn: '2026-11-23',
  sources: [{ id: 'registry', title: 'Synthetic only', url: 'https://registry.example.org/fact', publisher: 'independent', retrievedOn: '2026-11-23' }],
  claims: [
    {
      id: 'claim',
      area: 'issuer',
      text: 'Synthetic initial fact.',
      status: 'checked_fact',
      sourceIds: ['registry'],
      review: { checkedOn: '2026-11-23', note: 'Synthetic review.' },
    },
  ],
};

test('durable append-only corrections, explicit re-review, optimistic concurrency, idempotency and atomic audit', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'evidence-editor-'));
  const old = process.env.ISSUER_EVIDENCE_JSON;
  process.env.ISSUER_EVIDENCE_JSON = JSON.stringify([seed]);
  try {
    const store = new FileCommunityStore(path.join(dir, 'store.json'));
    const service = new CommunityService(store);
    const first = await service.readIssuerEvidence(seed.campaignId);
    const fix = {
      revision: first.revision,
      requestId: 'correction-1',
      action: 'correction',
      claimId: 'claim',
      sourceIds: ['registry'],
      note: 'Synthetic correction.',
    };
    const results = await Promise.allSettled([
      service.appendIssuerEvidence(seed.campaignId, 'operator:synthetic', fix),
      service.appendIssuerEvidence(seed.campaignId, 'operator:synthetic', { ...fix, requestId: 'correction-2' }),
    ]);
    assert.equal(results.filter((item) => item.status === 'fulfilled').length, 1);
    assert.equal(results[0].status, 'fulfilled');
    const result = (results[0] as PromiseFulfilledResult<{ revision: string }>).value;
    assert.deepEqual(await service.appendIssuerEvidence(seed.campaignId, 'operator:synthetic', fix), result);
    await assert.rejects(service.appendIssuerEvidence(seed.campaignId, 'operator:other', fix));
    let current = await service.readIssuerEvidence(seed.campaignId);
    assert.ok(current.unknownAreas.includes('issuer'));
    assert.equal(current.claims[0].text, seed.claims[0].text);
    const review = {
      revision: current.revision,
      requestId: 'review-001',
      action: 'review',
      claimId: 'claim',
      note: 'Synthetic new review.',
      sourceIds: ['registry'],
      text: 'Synthetic corrected fact.',
    };
    await assert.rejects(service.appendIssuerEvidence(seed.campaignId, 'operator:synthetic', review));
    await assert.rejects(service.appendIssuerEvidence(seed.campaignId, 'operator:synthetic', { ...review, humanReviewed: true, sourceIds: ['absent'] }));
    await service.appendIssuerEvidence(seed.campaignId, 'operator:synthetic', { ...review, humanReviewed: true });
    const reopened = new CommunityService(new FileCommunityStore(path.join(dir, 'store.json')));
    current = await reopened.readIssuerEvidence(seed.campaignId);
    assert.equal(current.claims.length, 2);
    assert.equal(current.claims[1].supersedes, 'claim');
    assert.equal(current.corrections.length, 1);
    assert.ok(!current.unknownAreas.includes('issuer'));
    const state = await store.read();
    assert.equal(state.evidenceRevisions?.[seed.campaignId].length, 2);
    assert.equal(state.audit.filter((item) => item.action.startsWith('evidence.')).length, 2);
    assert.equal(state.evidenceRevisions?.[seed.campaignId][0].actor, 'operator:synthetic');
    await assert.rejects(service.appendIssuerEvidence(seed.campaignId, 'operator:synthetic', { ...fix, revision: current.revision, requestId: 'old-fix-003' }));
    const newFix = {
      ...fix,
      revision: current.revision,
      requestId: 'new-fix-003',
      claimId: 'review-001',
      sourceIds: ['new-public'],
      newSource: {
        id: 'new-public',
        title: 'Synthetic new public source',
        url: 'https://example.org/new',
        publisher: 'independent',
        retrievedOn: new Date().toISOString().slice(0, 10),
      },
    };
    await assert.rejects(
      service.appendIssuerEvidence(seed.campaignId, 'operator:synthetic', {
        ...newFix,
        newSource: { ...newFix.newSource, url: 'https://example.org/new?token=secret' },
      }),
    );
    await assert.rejects(
      service.appendIssuerEvidence(seed.campaignId, 'operator:synthetic', { ...newFix, newSource: { ...newFix.newSource, retrievedOn: '2026-11-23' } }),
    );
    await service.appendIssuerEvidence(seed.campaignId, 'operator:synthetic', newFix);
    assert.ok((await service.readIssuerEvidence(seed.campaignId)).unknownAreas.includes('issuer'));
    assert.equal((await service.readIssuerEvidence(seed.campaignId)).sources.length, 2);

    await assert.rejects(
      service.appendIssuerEvidence(seed.campaignId, 'operator:synthetic', {
        ...review,
        revision: current.revision,
        requestId: 'review-002',
        humanReviewed: true,
      }),
    );
    assert.equal((await store.read()).audit.length, 3);
  } finally {
    if (old === undefined) delete process.env.ISSUER_EVIDENCE_JSON;
    else process.env.ISSUER_EVIDENCE_JSON = old;
    await fs.rm(dir, { recursive: true, force: true });
  }
});
