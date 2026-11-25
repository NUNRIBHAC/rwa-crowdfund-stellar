import { createHash } from 'node:crypto';
import { z } from 'zod';

// Curated public evidence only. Never copy private application documents into
// this read model. No crawling, scoring, recommendations or payment actions.
export const EVIDENCE_AREAS = ['issuer', 'team', 'track_record', 'financials', 'offer_documents', 'milestones'] as const;
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const parsed = new Date(value + 'T00:00:00Z');
    return Number.isFinite(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
  });
const publicUrl = z
  .string()
  .max(2048)
  .url()
  .refine((value) => {
    const u = new URL(value);
    const host = u.hostname.toLowerCase();
    return (
      u.protocol === 'https:' &&
      !u.username &&
      !u.password &&
      !u.search &&
      !u.hash &&
      host.includes('.') &&
      !host.endsWith('.local') &&
      !host.endsWith('.localhost') &&
      !host.endsWith('.internal') &&
      !host.endsWith('.invalid') &&
      !/^\d+(?:\.\d+){3}$/.test(host) &&
      !host.includes(':')
    );
  }, 'public HTTPS source URL required; no credentials, query or fragment');
const source = z
  .object({
    id: z.string().regex(/^[a-z0-9-]{1,80}$/),
    title: z.string().trim().min(1).max(200),
    url: publicUrl,
    publisher: z.enum(['issuer', 'independent']),
    retrievedOn: date,
    publishedOn: date.optional(),
  })
  .strict();
const claim = z
  .object({
    id: z.string().regex(/^[a-z0-9-]{1,80}$/),
    area: z.enum(EVIDENCE_AREAS),
    text: z.string().trim().min(1).max(2000),
    status: z.enum(['issuer_claim', 'checked_fact']),
    supersedes: z
      .string()
      .regex(/^[a-z0-9-]{1,80}$/)
      .optional(),
    sourceIds: z.array(z.string()).min(1).max(10),
    // An explicit human review assertion, never inferred from the URL or GitHub.
    review: z
      .object({ checkedOn: date, note: z.string().trim().min(1).max(1000) })
      .strict()
      .optional(),
  })
  .strict();
const dossier = z
  .object({
    campaignId: z.string().regex(/^[a-zA-Z0-9_-]{1,128}$/),
    revisedOn: date,
    sources: z.array(source).max(100),
    claims: z.array(claim).max(100),
    corrections: z
      .array(
        z
          .object({
            id: z.string().regex(/^[a-z0-9-]{1,80}$/),
            claimId: z.string().regex(/^[a-z0-9-]{1,80}$/),
            correctedOn: date,
            note: z.string().trim().min(1).max(1000),
            sourceIds: z.array(z.string()).min(1).max(10),
          })
          .strict(),
      )
      .max(100)
      .optional(),
  })
  .strict();

export type IssuerEvidenceDossier = z.infer<typeof dossier>;
export type EvidenceDossierResult = {
  campaignId: string;
  state: 'not_provided' | 'available' | 'unavailable';
  revisedOn: string | null;
  sources: IssuerEvidenceDossier['sources'];
  claims: IssuerEvidenceDossier['claims'];
  corrections: NonNullable<IssuerEvidenceDossier['corrections']>;
  unknownAreas: (typeof EVIDENCE_AREAS)[number][];
};

export function parseIssuerEvidence(input: unknown, today = new Date().toISOString().slice(0, 10)): IssuerEvidenceDossier[] {
  const records = z.array(dossier).max(1000).parse(input);
  const campaigns = new Set<string>();
  for (const record of records) {
    if (campaigns.has(record.campaignId) || record.revisedOn > today) throw new Error('invalid evidence revision');
    campaigns.add(record.campaignId);
    const sources = new Map(record.sources.map((entry) => [entry.id, entry]));
    if (sources.size !== record.sources.length || new Set(record.claims.map((entry) => entry.id)).size !== record.claims.length) {
      throw new Error('duplicate evidence identifier');
    }
    for (const item of record.sources) {
      if (item.retrievedOn > record.revisedOn || (item.publishedOn && item.publishedOn > item.retrievedOn)) throw new Error('invalid source chronology');
    }
    const corrections = record.corrections ?? [];
    if (new Set(corrections.map((entry) => entry.id)).size !== corrections.length) throw new Error('duplicate correction identifier');
    for (const correction of corrections) {
      const target = record.claims.find((entry) => entry.id === correction.claimId);
      if (
        !target ||
        correction.correctedOn > record.revisedOn ||
        (target.review && correction.correctedOn < target.review.checkedOn) ||
        new Set(correction.sourceIds).size !== correction.sourceIds.length ||
        correction.sourceIds.some((id) => !sources.has(id) || sources.get(id)!.retrievedOn > correction.correctedOn)
      ) {
        throw new Error('invalid reviewer correction');
      }
    }
    for (const item of record.claims) {
      if (item.supersedes) {
        const prior = record.claims.find((entry) => entry.id === item.supersedes);
        if (
          !prior ||
          prior === item ||
          prior.supersedes === item.id ||
          prior.area !== item.area ||
          item.status !== 'checked_fact' ||
          !item.review ||
          !corrections.some((entry) => entry.claimId === prior.id) ||
          corrections.some((entry) => entry.claimId === prior.id && entry.correctedOn > item.review!.checkedOn) ||
          record.claims.findIndex((entry) => entry.id === prior.id) >= record.claims.indexOf(item)
        ) {
          throw new Error('invalid reviewed replacement');
        }
      }
      if (new Set(item.sourceIds).size !== item.sourceIds.length || item.sourceIds.some((id) => !sources.has(id))) throw new Error('missing evidence source');
      if (item.status === 'checked_fact') {
        if (
          !item.review ||
          item.review.checkedOn > record.revisedOn ||
          item.sourceIds.some((id) => sources.get(id)!.retrievedOn > item.review!.checkedOn) ||
          !item.sourceIds.some((id) => sources.get(id)?.publisher === 'independent')
        ) {
          throw new Error('checked fact needs independent evidence and dated human review');
        }
      } else if (item.review || item.sourceIds.some((id) => sources.get(id)?.publisher !== 'issuer')) {
        throw new Error('issuer claim must retain issuer provenance');
      }
    }
  }
  return records;
}

export function issuerEvidenceFor(campaignId: string, raw = process.env.ISSUER_EVIDENCE_JSON): EvidenceDossierResult {
  const empty = { campaignId, revisedOn: null, sources: [], claims: [], corrections: [], unknownAreas: [...EVIDENCE_AREAS] };
  if (!raw) return { ...empty, state: 'not_provided' };
  try {
    const record = parseIssuerEvidence(JSON.parse(raw)).find((entry) => entry.campaignId === campaignId);
    if (!record) return { ...empty, state: 'not_provided' };
    return {
      ...record,
      corrections: record.corrections ?? [],
      state: 'available',
      unknownAreas: EVIDENCE_AREAS.filter(
        (area) =>
          !record.claims.some(
            (entry) =>
              entry.area === area && entry.status === 'checked_fact' && !(record.corrections ?? []).some((correction) => correction.claimId === entry.id),
          ),
      ),
    };
  } catch {
    // Never show partly validated facts or parser contents in public errors.
    return { ...empty, state: 'unavailable' };
  }
}

// The operator workflow appends immutable snapshots. The digest fences both
// concurrent operator edits and changes to the configured seed dossier.
export function evidenceRevision(value: EvidenceDossierResult): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}
export type StoredEvidenceRevision = { dossier: IssuerEvidenceDossier; actor: string; at: number; revision: string };
export const evidenceActionInput = z
  .object({
    revision: z.string().regex(/^[a-f0-9]{64}$/),
    requestId: z.string().regex(/^[a-z0-9-]{8,80}$/),
    action: z.enum(['correction', 'review']),
    claimId: z.string().regex(/^[a-z0-9-]{1,80}$/),
    note: z.string().trim().min(1).max(1000),
    sourceIds: z.array(z.string()).min(1).max(10),
    text: z.string().trim().min(1).max(2000).optional(),
    humanReviewed: z.literal(true).optional(),
    newSource: source.optional(),
  })
  .strict();

export function appendEvidenceAction(current: EvidenceDossierResult, input: z.infer<typeof evidenceActionInput>, today: string): IssuerEvidenceDossier {
  const target = current.claims.find((entry) => entry.id === input.claimId);
  if (current.state !== 'available' || !target) throw new Error('evidence claim unavailable');
  const next: IssuerEvidenceDossier = {
    campaignId: current.campaignId,
    revisedOn: today,
    sources: structuredClone(current.sources),
    claims: structuredClone(current.claims),
    corrections: structuredClone(current.corrections),
  };
  if (input.newSource) {
    if (
      next.sources.some((entry) => entry.id === input.newSource!.id) ||
      input.newSource.retrievedOn !== today ||
      !input.sourceIds.includes(input.newSource.id)
    )
      throw new Error('invalid new public source');
    next.sources.push(structuredClone(input.newSource));
  }
  if (current.claims.some((entry) => entry.supersedes === target.id)) throw new Error('correct the latest reviewed replacement');
  if (input.action === 'correction') {
    if (input.text !== undefined || input.humanReviewed !== undefined) throw new Error('unexpected correction fields');
    next.corrections!.push({ id: input.requestId, claimId: target.id, correctedOn: today, note: input.note, sourceIds: input.sourceIds });
  } else {
    if (
      !input.humanReviewed ||
      !input.text ||
      !current.corrections.some((entry) => entry.claimId === target.id) ||
      current.claims.some((entry) => entry.supersedes === target.id)
    )
      throw new Error('explicit review of corrected claim required');
    next.claims.push({
      id: input.requestId,
      area: target.area,
      text: input.text,
      status: 'checked_fact',
      supersedes: target.id,
      sourceIds: input.sourceIds,
      review: { checkedOn: today, note: input.note },
    });
  }
  return parseIssuerEvidence([next], today)[0];
}
