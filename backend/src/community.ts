import { PrivateApplicationUploadWorkflow, type PrivateTextObjects } from './private-application-upload-workflow.js';
import { assertExplicitFileStorePath } from './test-storage-guard.js';
import { createHash, randomBytes } from 'node:crypto';
import { z } from 'zod';
import type {
  CompanyApplication,
  Account,
  Comment,
  CommunityStore,
  IssuerApplication,
  NewsPost,
  PostFundingReport,
  InvestmentDocument,
  IssuerMessage,
  ContributorRecord,
  PodcastEpisode,
  AppropriatenessRecord,
  SophisticationRequest,
  Notification,
  NotificationKind,
  Ticket,
  AuditEntry,
} from './community-store.js';
import { FileCommunityStore, PostgresCommunityStore } from './community-store.js';
import { RateLimiter } from './ratelimit.js';

// Community and support features for the demo platform: campaign comments,
// campaign news, support/feedback tickets and issuer applications.
//
// Security and privacy posture (reviewed before deployment):
//  - Writes require a wallet-login session (accounts.ts); there is no
//    anonymous write path. Auth proves key ownership only, never identity.
//  - Ownership: users see only their own tickets/applications. Admin reads
//    and moderation sit behind the existing x-admin-key gate (demo-grade
//    shared secret; production needs real admin identities).
//  - Abuse: per-account and per-IP sliding-window rate limits, strict length
//    caps, no HTML rendering contract (clients must render as plain text),
//    no links in display names.
//  - Data minimization: no email, name or IP is persisted beyond the
//    submitted content itself; display name is optional.
//  - Retention: tickets and issuer applications are hard-deleted after
//    COMMUNITY_RETENTION_DAYS (default 90); hidden comments after 30 days;
//    expired challenges and sessions are pruned. pruneCommunity runs on boot
//    and hourly.
//  - Errors are safe JSON {error} strings; internals are never returned.

export class CommunityError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    // Stable machine-readable code for client-side localization (see
    // AuthError.code).
    public readonly code?: string,
  ) {
    super(message);
  }
}

export const LIMITS = {
  campaignId: /^[a-z0-9][a-z0-9-]{0,63}$/,
  commentBody: 1000,
  ticketSubject: 120,
  ticketBody: 4000,
  applicationField: 200,
  applicationDescription: 4000,
  newsTitle: 160,
  newsBody: 4000,
  commentsPage: 100,
  notificationsPage: 50,
  notificationsPerAccount: 100,
};

const commentInput = z.object({
  body: z.string().min(1).max(LIMITS.commentBody),
});
const issuerMessageInput = z
  .object({
    body: z.string().trim().min(1).max(LIMITS.ticketBody),
  })
  .strict();
const ticketInput = z.object({
  kind: z.enum(['support', 'feedback']),
  subject: z.string().trim().min(1).max(LIMITS.ticketSubject),
  body: z.string().trim().min(1).max(LIMITS.ticketBody),
});
const applicationInput = z.object({
  projectName: z.string().trim().min(1).max(LIMITS.applicationField),
  country: z.string().trim().min(1).max(LIMITS.applicationField),
  instrumentType: z.string().trim().min(1).max(LIMITS.applicationField),
  targetAmount: z.string().trim().min(1).max(LIMITS.applicationField),
  description: z.string().trim().min(1).max(LIMITS.applicationDescription),
  contactEmail: z.union([z.literal(''), z.string().trim().email().max(LIMITS.applicationField)]).optional(),
});
const companyInput = z.object({
  companyName: z.string().trim().min(1).max(LIMITS.applicationField),
  legalForm: z.string().trim().min(1).max(120),
  registrationNumber: z.string().trim().min(1).max(120),
  country: z.string().trim().min(1).max(120),
});
const newsInput = z.object({
  title: z.string().trim().min(1).max(LIMITS.newsTitle),
  body: z.string().trim().min(1).max(LIMITS.newsBody),
});

const reportInput = z.object({
  kind: z.enum(['funding_outcome', 'use_of_proceeds', 'milestone', 'other']),
  title: z.string().trim().min(1).max(LIMITS.newsTitle),
  body: z.string().trim().min(1).max(LIMITS.newsBody),
});

const episodeInput = z.object({
  title: z.string().trim().min(1).max(LIMITS.newsTitle),
  description: z.string().trim().min(1).max(LIMITS.newsBody),
  // External https audio URL only: the platform does not host audio files.
  // The URL must parse and use https; anything else is rejected.
  audioUrl: z
    .string()
    .trim()
    .max(500)
    .url()
    .refine((u) => u.startsWith('https://'), { message: 'audioUrl must use https' }),
  campaignId: z.string().trim().regex(LIMITS.campaignId).nullish(),
});

// ECSPR Art. 21 / RTS 2022/2114 appropriateness flow inputs. Knowledge-test
// answers are scored and then discarded (only the outcome is stored);
// simulation transmits ONLY the result (net worth + 10% capacity), never the
// income/asset/commitment breakdown (RTS Art. 5(5) provider non-access).
const knowledgeInput = z
  .object({
    experienceLevel: z.enum(['none', 'some', 'experienced']),
    objective: z.enum(['capital_preservation', 'income', 'growth', 'other']),
    answers: z.array(z.number().int().min(0)).min(1).max(50),
  })
  .strict();

// Full ECSPR Art. 21(2) / RTS 2022/2114 Art. 2 information set (v2). All
// fields are banded/enumerated self-declarations - implementation choices,
// not a legally validated assessment - with explicit 'none' options so no
// investor is forced into an inaccurate declaration (RTS Art. 3(2)(c):
// questions must collect information reflecting the investor's situation).
const FAMILIAR_TYPES = [
  'deposits',
  'listed_shares',
  'bonds',
  'investment_funds_etfs',
  'crypto_assets',
  'crowdfunding_p2p',
  'real_estate',
  'other',
  'none',
] as const;
const TRANSACTION_NATURES = ['transferable_securities', 'admitted_instruments', 'loans', 'early_expansion_stage_businesses', 'none'] as const;
const appropriatenessInformationInput = z
  .object({
    familiarInvestmentTypes: z.array(z.enum(FAMILIAR_TYPES)).min(1).max(FAMILIAR_TYPES.length),
    pastTransactions: z
      .object({
        natures: z.array(z.enum(TRANSACTION_NATURES)).min(1).max(TRANSACTION_NATURES.length),
        annualFrequencyBand: z.enum(['0', '1_5', '6_20', 'over_20']),
        totalVolumeBandEur: z.enum(['0', 'under_10k', '10k_50k', '50k_100k', 'over_100k']),
        periodYearsBand: z.enum(['none', 'under_1', '1_3', '3_10', 'over_10']),
      })
      .strict(),
    educationLevel: z.enum(['none_relevant', 'secondary', 'vocational', 'bachelor', 'master_plus', 'other']),
    professionOrFormer: z.string().trim().min(1).max(200).nullable(),
    crowdfundingProfessionalExperience: z.boolean(),
    holdingPeriod: z.enum(['under_1y', '1_3y', '3_5y', 'over_5y', 'indefinite']),
    riskProfile: z.enum(['conservative', 'balanced', 'risk_tolerant', 'speculative']),
    sustainabilityPreference: z.enum(['none', 'esg_important', 'impact_first']),
  })
  .strict()
  .superRefine((info, ctx) => {
    // 'none' answers stand alone; mixing them with actual types would be an
    // inaccurate declaration.
    if (info.familiarInvestmentTypes.length > 1 && info.familiarInvestmentTypes.includes('none'))
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "'none' cannot be combined with other familiar investment types" });
    if (info.pastTransactions.natures.length > 1 && info.pastTransactions.natures.includes('none'))
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "'none' cannot be combined with other past-transaction natures" });
  });

// v2 submission: the v1 knowledge payload plus the optional full Art. 21(2)
// information set. A v1-shaped submission still passes (information null).
const knowledgeV2Input = knowledgeInput.and(z.object({ information: appropriatenessInformationInput.optional() }).strict());

// ECSPR Annex II Section II request template (capture-only). Natural and
// legal persons attest DIFFERENT Section I criteria (at least 2 of 3 vs at
// least 1 of 3); the MiFID II professional-client route (Annex II Section
// III) attests no criteria and references its proof of status instead.
const NATURAL_CRITERIA = [
  'np_income_60k_or_portfolio_over_100k',
  'np_financial_sector_1y_or_exec_12m',
  'np_10_significant_transactions_per_quarter_4q',
] as const;
const LEGAL_CRITERIA = ['lp_own_funds_100k', 'lp_net_turnover_2m', 'lp_balance_sheet_1m'] as const;
const sophisticationRequestInput = z
  .object({
    route: z.enum(['annex_ii_attestation', 'mifid_professional_client']),
    personType: z.enum(['natural', 'legal']).nullable(),
    attestedCriteria: z.array(z.string()).max(8),
    professionalClientProof: z.string().trim().min(1).max(500).nullable(),
    awarenessStatementAccepted: z.literal(true),
    liabilityStatementAccepted: z.literal(true),
  })
  .strict()
  .superRefine((req, ctx) => {
    const bad = (m: string) => ctx.addIssue({ code: z.ZodIssueCode.custom, message: m });
    if (req.route === 'mifid_professional_client') {
      if (req.personType !== null || req.attestedCriteria.length > 0) bad('the MiFID professional-client route attests no Annex II Section I criteria');
      if (!req.professionalClientProof) bad('the MiFID professional-client route requires a reference to the proof of professional status');
      return;
    }
    if (req.professionalClientProof !== null) bad('professional-client proof only applies to the MiFID route');
    const ids = new Set(req.attestedCriteria);
    if (ids.size !== req.attestedCriteria.length) bad('duplicate attested criteria');
    if (req.personType === 'natural') {
      if (req.attestedCriteria.some((c) => !(NATURAL_CRITERIA as readonly string[]).includes(c)))
        bad('natural persons attest only Annex II Section I(2) natural-person criteria');
      if (ids.size < 2) bad('natural persons must meet at least two of the three Annex II Section I(2) criteria');
    } else if (req.personType === 'legal') {
      if (req.attestedCriteria.some((c) => !(LEGAL_CRITERIA as readonly string[]).includes(c)))
        bad('legal persons attest only Annex II Section I(1) legal-person criteria');
      if (ids.size < 1) bad('legal persons must meet at least one of the three Annex II Section I(1) criteria');
    } else bad('the Annex II attestation route requires a person type');
  });
// .strict(): any financial input field (income, assets, commitments
// breakdown) sent by a client is REJECTED, not silently stripped - the
// server structurally cannot receive the simulation inputs (RTS Art. 5(5)).
const simulationResultInput = z
  .object({
    netWorthEur: z.number().finite().min(0).max(1_000_000_000),
    capacityEur: z.number().finite().min(0).max(100_000_000),
  })
  .strict();

// Demo knowledge test (synthetic content, marked demo in the UI). Scope
// follows RTS 2022/2114 Art. 1: risks of investing in general plus risks of
// crowdfunding services specifically. The server scores; raw answers are
// never stored.
export const KNOWLEDGE_QUESTIONS: { id: string; correct: number }[] = [
  { id: 'lose-all', correct: 0 }, // "Can you lose the entirety of the money invested?" -> yes
  { id: 'deposit-guarantee', correct: 1 }, // covered by deposit guarantee schemes? -> no
  { id: 'liquidity', correct: 1 }, // easily resold at any time? -> no
  { id: 'default-risk', correct: 0 }, // early-stage loans riskier than listed bonds? -> yes
  { id: 'diversification', correct: 0 }, // spreading investments reduces risk? -> yes
];
const KNOWLEDGE_PASS = 4; // of 5; below this ECSPR Art. 21(4) warning path applies. Demo-chosen threshold; the RTS mandates no pass mark.

// ECSPR Art. 21(3)/(6): the assessment is reviewed "every two years" and the
// simulation "every year" after the initial one - calendar anniversaries,
// not fixed 730/365-day spans (leap years drift those from the legal
// anniversary; e.g. 2026-11-01 + 730 days lands 2028-10-31, one day early).
function addCalendarYears(ts: number, years: number): number {
  const d = new Date(ts);
  d.setFullYear(d.getFullYear() + years);
  return d.getTime();
}

// Records written before the outcome rename carry 'appropriate'; normalize
// on read so the API never presents quiz completion as an Art. 21(1)
// appropriateness determination.
function normalizeOutcome(rec: AppropriatenessRecord): AppropriatenessRecord {
  if ((rec.outcome as string) === 'appropriate') rec.outcome = 'knowledge_check_passed';
  return rec;
}

// v1 records predate the categorisation block; reads fill the honest
// default without rewriting stored legacy state.
function normalizeCategorisation(rec: AppropriatenessRecord): NonNullable<AppropriatenessRecord['categorisation']> {
  return rec.categorisation ?? { status: 'non_sophisticated', request: null };
}

function normalizeRecord(rec: AppropriatenessRecord): AppropriatenessRecord {
  normalizeOutcome(rec);
  rec.categorisation = normalizeCategorisation(rec);
  if (rec.information === undefined) rec.information = null;
  return rec;
}

function newId(prefix: string): string {
  return `${prefix}_${randomBytes(12).toString('hex')}`;
}

export function requireCampaignId(id: unknown): string {
  if (typeof id !== 'string' || !LIMITS.campaignId.test(id)) throw new CommunityError(400, 'invalid campaign id', 'invalid_campaign_id');
  return id;
}

export type PublicComment = Pick<Comment, 'id' | 'campaignId' | 'body' | 'createdAt'> & { author: string };

// An owner's own comment, including moderation state they are entitled to see.
export type OwnComment = PublicComment & { hidden: boolean };

function publicComment(c: Comment): PublicComment {
  return {
    id: c.id,
    campaignId: c.campaignId,
    body: c.body,
    createdAt: c.createdAt,
    // Never expose the full wallet key; display name if set, else a hint.
    author: c.displayName ?? `${c.publicKey.slice(0, 4)}…${c.publicKey.slice(-4)}`,
  };
}

export class CommunityService {
  readonly limiter = new RateLimiter();
  constructor(
    public readonly store: CommunityStore,
    private opts: {
      retentionDays: number;
      now?: () => number;
      applicationUploadMode?: 'legacy-inline' | 'oracle-private';
      privateApplicationObjects?: PrivateTextObjects;
    } = {
      retentionDays: 90,
    },
  ) {}
  private now(): number {
    return this.opts.now?.() ?? Date.now();
  }

  checkRate(key: string, limit: number, windowMs: number): void {
    if (!this.limiter.allow(key, limit, windowMs)) throw new CommunityError(429, 'rate limit exceeded; slow down and retry later', 'rate_limited');
  }

  async listComments(campaignId: string): Promise<PublicComment[]> {
    requireCampaignId(campaignId);
    const state = await this.store.read();
    return Object.values(state.comments)
      .filter((c) => c.campaignId === campaignId && !c.hiddenAt)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, LIMITS.commentsPage)
      .map(publicComment);
  }

  async addComment(campaignId: string, account: Account, input: unknown, ip?: string): Promise<PublicComment> {
    requireCampaignId(campaignId);
    const { body } = commentInput.parse(input ?? {});
    this.checkRate(`comment:${account.publicKey}`, 10, 60 * 60 * 1000);
    if (ip) this.checkRate(`comment-ip:${ip}`, 30, 60 * 60 * 1000);
    const now = this.now();
    const comment: Comment = {
      id: newId('cmt'),
      campaignId,
      publicKey: account.publicKey,
      displayName: account.displayName,
      body,
      createdAt: now,
      hiddenAt: null,
      hiddenReason: null,
    };
    await this.store.change((state) => {
      state.comments[comment.id] = comment;
    });
    return publicComment(comment);
  }

  async listNews(campaignId: string): Promise<NewsPost[]> {
    requireCampaignId(campaignId);
    const state = await this.store.read();
    return Object.values(state.news)
      .filter((n) => n.campaignId === campaignId)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, LIMITS.commentsPage);
  }

  // Admin-gated at the router. Hard removal for moderation cleanup (e.g.
  // synthetic QA fixtures); the audit log keeps the evidence trail (id,
  // campaign, title) once the content itself is gone.
  async deleteNews(id: string, actor = 'admin-area'): Promise<void> {
    let target: NewsPost | undefined;
    await this.store.change((state) => {
      const n = state.news[id];
      if (!n) throw new CommunityError(404, 'news post not found', 'not_found');
      target = n;
      delete state.news[id];
    });
    const removed: NewsPost = target as NewsPost;
    await this.recordAudit(actor, 'news.delete', id, `campaign=${removed.campaignId} title=${removed.title}`);
  }

  // Admin-gated at the router. News are platform stand-in posts for the demo
  // campaign: the author label is fixed so readers are never misled into
  // thinking a verified issuer published them.
  async addNews(campaignId: string, input: unknown, actor = 'admin-area'): Promise<NewsPost> {
    requireCampaignId(campaignId);
    const { title, body } = newsInput.parse(input ?? {});
    const post: NewsPost = {
      id: newId('news'),
      campaignId,
      title,
      body,
      authorLabel: 'platform-demo',
      createdAt: this.now(),
    };
    await this.store.change((state) => {
      state.news[post.id] = post;
    });
    await this.recordAudit(actor, 'news.post', post.id, `campaign=${campaignId} title=${post.title}`);
    return post;
  }

  // Post-funding reports to investors. The post-close gate (deadline passed,
  // read from the on-chain campaign state) is enforced at the router before
  // this is called; the service stores exactly what the operator submitted,
  // never generates content. Same stand-in honesty as news: fixed
  // 'platform-demo' author label, no verified issuer identity.
  async addReport(campaignId: string, input: unknown, actor = 'admin-area'): Promise<PostFundingReport> {
    requireCampaignId(campaignId);
    const { kind, title, body } = reportInput.parse(input ?? {});
    const report: PostFundingReport = {
      id: newId('report'),
      campaignId,
      kind,
      title,
      body,
      authorLabel: 'platform-demo',
      createdAt: this.now(),
    };
    await this.store.change((state) => {
      state.reports[report.id] = report;
    });
    await this.recordAudit(actor, 'report.publish', report.id, `campaign=${campaignId} kind=${report.kind} title=${report.title}`);
    return report;
  }

  // Durable contributor registry. Written only by the backend's own
  // submit/status confirmation path (and its startup backfill from the
  // journal), keyed idempotently; never written from client-supplied data.
  // actor names the writer for audit provenance: 'backend-journal' for the
  // app submit/confirm path, 'backend-backfill' for chain-event recovery.
  async recordContributor(campaignId: string, publicKey: string, actor = 'backend-journal'): Promise<void> {
    requireCampaignId(campaignId);
    if (!/^G[A-Z2-7]{55}$/.test(publicKey)) throw new Error('invalid contributor public key');
    const key = `${campaignId}:${publicKey}`;
    let inserted = false;
    await this.store.change((state) => {
      if (!state.contributors[key]) {
        state.contributors[key] = { campaignId, publicKey, firstConfirmedAt: this.now() };
        inserted = true;
      }
    });
    if (inserted) await this.recordAudit(actor, 'contributor.record', key, `campaign=${campaignId}`);
  }

  async getContributorBackfillCheckpoint(campaignId: string) {
    requireCampaignId(campaignId);
    const state = await this.store.read();
    return state.backfillCheckpoints[campaignId];
  }

  async setContributorBackfillCheckpoint(campaignId: string, cp: import('./community-store.js').ContributorBackfillCheckpoint): Promise<void> {
    requireCampaignId(campaignId);
    if (!Number.isSafeInteger(cp.processedThroughLedger) || cp.processedThroughLedger <= 0) {
      throw new Error('invalid backfill checkpoint');
    }
    await this.store.change((state) => {
      state.backfillCheckpoints[campaignId] = cp;
    });
  }

  async listContributorBackfillCheckpoints() {
    const state = await this.store.read();
    return { ...state.backfillCheckpoints };
  }

  async hasContributed(campaignId: string, publicKey: string): Promise<boolean> {
    requireCampaignId(campaignId);
    const state = await this.store.read();
    return Boolean(state.contributors[`${campaignId}:${publicKey}`]);
  }

  // Read-side listing for operator exports (share register). Same registry
  // write discipline applies: rows originate only from network-derived
  // contribution facts, never client-supplied data.
  async listContributors(campaignId: string): Promise<ContributorRecord[]> {
    requireCampaignId(campaignId);
    const state = await this.store.read();
    return Object.values(state.contributors).filter((c) => c.campaignId === campaignId);
  }

  // --- Investment documents (investor-entitled delivery) ---
  // Publication and approval are operator-gated at the router. All content
  // in this prototype is demo:true synthetic; approval is a demo-grade
  // operator designation, NOT legal/content review (production policy unset).
  async publishInvestmentDocument(
    actor: string,
    input: { campaignId: string; title: string; kind: InvestmentDocument['kind']; content: string },
  ): Promise<InvestmentDocument> {
    requireCampaignId(input.campaignId);
    const title = String(input.title ?? '').trim();
    if (!title || title.length > 200) throw new Error('invalid document title');
    if (!['kiis', 'terms', 'project', 'other'].includes(input.kind)) throw new Error('invalid document kind');
    const content = String(input.content ?? '');
    if (!content.trim() || content.length > 64 * 1024) throw new Error('invalid document content');
    const doc: InvestmentDocument = {
      id: newId('idoc'),
      campaignId: input.campaignId,
      title,
      kind: input.kind,
      content,
      status: 'pending',
      demo: true,
      createdBy: actor,
      createdAt: this.now(),
      approvedBy: null,
      approvedAt: null,
    };
    await this.store.change((state) => {
      state.investmentDocuments[doc.id] = doc;
    });
    await this.recordAudit(actor, 'investment-document.publish', doc.id, `campaign=${input.campaignId} title=${title}`);
    return doc;
  }

  async approveInvestmentDocument(id: string, actor: string): Promise<InvestmentDocument> {
    let doc: InvestmentDocument | undefined;
    await this.store.change((state) => {
      doc = state.investmentDocuments[id];
      if (!doc) throw new Error('investment document not found');
      if (doc.status !== 'approved') {
        doc.status = 'approved';
        doc.approvedBy = actor;
        doc.approvedAt = this.now();
      }
    });
    await this.recordAudit(actor, 'investment-document.approve', id, `campaign=${doc!.campaignId}`);
    return doc!;
  }

  // Investor-facing listing: approved documents only. Pending documents are
  // never listed to investors (unapproved content is undeliverable).
  async listInvestmentDocuments(campaignId: string): Promise<Omit<InvestmentDocument, 'content'>[]> {
    requireCampaignId(campaignId);
    const state = await this.store.read();
    return Object.values(state.investmentDocuments)
      .filter((d) => d.campaignId === campaignId && d.status === 'approved')
      .sort((a, b) => b.createdAt - a.createdAt)
      .map(({ content, ...meta }) => meta);
  }

  // Operator-facing listing: all statuses, metadata only.
  async listAllInvestmentDocuments(campaignId: string): Promise<Omit<InvestmentDocument, 'content'>[]> {
    requireCampaignId(campaignId);
    const state = await this.store.read();
    return Object.values(state.investmentDocuments)
      .filter((d) => d.campaignId === campaignId)
      .sort((a, b) => b.createdAt - a.createdAt)
      .map(({ content, ...meta }) => meta);
  }

  // Download path: full record including content. Entitlement + approval
  // checks happen at the router BEFORE this is called.
  async getInvestmentDocument(id: string): Promise<InvestmentDocument | undefined> {
    const state = await this.store.read();
    return state.investmentDocuments[id];
  }

  async listReports(campaignId: string): Promise<PostFundingReport[]> {
    requireCampaignId(campaignId);
    const state = await this.store.read();
    return Object.values(state.reports)
      .filter((r) => r.campaignId === campaignId)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, LIMITS.commentsPage);
  }

  // --- Investor-issuer messaging ---
  // Private per-investor threads on one campaign. Entitlement (investor) and
  // operator gates are enforced at the ROUTER before these run - the service
  // never decides access. Author honesty: operator messages are labeled
  // operator, never a verified issuer (none exists in this prototype).
  // Not a legal, advice or regulatory record channel.

  // Investor posts into their own thread. operatorKeys receive a
  // notification; the caller (router) resolves them from its own config.
  async postIssuerMessage(campaignId: string, account: Account, input: unknown, operatorKeys: string[]): Promise<IssuerMessage> {
    requireCampaignId(campaignId);
    const { body } = issuerMessageInput.parse(input ?? {});
    const message: IssuerMessage = {
      id: newId('msg'),
      campaignId,
      investorKey: account.publicKey,
      authorKey: account.publicKey,
      authorRole: 'investor',
      body,
      createdAt: this.now(),
    };
    await this.store.change((state) => {
      state.issuerMessages![message.id] = message;
    });
    await this.recordAudit(account.publicKey, 'issuer_message.post', message.id, `campaign=${campaignId} role=investor`);
    for (const key of operatorKeys.slice(0, 20)) {
      await this.notify(key, 'issuer_message', 'issuer_message.new', body.slice(0, 280), message.id, { campaignId });
    }
    return message;
  }

  // Operator replies into an investor's thread. The investor gets notified.
  async replyIssuerMessage(campaignId: string, investorKey: string, operator: Account, input: unknown): Promise<IssuerMessage> {
    requireCampaignId(campaignId);
    if (!/^[a-zA-Z0-9]{1,120}$/.test(investorKey)) throw new CommunityError(400, 'invalid thread reference', 'invalid_input');
    // input carries { investorKey, body } - parse only the body so the strict schema never rejects the thread key
    const { body } = issuerMessageInput.parse({ body: (input as { body?: unknown } | null | undefined)?.body });
    const existing = await this.store.read();
    const thread = Object.values(existing.issuerMessages ?? {}).filter((m) => m.campaignId === campaignId && m.investorKey === investorKey);
    if (thread.length === 0) throw new CommunityError(404, 'message thread not found', 'not_found');
    const message: IssuerMessage = {
      id: newId('msg'),
      campaignId,
      investorKey,
      authorKey: operator.publicKey,
      authorRole: 'operator',
      body,
      createdAt: this.now(),
    };
    await this.store.change((state) => {
      state.issuerMessages![message.id] = message;
    });
    await this.recordAudit(operator.publicKey, 'issuer_message.reply', message.id, `campaign=${campaignId} role=operator`);
    await this.notify(investorKey, 'issuer_message', 'issuer_message.reply', body.slice(0, 280), message.id, { campaignId });
    return message;
  }

  // The investor's own thread, oldest first. Caller's entitlement gate ran.
  async listIssuerThread(campaignId: string, investorKey: string): Promise<IssuerMessage[]> {
    requireCampaignId(campaignId);
    const state = await this.store.read();
    return Object.values(state.issuerMessages ?? {})
      .filter((m) => m.campaignId === campaignId && m.investorKey === investorKey)
      .sort((a, b) => a.createdAt - b.createdAt)
      .slice(-LIMITS.commentsPage);
  }

  // Operator view: every thread of the campaign, oldest first per thread.
  async listIssuerThreads(campaignId: string): Promise<IssuerMessage[]> {
    requireCampaignId(campaignId);
    const state = await this.store.read();
    return Object.values(state.issuerMessages ?? {})
      .filter((m) => m.campaignId === campaignId)
      .sort((a, b) => a.createdAt - b.createdAt)
      .slice(-500);
  }

  // Podcast episodes. Admin/operator-gated at the router, same honesty
  // posture as news: the author label is fixed 'platform-demo' because there
  // is no verified issuer identity. Audio is never hosted by the platform;
  // only an external https URL is stored. Metadata-only entries (no audioUrl)
  // are refused by episodeInput, so no fake episodes can be published.
  async addEpisode(input: unknown, actor = 'admin-area'): Promise<PodcastEpisode> {
    const { title, description, audioUrl, campaignId } = episodeInput.parse(input ?? {});
    if (campaignId) requireCampaignId(campaignId);
    const episode: PodcastEpisode = {
      id: newId('ep'),
      campaignId: campaignId ?? null,
      title,
      description,
      audioUrl,
      authorLabel: 'platform-demo',
      createdAt: this.now(),
    };
    await this.store.change((state) => {
      state.episodes[episode.id] = episode;
    });
    await this.recordAudit(actor, 'podcast.publish', episode.id, `campaign=${episode.campaignId ?? 'platform'} title=${episode.title}`);
    return episode;
  }

  // Admin-gated at the router. Hard removal for moderation cleanup (e.g.
  // synthetic QA fixtures); the audit log keeps the evidence trail (id,
  // campaign, title) once the content itself is gone.
  async deleteEpisode(id: string, actor = 'admin-area'): Promise<void> {
    let target: PodcastEpisode | undefined;
    await this.store.change((state) => {
      const e = state.episodes[id];
      if (!e) throw new CommunityError(404, 'episode not found', 'not_found');
      target = e;
      delete state.episodes[id];
    });
    const removed: PodcastEpisode = target as PodcastEpisode;
    await this.recordAudit(actor, 'podcast.delete', id, `campaign=${removed.campaignId ?? 'platform'} title=${removed.title}`);
  }

  // Latest episodes across the platform, newest first. Episodes are public
  // (same visibility as news); the podcast page and campaign tabs read
  // through these.
  async listEpisodes(limit = 20): Promise<PodcastEpisode[]> {
    const state = await this.store.read();
    return Object.values(state.episodes)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, Math.min(Math.max(limit, 1), 50));
  }

  async listCampaignEpisodes(campaignId: string): Promise<PodcastEpisode[]> {
    requireCampaignId(campaignId);
    const state = await this.store.read();
    return Object.values(state.episodes)
      .filter((e) => e.campaignId === campaignId)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  // --- ECSPR Art. 21 appropriateness test + loss simulation (RTS 2022/2114) ---
  // Synthetic QA scope: the flow is fully implemented, but it is demo
  // infrastructure; no live sensitive-data collection and no real-money
  // gating until activation is separately approved. Every account is treated
  // as non-sophisticated: quiz success never labels sophistication.
  // Categorisation follows ECSPR Art. 2(1)(j)/(k) + Annex II; only the
  // Annex II request TEMPLATE is captured here - there is no approval path,
  // so a captured request never changes an account's treatment.

  async getAppropriateness(account: Account): Promise<AppropriatenessRecord | null> {
    const state = await this.store.read();
    const rec = state.appropriateness[account.publicKey];
    return rec ? normalizeRecord(rec) : null;
  }

  // Knowledge test + self-declared experience/objectives (Art. 21(1)-(2)).
  // Scored server-side; answers are used for scoring and then dropped.
  async submitKnowledgeAssessment(account: Account, input: unknown): Promise<AppropriatenessRecord> {
    const { experienceLevel, objective, answers, information } = knowledgeV2Input.parse(input ?? {});
    if (answers.length !== KNOWLEDGE_QUESTIONS.length) throw new CommunityError(400, `expected ${KNOWLEDGE_QUESTIONS.length} answers`, 'answers_count');
    let score = 0;
    answers.forEach((a, i) => {
      if (a === KNOWLEDGE_QUESTIONS[i].correct) score += 1;
    });
    const outcome: AppropriatenessRecord['outcome'] = score >= KNOWLEDGE_PASS ? 'knowledge_check_passed' : 'warning_issued';
    const now = this.now();
    const record: AppropriatenessRecord = {
      publicKey: account.publicKey,
      version: information ? 2 : 1,
      experienceLevel,
      objective,
      information: information ?? null,
      categorisation: { status: 'non_sophisticated', request: null },
      knowledgeScore: score,
      knowledgeTotal: KNOWLEDGE_QUESTIONS.length,
      outcome,
      // A retake starts a new warning cycle: any prior acknowledgment is
      // reset so the Art. 21(4) warning must be expressly acknowledged again.
      warningAcknowledgedAt: null,
      simulation: null,
      completedAt: now,
      reviewAssessmentDueAt: addCalendarYears(now, 2),
      reviewSimulationDueAt: null,
    };
    await this.store.change((state) => {
      // Preserve a previously transmitted simulation across a retake; its
      // yearly review date stands on its own cycle (Art. 21(6)).
      const prev = state.appropriateness[account.publicKey];
      if (prev?.simulation) {
        record.simulation = prev.simulation;
        record.reviewSimulationDueAt = prev.reviewSimulationDueAt;
      }
      // A captured Annex II request also stands on its own; a knowledge
      // retake never erases or upgrades it (capture-only, no approval path).
      if (prev?.categorisation?.request) record.categorisation = normalizeCategorisation(prev);
      state.appropriateness[account.publicKey] = record;
    });
    await this.recordAudit(
      `account:${account.publicKey}`,
      'appropriateness.assess',
      account.publicKey,
      `score=${score}/${KNOWLEDGE_QUESTIONS.length} outcome=${outcome}`,
    );
    return record;
  }

  // Transmitted simulation result (RTS Art. 12). Only the two result
  // figures arrive here; the input breakdown never leaves the investor's
  // browser (RTS Art. 5(5): the provider must not access or record the
  // inputs or interfere with the result - our implementation computes
  // client-side as the chosen way to meet that rule).
  async transmitSimulationResult(account: Account, input: unknown): Promise<AppropriatenessRecord> {
    const { netWorthEur, capacityEur } = simulationResultInput.parse(input ?? {});
    // Capacity is 10% of net worth (Art. 21(5)); tolerate 1 cent rounding.
    if (Math.abs(capacityEur - netWorthEur * 0.1) > 0.01)
      throw new CommunityError(400, 'capacityEur must equal 10% of netWorthEur (rounding to cents tolerated)', 'capacity_mismatch');
    const now = this.now();
    const record = await this.store.change((state) => {
      const rec = state.appropriateness[account.publicKey];
      if (!rec) throw new CommunityError(409, 'complete the knowledge assessment before transmitting a simulation result', 'assessment_required');
      rec.simulation = { netWorthEur, capacityEur, transmittedAt: now };
      rec.reviewSimulationDueAt = addCalendarYears(now, 1);
      return normalizeRecord(rec);
    });
    await this.recordAudit(`account:${account.publicKey}`, 'appropriateness.simulation', account.publicKey, `capacity=${capacityEur}`);
    return record;
  }

  // Art. 21(4): the risk warning must be expressly acknowledged. Only
  // meaningful on the warning path; acknowledging an 'appropriate' outcome
  // is a no-op error so the UI state machine stays honest.
  async acknowledgeWarning(account: Account): Promise<AppropriatenessRecord> {
    const record = await this.store.change((state) => {
      const rec = state.appropriateness[account.publicKey];
      if (!rec) throw new CommunityError(409, 'no assessment on record', 'assessment_missing');
      if (rec.outcome !== 'warning_issued') throw new CommunityError(409, 'no risk warning is pending acknowledgment', 'warning_not_pending');
      if (rec.warningAcknowledgedAt) throw new CommunityError(409, 'risk warning already acknowledged', 'warning_already_acknowledged');
      rec.warningAcknowledgedAt = this.now();
      return normalizeRecord(rec);
    });
    await this.recordAudit(`account:${account.publicKey}`, 'appropriateness.warning_ack', account.publicKey, 'art21(4) warning acknowledged');
    return record;
  }

  // ECSPR Annex II Section II: capture the request template for treatment
  // as a sophisticated investor. CAPTURE-ONLY: this deployment has no
  // approval path (approval requires the provider's written internal
  // policies and reasonable-steps verification - operator scope, not
  // implemented), so the stored status is 'sophistication_requested' and
  // every account continues to be treated as non-sophisticated. Natural and
  // legal persons attest different Section I criteria (validated in the
  // input schema); the MiFID II professional-client route (Section III)
  // references its proof of status instead. Resubmission replaces the prior
  // request; it never erases the audit trail.
  async requestSophistication(account: Account, input: unknown): Promise<AppropriatenessRecord> {
    const parsed = sophisticationRequestInput.parse(input ?? {});
    const now = this.now();
    const request: SophisticationRequest = {
      route: parsed.route,
      personType: parsed.personType,
      attestedCriteria: parsed.attestedCriteria,
      professionalClientProof: parsed.professionalClientProof,
      awarenessStatementAccepted: parsed.awarenessStatementAccepted,
      liabilityStatementAccepted: parsed.liabilityStatementAccepted,
      requestedAt: now,
    };
    const record = await this.store.change((state) => {
      const rec = state.appropriateness[account.publicKey];
      if (!rec) throw new CommunityError(409, 'complete the knowledge assessment before requesting sophisticated-investor treatment', 'assessment_required');
      rec.categorisation = { status: 'sophistication_requested', request };
      return normalizeRecord(rec);
    });
    await this.recordAudit(
      `account:${account.publicKey}`,
      'categorisation.sophistication_request',
      account.publicKey,
      `route=${request.route} personType=${request.personType ?? 'n/a'} criteria=${request.attestedCriteria.length} (capture-only; no approval path)`,
    );
    return record;
  }

  async createTicket(account: Account, input: unknown): Promise<Ticket> {
    const parsed = ticketInput.parse(input ?? {});
    this.checkRate(`ticket:${account.publicKey}`, 5, 24 * 60 * 60 * 1000);
    const ticket: Ticket = {
      id: newId('tkt'),
      kind: parsed.kind,
      publicKey: account.publicKey,
      subject: parsed.subject,
      body: parsed.body,
      status: 'open',
      createdAt: this.now(),
      closedAt: null,
    };
    await this.store.change((state) => {
      state.tickets[ticket.id] = ticket;
    });
    return ticket;
  }

  async listOwnTickets(account: Account): Promise<Ticket[]> {
    const state = await this.store.read();
    return Object.values(state.tickets)
      .filter((t) => t.publicKey === account.publicKey)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  // Latest news across every campaign, newest first. News are public
  // (same visibility as the per-campaign endpoint); the account feed and any
  // site-wide news view read through this.
  async listAllNews(limit = 20): Promise<NewsPost[]> {
    const state = await this.store.read();
    return Object.values(state.news)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, Math.min(Math.max(limit, 1), 50));
  }

  async listOwnApplications(account: Account): Promise<IssuerApplication[]> {
    if (this.store.readOwnApplications) {
      const rows = await this.store.readOwnApplications(account.publicKey);
      if (!Array.isArray(rows) || rows.some((a) => !a || typeof a !== 'object' || Array.isArray(a))) throw new Error('invalid owner application projection');
      return rows.filter((a) => a.publicKey === account.publicKey).sort((a, b) => b.createdAt - a.createdAt);
    }
    const state = await this.store.read();
    return Object.values(state.applications)
      .filter((a) => a.publicKey === account.publicKey)
      .map((a) => ({
        ...a,
        documentCleanupPending: Object.values(state.privateApplicationDeletions ?? {}).some(
          (job) => job.applicationId === a.id && job.owner === account.publicKey && job.status !== 'deleted',
        ),
      }))
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  async listOwnComments(account: Account): Promise<OwnComment[]> {
    const state = await this.store.read();
    return Object.values(state.comments)
      .filter((c) => c.publicKey === account.publicKey)
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((c) => ({ ...publicComment(c), hidden: Boolean(c.hiddenAt) }));
  }

  async submitApplication(account: Account, input: unknown, draft = false): Promise<IssuerApplication> {
    const parsed = applicationInput.parse(input ?? {});
    this.checkRate(`application:${account.publicKey}`, 3, 24 * 60 * 60 * 1000);
    const application: IssuerApplication = {
      id: newId('app'),
      publicKey: account.publicKey,
      projectName: parsed.projectName,
      country: parsed.country,
      instrumentType: parsed.instrumentType,
      targetAmount: parsed.targetAmount,
      description: parsed.description,
      contactEmail: parsed.contactEmail ? parsed.contactEmail : null,
      status: draft ? 'draft' : 'received',
      ...(!draft ? { submittedAt: this.now() } : {}),
      reviewedBy: null,
      reviewedAt: null,
      reviewNote: null,
      createdAt: this.now(),
    };
    await this.store.change((state) => {
      state.applications[application.id] = application;
    });
    if (!draft)
      await this.notify(
        account.publicKey,
        'application_received',
        'Issuer application received',
        `Your issuer application for "${application.projectName}" was received. The operator reviews applications manually; submission is not an approval, a listing or an offer.`,
        application.id,
        { projectName: application.projectName },
      );
    return application;
  }

  async submitDraftApplication(account: Account, id: string) {
    const result = await this.store.change((s) => {
      const a = s.applications[id];
      if (!a || a.publicKey !== account.publicKey) throw new CommunityError(404, 'application not found', 'not_found');
      if (a.status !== 'draft' || a.submittedAt !== undefined) throw new CommunityError(409, 'application already submitted', 'review_closed');
      const pending = Object.values(s.privateApplicationUploads?.intents ?? {}).some(
        (i) => i.applicationId === id && i.status !== 'committed' && i.status !== 'deleted',
      );
      const pendingDelete = Object.values(s.privateApplicationDeletions ?? {}).some((i) => i.applicationId === id && i.status !== 'deleted');
      if (pending || pendingDelete) throw new CommunityError(409, 'document reconciliation required before submission', 'upload_reconciliation');
      a.status = 'received';
      a.submittedAt = this.now();
      return a;
    });
    await this.recordAudit(account.publicKey, 'application.submit', id, 'draft submitted');
    return result;
  }

  // Only cleanup status proves this request already observed a completed PUT.
  // Never promote uploading/uncertain merely because time elapsed or GET is 404.
  async queueFailedApplicationUploadCleanup(operationId: string): Promise<'pending' | 'blocked' | 'deleted'> {
    return this.store.change((s) => {
      if (s.privateApplicationUploads?.version !== 1) return 'blocked';
      const i = s.privateApplicationUploads.intents[operationId];
      if (!i) return 'blocked';
      if (i.status === 'deleted') return 'deleted';
      if (i.status !== 'cleanup') return 'blocked';
      const same = (ref: import('./oci-private-text-store.js').PrivateTextRef) => ref.key === i.object.key && ref.storageId === i.object.storageId;
      if (
        Object.values(s.applications).some((a) => a.documents?.some((d) => d.object && same(d.object))) ||
        Object.values(s.privateApplicationUploads?.intents ?? {}).some((other) => other !== i && other.status !== 'deleted' && same(other.object))
      )
        return 'blocked';
      const documentId = i.documentId ?? `appdoc_${i.id}`;
      const old = s.privateApplicationDeletions?.[documentId];
      if (old?.status === 'deleted') return 'blocked';
      if (
        old &&
        (old.applicationId !== i.applicationId ||
          old.owner !== i.owner ||
          old.object.key !== i.object.key ||
          old.object.storageId !== i.object.storageId ||
          old.object.sha256 !== i.object.sha256 ||
          old.object.bytes !== i.object.bytes)
      )
        return 'blocked';
      i.documentId = documentId;
      s.privateApplicationDeletions ??= {};
      s.privateApplicationDeletions[documentId] ??= {
        applicationId: i.applicationId,
        owner: i.owner,
        documentId,
        object: { ...i.object },
        status: 'pending',
        createdAt: this.now(),
      };
      return 'pending';
    });
  }

  // Internal worker entry point, never exposed as an HTTP caller-supplied ref.
  async reconcileApplicationDocumentDeletion(documentId: string): Promise<'deleted' | 'pending' | 'blocked'> {
    const remove = this.opts.privateApplicationObjects?.remove;
    if (!remove) return 'pending';
    const claim = newId('cleanup');
    const reservation = await this.store.change((s) => {
      const job = s.privateApplicationDeletions?.[documentId];
      if (!job) return { status: 'blocked' as const };
      if (job.status === 'deleted') return { status: 'deleted' as const };
      if (job.status === 'deleting' && (job.claimUntil ?? Infinity) > this.now()) return { status: 'pending' as const };
      const matches = (ref: import('./oci-private-text-store.js').PrivateTextRef) => ref.key === job.object.key && ref.storageId === job.object.storageId;
      const intent = Object.values(s.privateApplicationUploads?.intents ?? {}).find(
        (i) =>
          i.documentId === documentId &&
          i.applicationId === job.applicationId &&
          i.owner === job.owner &&
          i.status === 'cleanup' &&
          matches(i.object) &&
          i.object.sha256 === job.object.sha256 &&
          i.object.bytes === job.object.bytes,
      );
      const referenced = Object.values(s.applications).some((a) => a.documents?.some((d) => d.object && matches(d.object)));
      const otherIntent = Object.values(s.privateApplicationUploads?.intents ?? {}).some((i) => i !== intent && i.status !== 'deleted' && matches(i.object));
      if (!intent || referenced || otherIntent) return { status: 'blocked' as const };
      job.status = 'deleting';
      job.claim = claim;
      job.claimUntil = this.now() + 60_000;
      return { status: 'claimed' as const, object: { ...job.object }, operationId: intent.id };
    });
    if (reservation.status !== 'claimed') return reservation.status;
    try {
      await remove.call(this.opts.privateApplicationObjects, reservation.object);
    } catch {
      return 'pending';
    } // Unknown outcome: retain same key and claim for safe retry.
    try {
      return await this.store.change((s) => {
        const job = s.privateApplicationDeletions?.[documentId];
        const intent = s.privateApplicationUploads?.intents[reservation.operationId];
        if (!job || job.claim !== claim || job.status !== 'deleting' || !intent || intent.status !== 'cleanup') return 'pending' as const;
        // A late older claim must never finalize a newer worker's claim.
        job.status = 'deleted';
        delete job.claim;
        delete job.claimUntil;
        intent.status = 'deleted';
        return 'deleted' as const;
      });
    } catch {
      return 'pending';
    }
  }

  async deleteApplicationDocument(account: Account, id: string, documentId: string) {
    return this.store.change((s) => {
      const a = s.applications[id];
      if (!a || a.publicKey !== account.publicKey) throw new CommunityError(404, 'document not found', 'not_found');
      const document = a.documents?.find((d) => d.id === documentId);
      if (!document) throw new CommunityError(404, 'document not found', 'not_found');
      if (a.status !== 'draft' || a.submittedAt !== undefined || a.campaign)
        throw new CommunityError(409, 'submitted application documents cannot be deleted', 'review_closed');
      if (document.object) {
        const intents = Object.values(s.privateApplicationUploads?.intents ?? {});
        const intent = intents.find(
          (i) =>
            i.applicationId === id &&
            i.owner === account.publicKey &&
            i.status === 'committed' &&
            i.documentId === documentId &&
            i.object.storageId === document.object!.storageId &&
            i.object.key === document.object!.key &&
            i.object.sha256 === document.object!.sha256 &&
            i.object.bytes === document.object!.bytes,
        );
        if (!intent) throw new CommunityError(503, 'upload reconciliation required', 'upload_reconciliation');
        s.privateApplicationDeletions ??= {};
        s.privateApplicationDeletions[documentId] = {
          applicationId: id,
          owner: account.publicKey,
          documentId,
          object: { ...document.object },
          status: 'pending',
          createdAt: this.now(),
        };
        intent.status = 'cleanup';
      }
      a.documents = a.documents!.filter((d) => d.id !== documentId);
      s.audit.push({
        id: newId('audit'),
        actor: account.publicKey,
        action: 'application.document.delete_requested',
        target: id,
        detail: `document=${documentId}`,
        at: this.now(),
      });
      if (s.audit.length > 1000) s.audit = s.audit.slice(-1000);
      return { pending: Boolean(document.object) };
    });
  }

  // Application uploads are private plain-text DEMO documents, never identity
  // evidence. Embedded storage inherits application ownership and retention.
  // Only unsubmitted drafts accept files; review sees the same
  // immutable content hash as the applicant. No HTML/PDF execution or public URL.
  private privateApplicationWorkflow() {
    const repo = {
      read: async () => {
        const s = await this.store.read();
        return { applications: s.applications, intents: s.privateApplicationUploads?.intents ?? {} };
      },
      change: <T>(fn: (s: import('./private-application-upload-workflow.js').UploadState) => T) =>
        this.store.change((s) => {
          const uploads = (s.privateApplicationUploads ??= { version: 1 as const, intents: {} });
          if (uploads.version !== 1) throw new CommunityError(503, 'upload reconciliation required', 'upload_reconciliation');
          const committed = new Set(
            Object.values(uploads.intents)
              .filter((i) => i.status === 'committed')
              .map((i) => i.id),
          );
          const result = fn({ applications: s.applications, intents: uploads.intents });
          for (const i of Object.values(uploads.intents))
            if (i.status === 'committed' && !committed.has(i.id))
              s.audit.push({
                id: newId('audit'),
                at: this.now(),
                actor: i.owner,
                action: 'application.document',
                target: i.applicationId,
                detail: `document=${i.documentId} sha256=${i.object.sha256}`,
              });
          if (s.audit.length > 1000) s.audit = s.audit.slice(-1000);
          return result;
        }),
    };
    return new PrivateApplicationUploadWorkflow(repo, this.opts.privateApplicationObjects, () => this.now());
  }

  async addApplicationDocument(account: Account, id: string, input: unknown) {
    if (
      this.opts.applicationUploadMode === 'oracle-private' ||
      this.opts.privateApplicationObjects ||
      (input && typeof input === 'object' && 'operationId' in input)
    ) {
      const parsed = z
        .object({ filename: z.string().trim(), content: z.string().min(1).max(16000), operationId: z.string() })
        .strict()
        .parse(input);
      try {
        return await this.privateApplicationWorkflow().upload(account.publicKey, id, parsed.operationId, parsed.filename, parsed.content);
      } catch (error) {
        const message = error instanceof Error ? error.message : '';
        const errors: Record<string, [number, string]> = {
          'document not found': [404, 'not_found'],
          'application review is closed': [409, 'review_closed'],
          'document limit reached': [409, 'document_limit'],
          'invalid plain-text document': [400, 'invalid_document'],
          'invalid upload operation': [400, 'invalid_input'],
          'upload operation conflict': [409, 'upload_conflict'],
          'upload reconciliation required': [503, 'upload_reconciliation'],
        };
        const [status, code] = errors[message] ?? [503, 'feature_unavailable'];
        throw new CommunityError(status, errors[message] ? message : 'private document storage unavailable', code);
      }
    }
    const parsed = z
      .object({
        filename: z
          .string()
          .trim()
          .regex(/^[a-zA-Z0-9][a-zA-Z0-9._ -]{0,99}\.txt$/),
        content: z.string().min(1).max(16000),
      })
      .strict()
      .parse(input);
    if (Buffer.byteLength(parsed.content, 'utf8') > 16000 || [...parsed.content].some((c) => c.charCodeAt(0) < 32 && !['\t', '\n', '\r'].includes(c)))
      throw new CommunityError(400, 'invalid plain-text document', 'invalid_document');
    const document = { id: newId('appdoc'), ...parsed, sha256: createHash('sha256').update(parsed.content).digest('hex'), uploadedAt: this.now() };
    await this.store.change((state) => {
      const a = state.applications[id];
      if (!a || a.publicKey !== account.publicKey) throw new CommunityError(404, 'application not found', 'not_found');
      if (a.campaign || a.status !== 'draft' || a.submittedAt !== undefined) throw new CommunityError(409, 'application review is closed', 'review_closed');
      if ((a.documents?.length ?? 0) >= 5) throw new CommunityError(409, 'document limit reached', 'document_limit');
      (a.documents ??= []).push(document);
    });
    await this.recordAudit(account.publicKey, 'application.document', id, `document=${document.id} sha256=${document.sha256}`);
    return document;
  }

  async readApplicationDocument(id: string, documentId: string, owner?: string) {
    const state = await this.store.read();
    const a = state.applications[id];
    if (!a || (owner !== undefined ? a.publicKey !== owner : a.status === 'draft')) throw new CommunityError(404, 'document not found', 'not_found');
    const document = a.documents?.find((d) => d.id === documentId);
    if (!document) throw new CommunityError(404, 'document not found', 'not_found');
    if (document.object) {
      if (!this.opts.privateApplicationObjects) throw new CommunityError(503, 'private document storage unavailable', 'feature_unavailable');
      try {
        return { ...document, content: await this.opts.privateApplicationObjects.read(document.object) };
      } catch {
        throw new CommunityError(503, 'private document storage unavailable', 'feature_unavailable');
      }
    }
    if (typeof document.content !== 'string') throw new CommunityError(404, 'document not found', 'not_found');
    return document;
  }

  // Link only a registered, creator-matching testnet campaign. This records a
  // connection, not deployment, listing permission, identity or legal approval.
  async linkApplicationCampaign(id: string, campaign: { id: string; contractId: string; creator: string; network: string }, actor: string) {
    requireCampaignId(campaign.id);
    if (campaign.network !== 'testnet' || !/^C[A-Z2-7]{55}$/.test(campaign.contractId))
      throw new CommunityError(400, 'testnet campaign required', 'invalid_campaign');
    await this.store.change((state) => {
      const a = state.applications[id];
      if (!a || a.status === 'draft') throw new CommunityError(404, 'application not found', 'not_found');
      if (a.status !== 'approved') throw new CommunityError(409, 'prototype review approval required', 'review_required');
      if (a.publicKey !== campaign.creator) throw new CommunityError(409, 'campaign creator does not match applicant', 'creator_mismatch');
      if (!a.documents?.length) throw new CommunityError(409, 'application document required', 'document_required');
      if (a.campaign || Object.values(state.applications).some((x) => x.campaign?.id === campaign.id))
        throw new CommunityError(409, 'campaign already linked', 'campaign_linked');
      a.campaign = { id: campaign.id, contractId: campaign.contractId, linkedAt: this.now(), linkedBy: actor };
    });
    await this.recordAudit(actor, 'application.campaign', id, `campaign=${campaign.id} contract=${campaign.contractId} testnet`);
  }

  // --- Owner-scoped notifications ---
  // Generated only from real events on the owner's own content; there is no
  // path that fabricates notification content. notify() runs as its own
  // store.change AFTER the triggering change completes: nesting a change
  // inside another change's fn would deadlock the Postgres advisory lock.
  private async notify(
    publicKey: string,
    kind: NotificationKind,
    title: string,
    body: string,
    refId: string | null,
    vars: Record<string, string>,
  ): Promise<void> {
    const n: Notification = {
      id: newId('ntf'),
      publicKey,
      kind,
      title,
      body,
      vars,
      refId,
      createdAt: this.now(),
      readAt: null,
    };
    await this.store.change((state) => {
      state.notifications[n.id] = n;
      // Bound growth per account: keep the newest notificationsPerAccount.
      const own = Object.values(state.notifications)
        .filter((x) => x.publicKey === publicKey)
        .sort((a, b) => b.createdAt - a.createdAt);
      for (const stale of own.slice(LIMITS.notificationsPerAccount)) delete state.notifications[stale.id];
    });
  }

  async listNotifications(account: Account): Promise<{ notifications: Notification[]; unreadCount: number }> {
    const state = await this.store.read();
    const own = Object.values(state.notifications)
      .filter((n) => n.publicKey === account.publicKey)
      .sort((a, b) => b.createdAt - a.createdAt);
    return {
      notifications: own.slice(0, LIMITS.notificationsPage),
      unreadCount: own.filter((n) => n.readAt === null).length,
    };
  }

  async markNotificationRead(account: Account, id: string): Promise<void> {
    const now = this.now();
    await this.store.change((state) => {
      const n = state.notifications[id];
      // Same 404 for missing and other-owned: no cross-account enumeration.
      if (!n || n.publicKey !== account.publicKey) throw new CommunityError(404, 'notification not found', 'not_found');
      if (n.readAt === null) n.readAt = now;
    });
  }

  async markAllNotificationsRead(account: Account): Promise<{ marked: number }> {
    const now = this.now();
    let marked = 0;
    await this.store.change((state) => {
      for (const n of Object.values(state.notifications)) {
        if (n.publicKey === account.publicKey && n.readAt === null) {
          n.readAt = now;
          marked++;
        }
      }
    });
    return { marked };
  }

  // Admin operations (router gates them behind x-admin-key).
  // Recent-history audit of gated mutations. Audit write failures are
  // logged but never mask a committed mutation; the entry records the gate
  // the action came through, not a verified identity beyond that.
  async recordAudit(actor: string, action: string, target: string, detail?: string): Promise<void> {
    try {
      await this.store.change((state) => {
        state.audit.push({ id: newId('audit'), at: this.now(), actor, action, target, ...(detail ? { detail } : {}) });
        if (state.audit.length > 500) state.audit.splice(0, state.audit.length - 500);
      });
    } catch (err) {
      console.error('audit write failed:', err instanceof Error ? err.message : err);
    }
  }

  async adminAuditLog(limit = 100): Promise<AuditEntry[]> {
    const state = await this.store.read();
    const capped = Math.max(1, Math.min(500, Math.floor(limit)));
    return [...state.audit].sort((a, b) => b.at - a.at).slice(0, capped);
  }

  async adminListComments(): Promise<Comment[]> {
    const state = await this.store.read();
    return Object.values(state.comments).sort((a, b) => b.createdAt - a.createdAt);
  }
  async adminSetCommentHidden(id: string, hidden: boolean, reason?: string, actor = 'admin-area'): Promise<void> {
    let target: Comment | undefined;
    await this.store.change((state) => {
      const c = state.comments[id];
      if (!c) throw new CommunityError(404, 'comment not found', 'not_found');
      c.hiddenAt = hidden ? this.now() : null;
      c.hiddenReason = hidden ? (reason ?? null) : null;
      target = c;
    });
    await this.recordAudit(actor, hidden ? 'comment.hide' : 'comment.unhide', id, hidden ? reason : undefined);
    if (hidden && target) {
      const c: Comment = target;
      await this.notify(
        c.publicKey,
        'comment_moderated',
        'Comment hidden by moderation',
        `Your comment on campaign "${c.campaignId}" was hidden by the moderator.${c.hiddenReason ? ` Reason: ${c.hiddenReason}` : ''}`,
        c.id,
        c.hiddenReason ? { campaignId: c.campaignId, reason: c.hiddenReason } : { campaignId: c.campaignId },
      );
    }
  }
  async adminListTickets(): Promise<Ticket[]> {
    const state = await this.store.read();
    return Object.values(state.tickets).sort((a, b) => b.createdAt - a.createdAt);
  }
  async adminCloseTicket(id: string, actor = 'admin-area'): Promise<void> {
    let target: Ticket | undefined;
    await this.store.change((state) => {
      const t = state.tickets[id];
      if (!t) throw new CommunityError(404, 'ticket not found', 'not_found');
      t.status = 'closed';
      t.closedAt = this.now();
      target = t;
    });
    await this.recordAudit(actor, 'ticket.close', id);
    if (target) {
      const t: Ticket = target;
      await this.notify(t.publicKey, 'ticket_closed', 'Support ticket closed', `Your ${t.kind} ticket "${t.subject}" was closed.`, t.id, {
        ticketKind: t.kind,
        subject: t.subject,
      });
    }
  }
  async applyForCompany(account: Account, input: unknown): Promise<CompanyApplication> {
    const parsed = companyInput.parse(input ?? {});
    this.checkRate(`company:${account.publicKey}`, 3, 24 * 60 * 60 * 1000);
    const company: CompanyApplication = {
      id: newId('co'),
      publicKey: account.publicKey,
      companyName: parsed.companyName,
      legalForm: parsed.legalForm,
      registrationNumber: parsed.registrationNumber,
      country: parsed.country,
      status: 'pending',
      createdAt: this.now(),
      decidedAt: null,
    };
    await this.store.change((state) => {
      state.companies[company.id] = company;
    });
    await this.notify(
      account.publicKey,
      'company_received',
      'Company account application received',
      `Your company account application for "${company.companyName}" was received and is pending manual review.`,
      company.id,
      { companyName: company.companyName },
    );
    return company;
  }

  async myCompanies(publicKey: string): Promise<CompanyApplication[]> {
    const state = await this.store.read();
    return Object.values(state.companies)
      .filter((c) => c.publicKey === publicKey)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  async adminListCompanies(): Promise<CompanyApplication[]> {
    const state = await this.store.read();
    return Object.values(state.companies).sort((a, b) => b.createdAt - a.createdAt);
  }

  async adminSetCompanyStatus(id: string, status: unknown, actor = 'admin-area'): Promise<void> {
    if (status !== 'approved' && status !== 'rejected') throw new CommunityError(400, 'status must be approved or rejected', 'invalid_status');
    const company = await this.store.change((state) => {
      const c = state.companies[id];
      if (!c) return null;
      c.status = status;
      c.decidedAt = this.now();
      return { ...c };
    });
    if (!company) throw new CommunityError(404, 'company application not found', 'not_found');
    await this.recordAudit(actor, 'company.status', id, String(status));
    await this.notify(
      company.publicKey,
      'company_status',
      'Company account application update',
      `Your company account application for "${company.companyName}" is now ${status}.`,
      company.id,
      { companyName: company.companyName, status },
    );
  }

  async adminListApplications(): Promise<IssuerApplication[]> {
    const state = await this.store.read();
    return Object.values(state.applications)
      .filter((a) => a.status !== 'draft')
      .sort((a, b) => b.createdAt - a.createdAt);
  }
  // Review outcomes are prototype review states only: 'approved' here means
  // the operator finished reviewing the demo submission. It is NOT a legal
  // approval, identity verification, listing or offer - the notification
  // copy says so every time, and nothing in the platform gates capability
  // on it. A rejection requires an operator note so the applicant is not
  // left guessing.
  async adminSetApplicationStatus(id: string, status: unknown, actor = 'admin-area', note?: unknown): Promise<void> {
    if (status !== 'received' && status !== 'under_review' && status !== 'approved' && status !== 'rejected' && status !== 'closed')
      throw new CommunityError(400, 'invalid status', 'invalid_status');
    const reviewNote = typeof note === 'string' && note.trim() ? note.trim().slice(0, 500) : null;
    if (status === 'rejected' && !reviewNote) throw new CommunityError(400, 'rejection requires an operator note', 'note_required');
    const terminal = status === 'approved' || status === 'rejected';
    let target: IssuerApplication | undefined;
    await this.store.change((state) => {
      const a = state.applications[id];
      if (!a || a.status === 'draft') throw new CommunityError(404, 'application not found', 'not_found');
      a.status = status;
      if (terminal || reviewNote) {
        a.reviewedBy = actor;
        a.reviewedAt = this.now();
        a.reviewNote = reviewNote;
      }
      target = a;
    });
    await this.recordAudit(actor, 'application.status', id, reviewNote ? `${status}: ${reviewNote}` : String(status));
    if (target) {
      const t: IssuerApplication = target;
      const honesty = terminal ? ' This is a prototype review outcome only - not a legal approval, identity verification, listing or offer.' : '';
      const noteText = reviewNote ? ` Operator note: ${reviewNote}` : '';
      await this.notify(
        t.publicKey,
        'application_status',
        'Issuer application update',
        `Your issuer application for "${t.projectName}" is now "${status}".${honesty}${noteText}`,
        t.id,
        reviewNote ? { projectName: t.projectName, status, note: reviewNote } : { projectName: t.projectName, status },
      );
    }
  }

  // Retention: hard-delete personal submitted content after its retention
  // window, hidden comments after 30 days, and expired auth artifacts.
  async prune(): Promise<{ removed: number }> {
    const now = this.now();
    const retentionMs = this.opts.retentionDays * 24 * 60 * 60 * 1000;
    const hiddenCommentMs = 30 * 24 * 60 * 60 * 1000;
    let removed = 0;
    await this.store.change((state) => {
      for (const [id, t] of Object.entries(state.tickets)) {
        if (now - t.createdAt > retentionMs) {
          delete state.tickets[id];
          removed++;
        }
      }
      for (const [id, a] of Object.entries(state.applications)) {
        if (now - a.createdAt > retentionMs) {
          if (
            a.documents?.some((d) => d.object) ||
            Object.values(state.privateApplicationUploads?.intents ?? {}).some((i) => i.applicationId === id && i.status !== 'deleted') ||
            Object.values(state.privateApplicationDeletions ?? {}).some((i) => i.applicationId === id && i.status !== 'deleted')
          )
            continue; // Keep private applications until a separately reviewed retention policy clears every owned object.
          delete state.applications[id];
          removed++;
        }
      }
      for (const [id, n] of Object.entries(state.notifications)) {
        if (now - n.createdAt > retentionMs) {
          delete state.notifications[id];
          removed++;
        }
      }
      for (const [id, c] of Object.entries(state.comments)) {
        if (c.hiddenAt && now - c.hiddenAt > hiddenCommentMs) {
          delete state.comments[id];
          removed++;
        }
      }
      for (const [id, ch] of Object.entries(state.challenges)) {
        if (ch.expiresAt <= now) {
          delete state.challenges[id];
          removed++;
        }
      }
      for (const [id, s] of Object.entries(state.sessions)) {
        if (s.expiresAt <= now) {
          delete state.sessions[id];
          removed++;
        }
      }
    });
    this.limiter.sweep(24 * 60 * 60 * 1000);
    return { removed };
  }
}

export async function communityStoreFromEnv(): Promise<CommunityStore> {
  const url = process.env.COMMUNITY_DATABASE_URL ?? process.env.SOROBAN_JOURNAL_DATABASE_URL;
  if (url) return PostgresCommunityStore.connect(url);
  // Fail closed where durable storage is expected: hosted deployments set
  // SOROBAN_JOURNAL_BACKEND=postgres (Render filesystem is ephemeral, so a
  // silent file fallback would lose user content on every deploy).
  if (process.env.SOROBAN_JOURNAL_BACKEND === 'postgres' || process.env.COMMUNITY_REQUIRE_POSTGRES === '1') {
    throw new Error('community storage requires COMMUNITY_DATABASE_URL or SOROBAN_JOURNAL_DATABASE_URL; refusing to fall back to a volatile file store');
  }
  assertExplicitFileStorePath(process.env.COMMUNITY_STORE_PATH, 'COMMUNITY_STORE_PATH');
  return new FileCommunityStore(process.env.COMMUNITY_STORE_PATH ?? './data/community-store.json');
}
