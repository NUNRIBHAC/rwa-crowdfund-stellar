// Local fictitious-data rehearsal only. Always creates a fresh temporary ledger.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { buildCapTable } from '../src/corporate-actions.js';
import type { ShareRegisterPayload } from '../src/share-register.js';
import { DistributionSimulationLedger } from '../src/distribution-simulation.js';
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'blockallisto-distribution-rehearsal-'));
try {
  const filename = path.join(dir, 'synthetic-ledger.json');
  const register = {
    campaignId: 'fictitious-campaign',
    generatedAt: 'synthetic-snapshot',
    network: 'testnet',
    demo: true,
    semantics: 'Fictitious fixtures only, no observed balances or real holders.',
    notes: [],
    totals: {} as never,
    contributors: [
      { publicKey: 'fictitious-holder-A', netIntended: '3' },
      { publicKey: 'fictitious-holder-B', netIntended: '1' },
    ] as never,
  } satisfies ShareRegisterPayload;
  const ledger = new DistributionSimulationLedger(filename);
  const draft = ledger.prepare('fictitious-preparer', buildCapTable(register), '10', 'fictitious-instruction');
  ledger.approve('fictitious-reviewer', draft.id);
  const result = await ledger.execute('fictitious-reviewer', draft.id);
  assert.equal(result.state, 'simulated');
  assert.equal(new DistributionSimulationLedger(filename).get(result.id).state, 'simulated');
  await assert.rejects(ledger.execute('fictitious-reviewer', draft.id));
  console.log(
    JSON.stringify(
      {
        mode: result.mode,
        legalEffect: result.legalEffect,
        state: result.state,
        amounts: result.receipts.map((r) => r.amount),
        durableReopenVerified: true,
        duplicateDispatchRejected: true,
        audit: result.audit.map((r) => r.event),
        notice: 'No funds, network calls, declarations, real holders or legal effects. Temporary fixture removed after this rehearsal.',
      },
      null,
      2,
    ),
  );
} finally {
  fs.rmSync(dir, { recursive: true, force: true });
}
