// Isolated execution rehearsal, never a payment or a declaration of rights.
// No HTTP route, wallet, network client or live adapter is wired to this ledger.
import { createHash, randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { buildDistributionPreview, type CapTable, type DistributionPreviewRow } from './corporate-actions.js';

const identifier = z.string().regex(/^[a-zA-Z0-9_.:-]{1,120}$/);
const reasonSchema = z.string().trim().min(10).max(500);
export type SimulationReceipt = { publicKey: string; amount: string; reference: string };
export type DistributionSimulation = {
  id: string;
  mode: 'test_only';
  legalEffect: false;
  campaignId: string;
  idempotencyKey: string;
  inputHash: string;
  snapshotHash: string;
  snapshot: CapTable;
  total: string;
  rows: DistributionPreviewRow[];
  preparedBy: string;
  reviewedBy?: string;
  state: 'draft' | 'approved' | 'dispatching' | 'simulated' | 'unknown' | 'cancelled';
  receipts: SimulationReceipt[];
  audit: { at: number; actor: string; event: string; reason?: string }[];
};
type State = { version: 1; instructions: DistributionSimulation[] };
export interface DistributionSimulationAdapter {
  readonly mode: 'test_only';
  simulate(instruction: DistributionSimulation): Promise<SimulationReceipt[]>;
}
export class MockDistributionSimulationAdapter implements DistributionSimulationAdapter {
  readonly mode = 'test_only';
  async simulate(instruction: DistributionSimulation) {
    return instruction.rows.map((r, i) => ({ publicKey: r.publicKey, amount: r.amount, reference: `simulation:${instruction.id}:${i}` }));
  }
}
const digest = (x: unknown) => createHash('sha256').update(JSON.stringify(x)).digest('hex');
const copy = <T>(x: T): T => structuredClone(x);

export class DistributionSimulationLedger {
  private busy = false;
  constructor(
    private filename: string,
    private adapter: DistributionSimulationAdapter = new MockDistributionSimulationAdapter(),
    private clock = () => Date.now(),
  ) {
    if (adapter.mode !== 'test_only') throw new Error('live distribution adapters are not supported');
  }
  private read(): State {
    if (!fs.existsSync(this.filename)) return { version: 1, instructions: [] };
    const s = JSON.parse(fs.readFileSync(this.filename, 'utf8')) as State;
    if (s.version !== 1 || !Array.isArray(s.instructions)) throw new Error('invalid simulation ledger');
    return s;
  }
  private change<T>(fn: (s: State) => T): T {
    if (this.busy) throw new Error('reentrant simulation write');
    this.busy = true;
    let lock: number | undefined;
    try {
      fs.mkdirSync(path.dirname(this.filename), { recursive: true });
      // A crash leaves a lock for manual inspection. Never guess that another
      // process is dead, clear its lock, or dispatch the instruction again.
      lock = fs.openSync(`${this.filename}.lock`, 'wx', 0o600);
      const s = this.read();
      const result = fn(s);
      fs.mkdirSync(path.dirname(this.filename), { recursive: true });
      const tmp = `${this.filename}.tmp-${process.pid}`;
      const fd = fs.openSync(tmp, 'w', 0o600);
      try {
        fs.writeFileSync(fd, JSON.stringify(s, null, 2));
        fs.fsyncSync(fd);
      } finally {
        fs.closeSync(fd);
      }
      fs.renameSync(tmp, this.filename);
      const directory = fs.openSync(path.dirname(this.filename), 'r');
      try {
        fs.fsyncSync(directory);
      } finally {
        fs.closeSync(directory);
      }
      return copy(result);
    } finally {
      if (lock !== undefined) {
        fs.closeSync(lock);
        fs.unlinkSync(`${this.filename}.lock`);
      }
      this.busy = false;
    }
  }
  private instruction(s: State, id: string) {
    const item = s.instructions.find((r) => r.id === id);
    if (!item) throw new Error('simulation instruction not found');
    if (item.mode !== 'test_only' || item.legalEffect !== false || digest(item.snapshot) !== item.snapshotHash) throw new Error('simulation snapshot invalid');
    const preview = buildDistributionPreview(item.snapshot, item.total);
    if (preview.status !== 'illustration' || digest(preview.rows) !== digest(item.rows)) throw new Error('simulation allocation invalid');
    return item;
  }
  get(id: string) {
    return copy(this.instruction(this.read(), id));
  }
  prepare(actor: string, table: CapTable, total: string, idempotencyKey: string) {
    identifier.parse(actor);
    identifier.parse(idempotencyKey);
    const preview = buildDistributionPreview(table, total);
    if (preview.status !== 'illustration') throw new Error('complete single-basis positive positions required');
    if (new Set(preview.rows.map((r) => r.publicKey)).size !== preview.rows.length) throw new Error('duplicate holder in snapshot');
    const inputHash = digest({ actor, table, total: preview.total });
    return this.change((s) => {
      const old = s.instructions.find((i) => i.campaignId === table.campaignId && i.idempotencyKey === idempotencyKey);
      if (old) {
        if (old.inputHash !== inputHash) throw new Error('idempotency key reused for different inputs');
        return this.instruction(s, old.id);
      }
      const instruction: DistributionSimulation = {
        id: randomUUID(),
        mode: 'test_only',
        legalEffect: false,
        campaignId: table.campaignId,
        idempotencyKey,
        inputHash,
        snapshotHash: digest(table),
        snapshot: copy(table),
        total: preview.total,
        rows: copy(preview.rows),
        preparedBy: actor,
        state: 'draft',
        receipts: [],
        audit: [{ at: this.clock(), actor, event: 'simulation.prepared' }],
      };
      s.instructions.push(instruction);
      return instruction;
    });
  }
  approve(actor: string, id: string) {
    identifier.parse(actor);
    return this.change((s) => {
      const i = this.instruction(s, id);
      if (i.state !== 'draft' || i.preparedBy === actor) throw new Error('distinct reviewer and draft state required');
      i.reviewedBy = actor;
      i.state = 'approved';
      i.audit.push({ at: this.clock(), actor, event: 'simulation.approved' });
      return i;
    });
  }
  async execute(actor: string, id: string) {
    identifier.parse(actor);
    const pending = this.change((s) => {
      const i = this.instruction(s, id);
      if (i.state !== 'approved' || actor !== i.reviewedBy) throw new Error('reviewer and approved state required; no automatic retries');
      i.state = 'dispatching';
      i.audit.push({ at: this.clock(), actor, event: 'simulation.dispatching' });
      return i;
    });
    let receipts: SimulationReceipt[] | null = null;
    try {
      const result = await this.adapter.simulate(copy(pending));
      if (
        Array.isArray(result) &&
        result.length === pending.rows.length &&
        new Set(result.map((r) => r.reference)).size === result.length &&
        result.every(
          (r, n) => r.publicKey === pending.rows[n].publicKey && r.amount === pending.rows[n].amount && /^simulation:[a-zA-Z0-9:-]+$/.test(r.reference),
        )
      )
        receipts = result;
    } catch {
      // A lost response is unknown, never failed or permission to dispatch twice.
    }
    return this.change((s) => {
      const i = this.instruction(s, id);
      if (i.state !== 'dispatching') throw new Error('simulation state changed during dispatch');
      i.state = receipts ? 'simulated' : 'unknown';
      i.receipts = receipts ?? [];
      i.audit.push({ at: this.clock(), actor, event: `simulation.${i.state}` });
      return i;
    });
  }
  cancel(actor: string, id: string, reason: string) {
    identifier.parse(actor);
    reasonSchema.parse(reason);
    return this.change((s) => {
      const i = this.instruction(s, id);
      if (!['draft', 'approved'].includes(i.state) || (actor !== i.preparedBy && actor !== i.reviewedBy))
        throw new Error('only an undispatched instruction can be cancelled by its participants');
      i.state = 'cancelled';
      i.audit.push({ at: this.clock(), actor, event: 'simulation.cancelled', reason });
      return i;
    });
  }
}
