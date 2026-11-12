// Protected persistence seam for the connected DEMO application journey.
// No network, real documents, operator grants or chain signatures.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { Keypair } from '@stellar/stellar-sdk';
import { CommunityService } from '../src/community.js';
import { FileCommunityStore } from '../src/community-store.js';

test('application -> private document -> review -> creator-matched registered campaign persists for owner and reviewer', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'application-journey-'));
  const file = path.join(dir, 'state.json');
  const owner = { publicKey: Keypair.random().publicKey(), displayName: null, createdAt: 1 };
  const other = { ...owner, publicKey: Keypair.random().publicKey() };
  let service = new CommunityService(new FileCommunityStore(file));
  try {
    const application = await service.submitApplication(
      owner,
      {
        projectName: 'Synthetic solar project - DEMO',
        country: 'PT',
        instrumentType: 'Testnet escrow only, no investment rights',
        targetAmount: '2 testnet USDC',
        description: 'Synthetic application for isolated integration testing only.',
      },
      true,
    );
    const document = await service.addApplicationDocument(owner, application.id, {
      filename: 'synthetic-project.txt',
      content: 'DEMO. No issuer identity or legal rights are verified.',
    });
    assert.match(document.sha256, /^[a-f0-9]{64}$/);
    await assert.rejects(service.addApplicationDocument(other, application.id, { filename: 'outsider.txt', content: 'blocked' }), /not found/);
    await assert.rejects(service.readApplicationDocument(application.id, document.id, other.publicKey), /not found/);
    await assert.rejects(service.addApplicationDocument(owner, application.id, { filename: 'active.html', content: '<script>bad</script>' }));
    await assert.rejects(service.addApplicationDocument(owner, application.id, { filename: 'big.txt', content: 'x'.repeat(16001) }));
    const campaign = { id: 'synthetic-demo', contractId: 'C' + 'A'.repeat(55), creator: owner.publicKey, network: 'testnet' };
    await assert.rejects(service.linkApplicationCampaign(application.id, campaign, 'operator:test'), /not found/);
    await service.submitDraftApplication(owner, application.id);
    await assert.rejects(service.addApplicationDocument(owner, application.id, { filename: 'after-submit.txt', content: 'blocked' }), /closed/);
    await service.adminSetApplicationStatus(application.id, 'under_review', 'operator:test', 'Synthetic private document reviewed.');
    assert.equal((await service.readApplicationDocument(application.id, document.id)).sha256, document.sha256);
    await service.adminSetApplicationStatus(application.id, 'approved', 'operator:test', 'Prototype only, no legal approval.');
    await assert.rejects(service.linkApplicationCampaign(application.id, { ...campaign, network: 'public' }, 'operator:test'), /testnet/);
    await assert.rejects(service.linkApplicationCampaign(application.id, { ...campaign, creator: other.publicKey }, 'operator:test'), /creator/);
    const empty = await service.submitApplication(owner, {
      projectName: 'Empty synthetic application',
      country: 'PT',
      instrumentType: 'Testnet only',
      targetAmount: '2',
      description: 'Synthetic empty check.',
    });
    await service.adminSetApplicationStatus(empty.id, 'approved', 'operator:test');
    await assert.rejects(service.linkApplicationCampaign(empty.id, { ...campaign, id: 'another-demo' }, 'operator:test'), /document required/);
    const second = await service.submitApplication(
      owner,
      {
        projectName: 'Second synthetic application',
        country: 'PT',
        instrumentType: 'Testnet only',
        targetAmount: '2',
        description: 'Synthetic duplicate check.',
      },
      true,
    );
    for (let n = 0; n < 5; n++) await service.addApplicationDocument(owner, second.id, { filename: `demo-${n}.txt`, content: 'synthetic' });
    await assert.rejects(service.addApplicationDocument(owner, second.id, { filename: 'sixth.txt', content: 'synthetic' }), /limit/);
    await service.submitDraftApplication(owner, second.id);
    await assert.rejects(service.addApplicationDocument(owner, second.id, { filename: 'after-submit.txt', content: 'blocked' }), /closed/);
    await service.adminSetApplicationStatus(second.id, 'approved', 'operator:test');
    await service.linkApplicationCampaign(application.id, campaign, 'operator:test');
    await assert.rejects(service.linkApplicationCampaign(second.id, campaign, 'operator:test'), /already linked/);
    await service.adminSetApplicationStatus(application.id, 'under_review', 'operator:test');
    await assert.rejects(
      service.addApplicationDocument(owner, application.id, { filename: 'reopened.txt', content: 'linked evidence stays closed' }),
      /closed/,
    );
    await service.adminSetApplicationStatus(application.id, 'approved', 'operator:test');

    await assert.rejects(service.linkApplicationCampaign(application.id, campaign, 'operator:test'), /already linked/);
    await assert.rejects(service.addApplicationDocument(owner, application.id, { filename: 'late.txt', content: 'cannot change reviewed evidence' }), /closed/);
    service = new CommunityService(new FileCommunityStore(file));
    const reopened = (await service.listOwnApplications(owner)).find((a) => a.id === application.id)!;
    assert.equal(reopened.campaign?.id, campaign.id);
    assert.equal(reopened.documents?.[0].sha256, document.sha256);
    assert.equal((await service.listOwnApplications(other)).length, 0);
    assert.equal((await service.adminListApplications()).find((a) => a.id === application.id)?.campaign?.contractId, campaign.contractId);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});
