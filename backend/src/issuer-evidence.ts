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
  })
  .strict();

export type IssuerEvidenceDossier = z.infer<typeof dossier>;
export type EvidenceDossierResult = {
  campaignId: string;
  state: 'not_provided' | 'available' | 'unavailable';
  revisedOn: string | null;
  sources: IssuerEvidenceDossier['sources'];
  claims: IssuerEvidenceDossier['claims'];
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
    for (const item of record.claims) {
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
  const empty = { campaignId, revisedOn: null, sources: [], claims: [], unknownAreas: [...EVIDENCE_AREAS] };
  if (!raw) return { ...empty, state: 'not_provided' };
  try {
    const record = parseIssuerEvidence(JSON.parse(raw)).find((entry) => entry.campaignId === campaignId);
    if (!record) return { ...empty, state: 'not_provided' };
    return {
      ...record,
      state: 'available',
      unknownAreas: EVIDENCE_AREAS.filter((area) => !record.claims.some((entry) => entry.area === area && entry.status === 'checked_fact')),
    };
  } catch {
    // Never show partly validated facts or parser contents in public errors.
    return { ...empty, state: 'unavailable' };
  }
}
