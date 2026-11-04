// Durable pending-proof queue for contributor-registry writes that could not
// be persisted yet. The intent journal prunes terminal rows after
// JOURNAL_TERMINAL_RETENTION_MS (~30 days), so "the journal row remains the
// unresolved record" only covers short outages; this queue is the
// preservation layer for anything longer. Entries are written when a
// network-confirmed contribution cannot be recorded (or cannot yet be
// confirmed) and are removed only after the registry write succeeds.
// File-backed and independent of both the journal backend and the community
// store, so a community-store outage never takes the proofs down with it.
import fs from 'node:fs';
import path from 'node:path';

export type PendingContribution = {
  hash: string;
  // Present when network derivation already succeeded at capture time; the
  // drain then needs no network. Absent (hash-only) when confirmation itself
  // was deferred - the drain re-derives from the network by hash, which
  // works even after the journal row is pruned.
  campaignId?: string;
  contributor?: string;
  firstPendingAt: number;
  lastError?: string;
};

const storePath = () =>
  process.env.PENDING_CONTRIBUTORS_PATH ?? path.join(path.dirname(process.env.SOROBAN_INTENTS_PATH ?? 'intents.json'), 'pending-contributors.json');

// Deletion safety must not interpret an unreadable/corrupt file as no records.
// Keep existing recovery behavior separate; this strict reader is not wired
// into account deletion until a coherent external retention adapter exists.
export function readPendingStrict(): PendingContribution[] {
  let raw: string;
  try {
    raw = fs.readFileSync(storePath(), 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw error;
  }
  const value: unknown = JSON.parse(raw);
  if (
    !Array.isArray(value) ||
    value.some(
      (entry) =>
        !entry ||
        typeof entry.hash !== 'string' ||
        !/^[0-9a-f]{64}$/.test(entry.hash) ||
        typeof entry.firstPendingAt !== 'number' ||
        !Number.isFinite(entry.firstPendingAt) ||
        (entry.contributor !== undefined && typeof entry.contributor !== 'string'),
    )
  )
    throw new Error('pending contributor safety records are unreadable');
  return value as PendingContribution[];
}

export function readPending(): PendingContribution[] {
  try {
    const raw = fs.readFileSync(storePath(), 'utf8');
    const v = JSON.parse(raw);
    if (!Array.isArray(v)) return [];
    return v.filter((e) => e && typeof e.hash === 'string' && /^[0-9a-f]{64}$/.test(e.hash));
  } catch {
    return [];
  }
}

function writePending(entries: PendingContribution[]): void {
  const file = storePath();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(entries, null, 1), { mode: 0o600 });
  fs.renameSync(tmp, file);
}

// Idempotent upsert keyed by hash: repeat deferrals refresh lastError and
// keep the original firstPendingAt.
export function pendContribution(entry: Omit<PendingContribution, 'firstPendingAt'>): void {
  const all = readPending();
  const existing = all.find((e) => e.hash === entry.hash);
  if (existing) {
    existing.campaignId = entry.campaignId ?? existing.campaignId;
    existing.contributor = entry.contributor ?? existing.contributor;
    existing.lastError = entry.lastError;
    writePending(all);
    return;
  }
  all.push({ ...entry, firstPendingAt: Date.now() });
  writePending(all);
}

export function clearPending(hash: string): void {
  writePending(readPending().filter((e) => e.hash !== hash));
}

// Drain pass: for fact-complete entries write the registry directly (the
// facts were network-derived at capture); for hash-only entries re-derive
// from the network by hash (survives journal pruning). Entries are removed
// only on a successful registry write; failures stay queued with lastError.
export async function drainPendingContributors(deps: {
  record: (campaignId: string, contributor: string) => Promise<void>;
  derive: (hash: string) => Promise<{ campaignId: string; contributor: string } | null>;
}): Promise<{ drained: number; pending: number }> {
  for (const entry of readPending()) {
    try {
      let facts = entry.campaignId && entry.contributor ? { campaignId: entry.campaignId, contributor: entry.contributor } : null;
      if (!facts) facts = await deps.derive(entry.hash);
      if (!facts) {
        // Definitively not a confirmed contribution to a registered
        // campaign (e.g. wrong contract/function): the proof has no subject,
        // so keeping it would block the queue forever. Drop with a log.
        console.error('pending contribution dropped (not a registered confirmed contribution):', entry.hash);
        clearPending(entry.hash);
        continue;
      }
      await deps.record(facts.campaignId, facts.contributor);
      clearPending(entry.hash);
    } catch (err) {
      pendContribution({ ...entry, lastError: err instanceof Error ? err.message : String(err) });
    }
  }
  const rest = readPending();
  return { drained: 0, pending: rest.length };
}
