import { createHash, randomUUID, verify } from 'node:crypto';
import { z } from 'zod';
import { Store, type State } from './store.js';
const name = z
  .string()
  .regex(/^[a-zA-Z0-9_.:-]{1,120}$/)
  .refine((s) => !['__proto__', 'prototype', 'constructor'].includes(s), 'reserved identifier');
const amount = z.string().regex(/^[1-9][0-9]{0,17}$/); // atomic units, never float
export type Actor = { id: string; role: 'compliance' | 'valuation' | 'governor' | 'operator' | 'auditor' };
const identity = z
  .object({ subject: name, country: z.string().regex(/^[A-Z]{2}$/), outcome: z.enum(['demo_pass', 'rejected', 'needs_info']), reference: name })
  .strict();
const valuation = z
  .object({
    assetId: name,
    amountMinor: amount,
    currency: z.literal('EUR'),
    observedAt: z.number().int().nonnegative(),
    expiresAt: z.number().int().nonnegative(),
    evidenceHash: z.string().regex(/^[a-f0-9]{64}$/),
    method: z.enum(['independent_appraisal', 'nav', 'cashflow']),
    signer: name,
  })
  .strict();
const proposal = z
  .object({
    kind: z.enum(['pilot_policy', 'pause', 'resume']),
    assetId: name,
    jurisdiction: z.literal('PT'),
    rightsHash: z.string().regex(/^[a-f0-9]{64}$/),
    economicModel: z.enum(['loan', 'equity', 'revenue_share', 'reward']),
    assetClass: name,
  })
  .strict();
const cashout = z
  .object({ subject: name, assetId: name, amountMinor: amount, currency: z.literal('EUR'), destinationRef: name, idempotencyKey: name })
  .strict();
// Operator resolution of a wedged cashout (crash between intent persistence
// and result write leaves 'dispatching'; an adapter timeout leaves 'unknown';
// both states reject every retry with 'cashout held'). Mirroring the journal
// recovery rule, resolution never guesses: the operator asserts a confirmed
// outcome with a reason, and every resolution is audited. Terminal and active
// states are never rewritten.
const resolution = z.object({ outcome: z.enum(['simulated', 'not_dispatched']), reference: name.optional(), reason: z.string().min(10).max(500) }).strict();
export function valuationPayload(input: unknown): string {
  const v = valuation.parse(input);
  return JSON.stringify([
    'rwa-crowdfund:valuation:v1:test_only',
    v.assetId,
    v.amountMinor,
    v.currency,
    v.observedAt,
    v.expiresAt,
    v.evidenceHash,
    v.method,
    v.signer,
  ]);
}
export interface CashoutAdapter {
  readonly mode: 'test_only';
  submit(id: string): Promise<{ outcome: 'simulated' | 'unknown'; reference?: string }>;
}
export class MockCashoutAdapter implements CashoutAdapter {
  readonly mode = 'test_only' as const;
  constructor(private outcome: 'simulated' | 'unknown' = 'simulated') {}
  async submit(id: string) {
    return { outcome: this.outcome, reference: `simulation:${id}` };
  }
}
export class Infrastructure {
  constructor(
    public store: Store,
    private keys: Record<string, string> = {},
    private clock = () => Date.now(),
    private adapter: CashoutAdapter = new MockCashoutAdapter(),
  ) {
    if (adapter.mode !== 'test_only') throw new Error('live adapter not supported');
  }
  private require(actor: Actor, role: Actor['role']) {
    if (actor.role !== role) throw new Error(`requires ${role} role`);
  }
  private audit(s: State, a: Actor, action: string, target: string) {
    s.audit.push({ id: randomUUID(), at: this.clock(), actor: a.id, role: a.role, action, target });
  }
  status() {
    return {
      mode: 'test_only',
      liveOnboarding: false,
      livePayments: false,
      legalComplianceCertified: false,
      network: 'testnet',
      limitations: [
        'single process store',
        'no real identity provider',
        'no bank or anchor connection',
        'no legal classification supplied',
        'no on-chain enforcement',
      ],
    };
  }
  recordIdentity(actor: Actor, input: unknown) {
    this.require(actor, 'compliance');
    const i = identity.parse(input);
    return this.store.change((s) => {
      const r = { ...i, provider: 'mock-only', verifiedRealPerson: false, at: this.clock(), expiresAt: this.clock() + 3600000 };
      s.identities[i.subject] = r;
      this.audit(s, actor, 'identity.simulated', i.subject);
      return r;
    });
  }
  publishValuation(actor: Actor, input: unknown, signature: string) {
    this.require(actor, 'valuation');
    const v = valuation.parse(input);
    const now = this.clock();
    if (v.observedAt > now || v.expiresAt <= now || v.expiresAt <= v.observedAt || v.expiresAt - v.observedAt > 86400000)
      throw new Error('valuation stale, future or excessive validity');
    const key = this.keys[v.signer];
    if (!key || !verify(null, Buffer.from(valuationPayload(v)), key, Buffer.from(signature, 'base64')))
      throw new Error('invalid or untrusted valuation signature');
    return this.store.change((s) => {
      const old = s.valuations[v.assetId];
      if (old && v.observedAt <= old.observedAt) throw new Error('valuation replay or rollback');
      const r = { ...v, signature, simulationOnly: true };
      s.valuations[v.assetId] = r;
      this.audit(s, actor, 'valuation.accepted', v.assetId);
      return r;
    });
  }
  propose(actor: Actor, input: unknown) {
    this.require(actor, 'governor');
    const p = proposal.parse(input);
    return this.store.change((s) => {
      const r = { ...p, id: randomUUID(), proposer: actor.id, approvals: [] as string[], state: 'pending', expiresAt: this.clock() + 3600000 };
      s.proposals[r.id] = r;
      this.audit(s, actor, 'proposal.created', r.id);
      return r;
    });
  }
  approve(actor: Actor, id: string) {
    this.require(actor, 'governor');
    return this.store.change((s) => {
      const p = s.proposals[id];
      if (!p || p.state !== 'pending' || p.expiresAt <= this.clock()) throw new Error('proposal missing, expired or closed');
      if (p.proposer === actor.id || p.approvals.includes(actor.id)) throw new Error('independent distinct approver required');
      p.approvals.push(actor.id);
      if (p.approvals.length >= 2) {
        p.state = 'approved';
        p.approvalOrder = s.audit.length;
      }
      this.audit(s, actor, 'proposal.approved', id);
      return p;
    });
  }
  private policy(s: State, assetId: string) {
    // Last approved policy/pause state follows durable approval order. Approval is not a legal opinion.
    const approved = Object.values(s.proposals)
      .filter((p) => p.assetId === assetId && p.state === 'approved')
      .sort((a, b) => a.approvalOrder - b.approvalOrder);
    const policy = approved.filter((p) => p.kind === 'pilot_policy').at(-1);
    const control = approved.filter((p) => p.kind === 'pause' || p.kind === 'resume').at(-1);
    if (!policy || control?.kind === 'pause') throw new Error('asset policy missing or paused');
    return policy;
  }
  eligibility(subject: string, assetId: string, network: string) {
    if (network !== 'testnet') throw new Error('real eligibility unavailable; testnet only');
    const s = this.store.read();
    const i = s.identities[subject];
    const p = this.policy(s, assetId);
    const v = s.valuations[assetId];
    if (!i || i.outcome !== 'demo_pass' || i.expiresAt <= this.clock() || i.country !== p.jurisdiction)
      throw new Error('test identity missing, rejected, expired or country not allowed');
    if (!v || v.expiresAt <= this.clock()) throw new Error('current signed valuation required');
    return { allowedForSimulation: true, productionEligible: false, subject, assetId, rightsHash: p.rightsHash };
  }
  requestCashout(actor: Actor, input: unknown) {
    this.require(actor, 'operator');
    const c = cashout.parse(input);
    const eligibility = this.eligibility(c.subject, c.assetId, 'testnet');
    const digest = createHash('sha256').update(JSON.stringify(c)).digest('hex');
    return this.store.change((s) => {
      const old = s.cashouts[c.idempotencyKey];
      if (old) {
        if (old.digest !== digest) throw new Error('idempotency key conflicts with request');
        return old;
      }
      const r = {
        ...c,
        id: randomUUID(),
        digest,
        requestedBy: actor.id,
        rightsHash: eligibility.rightsHash,
        state: 'requested',
        simulationOnly: true,
        createdAt: this.clock(),
      };
      s.cashouts[c.idempotencyKey] = r;
      this.audit(s, actor, 'cashout.requested', r.id);
      return r;
    });
  }
  approveCashout(actor: Actor, key: string) {
    this.require(actor, 'compliance');
    return this.store.change((s) => {
      const c = s.cashouts[key];
      if (!c || c.state !== 'requested' || c.requestedBy === actor.id) throw new Error('independent review required for requested cashout');
      c.state = 'approved';
      c.approvedBy = actor.id;
      this.audit(s, actor, 'cashout.approved_for_simulation', c.id);
      return c;
    });
  }
  async dispatchCashout(actor: Actor, key: string) {
    this.require(actor, 'operator');
    const current = this.store.read().cashouts[key];
    if (!current) throw new Error('cashout missing');
    const eligibility = this.eligibility(current.subject, current.assetId, 'testnet');
    if (current.rightsHash !== eligibility.rightsHash) throw new Error('rights changed since cashout request; new review required');
    const intent = this.store.change((s) => {
      const c = s.cashouts[key];
      if (c.state === 'simulated') return { ...c, dispatch: false };
      if (c.state !== 'approved') throw new Error('cashout held: not approved or outcome uncertain; manual reconciliation required');
      c.state = 'dispatching';
      this.audit(s, actor, 'cashout.intent_persisted', c.id);
      return { ...c, dispatch: true };
    });
    if (!intent.dispatch) return current;
    let result: Awaited<ReturnType<CashoutAdapter['submit']>>;
    try {
      result = await this.adapter.submit(intent.id);
    } catch {
      result = { outcome: 'unknown' };
    }
    return this.store.change((s) => {
      const c = s.cashouts[key];
      c.state = result.outcome === 'simulated' ? 'simulated' : 'unknown';
      c.reference = result.reference;
      this.audit(s, actor, 'cashout.result', c.id);
      return c;
    });
  }
  resolveCashout(actor: Actor, key: string, input: unknown) {
    this.require(actor, 'operator');
    const r = resolution.parse(input);
    return this.store.change((s) => {
      const c = s.cashouts[key];
      if (!c) throw new Error('cashout missing');
      if (c.state !== 'dispatching' && c.state !== 'unknown')
        throw new Error('only dispatching or unknown cashouts can be resolved; terminal and active states are never rewritten');
      if (r.outcome === 'simulated') {
        // Operator confirmed out-of-band that the payout actually happened.
        if (!r.reference) throw new Error('confirmed payout requires a reference');
        c.state = 'simulated';
        c.reference = r.reference;
      } else {
        // Adapter confirmed nothing was ever sent: back to approved so the
        // same idempotency record can be dispatched again - never a duplicate.
        c.state = 'approved';
        delete c.reference;
      }
      c.resolvedBy = actor.id;
      c.resolutionReason = r.reason;
      this.audit(s, actor, `cashout.resolved_${r.outcome}`, c.id);
      return c;
    });
  }
}
