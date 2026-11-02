import fs from 'node:fs';
import path from 'node:path';
import type { PgPoolLike } from './journal.js';

// Community/platform content storage: accounts, wallet-login sessions,
// comments, campaign news, support/feedback tickets and issuer applications.
//
// Two backends, selected by env (see community.ts):
//  - Postgres (production/demo hosting): one JSON document row, mutated under
//    a session advisory lock. Demo scale is small; a per-entity relational
//    schema is a production follow-up (see ROADMAP).
//  - File (local dev/tests): mode-0600 fsynced JSON with rename, same shape.
//
// Data minimization: accounts carry only a Stellar public key and an
// optional display name. Tickets/applications carry only what the submitter
// typed. Retention pruning lives in community.ts (pruneCommunity).

export type Account = {
  publicKey: string;
  displayName: string | null;
  createdAt: number;
  // 'email' accounts log in with email+password (email-auth.ts) and hold a
  // throwaway public key nobody can sign for; undefined means the classic
  // wallet-challenge account. Never shown to other users.
  authMethod?: 'email';
  email?: string;
  // Optional second factor (accounts.ts + totp.ts). Never serialized to
  // clients: encSeed is AES-256-GCM ciphertext, recoveryHashes are SHA-256.
  totp?: TotpEnrollment;
};

export type TotpEnrollment = {
  status: 'pending' | 'enabled';
  encSeed: string; // totp.ts encryptSeed payload; never plaintext
  lastUsedStep: number; // replay protection: steps <= this are rejected
  recoveryHashes: string[]; // sha256 hex of each unused recovery code
  enabledAt: number | null;
  failedAttempts: number;
  lockUntil: number | null; // ms epoch; set after repeated failures
};

export type TotpTicket = {
  id: string;
  publicKey: string;
  expiresAt: number;
};

export type Challenge = {
  id: string;
  publicKey: string;
  message: string;
  expiresAt: number;
  used: boolean;
};

export type Session = {
  tokenHash: string; // sha256 hex of the bearer token; the token itself is never stored
  publicKey: string;
  createdAt: number;
  expiresAt: number;
};

export type EmailCredential = {
  email: string; // normalized lowercase; the record key
  passwordRecord: string; // s2$N$r$p$salt_b64$hash_b64 scrypt, params embedded
  publicKey: string; // throwaway identity keypair; secret discarded at creation
  verified: boolean;
  verifyTokenHash: string | null; // sha256 hex of the single-use blv_ token
  verifyExpiresAt: number | null;
  createdAt: number;
  failedAttempts: number;
  lockUntil: number | null; // ms epoch; set after repeated login failures
  resetTokenHash?: string | null; // sha256 hex of the single-use blr_ reset token
  resetExpiresAt?: number | null;
  resetSentAt?: number | null; // per-email reset-mail cooldown marker
  resendSentAt?: number | null; // per-email verification-resend cooldown marker
};

export type Comment = {
  id: string;
  campaignId: string;
  publicKey: string;
  displayName: string | null;
  body: string;
  createdAt: number;
  hiddenAt: number | null;
  hiddenReason: string | null;
};

export type NewsPost = {
  id: string;
  campaignId: string;
  title: string;
  body: string;
  // Demo honesty: news are posted through the admin key as issuer stand-in.
  // There is no verified issuer identity yet; readers must see that.
  authorLabel: 'platform-demo';
  createdAt: number;
};

export type PodcastEpisode = {
  id: string;
  // Null for platform-wide episodes; set when an episode belongs to one
  // campaign (campaign page podcast tab).
  campaignId: string | null;
  title: string;
  description: string;
  // External audio URL only (https): the platform does not host audio files.
  // Publishing real episodes needs a hosting decision; metadata-only entries
  // are refused by the service so no fake episodes can appear.
  audioUrl: string;
  // Demo honesty, same rule as news: episodes are published through the
  // admin/operator key as platform stand-in; there is no verified issuer
  // identity. Readers must see that label.
  authorLabel: 'platform-demo';
  createdAt: number;
};

// Post-funding report to investors, published after a campaign's funding
// period has ended (deadline passed, verified against the on-chain campaign
// state at publish time - never operator-declared lifecycle). Distinct from
// the campaign news feed and notifications: news is pre/during-funding
// issuer stand-in content, notifications are per-account events; reports are
// the post-close record investors receive about the funded outcome. Demo
// honesty, same rule as news: published through the operator surface as
// platform stand-in, so the author label is fixed and readers are never
// misled into thinking a verified issuer published the report.
export type PostFundingReport = {
  id: string;
  campaignId: string;
  kind: 'funding_outcome' | 'use_of_proceeds' | 'milestone' | 'other';
  title: string;
  body: string;
  authorLabel: 'platform-demo';
  createdAt: number;
};

// Investor investment documents: issuer/operator-published files deliverable
// ONLY to entitled investors of that campaign (same entitlement rule as
// post-funding reports), after an explicit approval step. Content is stored
// server-side and served by an authorized download endpoint - never a public
// URL. Demo honesty: in this prototype every record is demo:true synthetic
// content; no real approved investment document exists yet, and production
// content approval policy is unset (the approve step here is a demo-grade
// operator designation, not legal review).
export type InvestmentDocument = {
  id: string;
  campaignId: string;
  title: string;
  kind: 'kiis' | 'terms' | 'project' | 'other';
  // Synthetic text content served on authorized download. Not a real offer.
  content: string;
  status: 'pending' | 'approved';
  demo: true;
  createdBy: string;
  createdAt: number;
  approvedBy: string | null;
  approvedAt: number | null;
};

// Durable record that a wallet's contribution to a campaign was confirmed
// on-chain (SUCCESS in the intent journal, written by the backend's own
// submit/status paths - never client-asserted). Exists because the
// contract's balance_of entry is REMOVED when a contributor refunds, so a
// current-balance read alone would silently revoke report access from
// refunded investors. Unlike the intent journal (terminal rows pruned after
// ~30 days), this collection is never pruned.
export type ContributorRecord = {
  campaignId: string;
  publicKey: string;
  firstConfirmedAt: number;
};
export type ContributorBackfillCheckpoint = {
  processedThroughLedger: number;
  gap?: 'start-before-floor' | 'cursor-behind-floor';
  floorLedger?: number;
  floorObservedAt?: number;
  latestLedger?: number;
  updatedAt: number;
};

// ECSPR Art. 21 entry knowledge test + loss-simulation record (RTS
// 2022/2114). Data scopes are deliberately distinct: knowledge-test OUTCOME
// and self-declared experience/objectives are provider assessment evidence;
// the transmitted simulation RESULT (net worth + 10% capacity) is stored,
// but the financial INPUTS (income/assets/commitments breakdown) are never
// sent to or stored by the server - the RTS Art. 5(5) rule is that the
// provider must not access, record or interfere with the simulation inputs
// or result computation (our implementation computes client-side, which is
// our chosen way to meet that rule, not the only possible one). Quiz success
// never labels an investor sophisticated: classification follows only
// ECSPR Art. 2(1)(j)/(k) + Annex II (the sophistication approval procedure;
// ECSPR Art. 22 is the pre-contractual reflection period, a separate rule).
// Here only the Annex II Section II request TEMPLATE is captured; no
// approval path exists on this deployment, so every account remains
// non-sophisticated regardless of what it requests.

// Full self-declared information set of ECSPR Art. 21(2) / RTS 2022/2114
// Art. 2. Bands and enums are an implementation choice (demo-chosen), not a
// legally validated assessment; every field offers an explicit 'none' style
// answer so no investor is forced into an inaccurate declaration.
export type AppropriatenessInformation = {
  // RTS Art. 2(1)(a): types of investment services and financial
  // investments the investor is familiar with. 'none' stands alone.
  familiarInvestmentTypes: (
    'deposits' | 'listed_shares' | 'bonds' | 'investment_funds_etfs' | 'crypto_assets' | 'crowdfunding_p2p' | 'real_estate' | 'other' | 'none'
  )[];
  // RTS Art. 2(1)(b): nature, volume, frequency and period of past
  // transactions. 'none' nature stands alone; bands are demo-chosen.
  pastTransactions: {
    natures: ('transferable_securities' | 'admitted_instruments' | 'loans' | 'early_expansion_stage_businesses' | 'none')[];
    annualFrequencyBand: '0' | '1_5' | '6_20' | 'over_20';
    totalVolumeBandEur: '0' | 'under_10k' | '10k_50k' | '50k_100k' | 'over_100k';
    periodYearsBand: 'none' | 'under_1' | '1_3' | '3_10' | 'over_10';
  };
  // RTS Art. 2(1)(c): education and profession/former profession, plus
  // professional experience in relation to crowdfunding investments.
  educationLevel: 'none_relevant' | 'secondary' | 'vocational' | 'bachelor' | 'master_plus' | 'other';
  professionOrFormer: string | null; // optional free text, max 200 chars
  crowdfundingProfessionalExperience: boolean;
  // RTS Art. 2(2)(a)-(b): expected holding period, risk profile,
  // sustainability preferences. (2)(c) aims = the record's objective field.
  holdingPeriod: 'under_1y' | '1_3y' | '3_5y' | 'over_5y' | 'indefinite';
  riskProfile: 'conservative' | 'balanced' | 'risk_tolerant' | 'speculative';
  sustainabilityPreference: 'none' | 'esg_important' | 'impact_first';
};

// ECSPR Annex II Section II request template (capture-only; no approval
// path exists here, so a request never changes the investor's treatment).
// Natural and legal persons attest DIFFERENT Section I criteria (2 of 3 vs
// 1 of 3); the MiFID II professional-client route (Section III) attests no
// criteria and instead references its proof of professional status.
export type SophisticationRequest = {
  route: 'annex_ii_attestation' | 'mifid_professional_client';
  personType: 'natural' | 'legal' | null; // null on the MiFID route
  attestedCriteria: string[]; // Annex II Section I criterion ids; empty on the MiFID route
  professionalClientProof: string | null; // MiFID route only, max 500 chars
  // Annex II Section II items (2) and (3): both must be expressly accepted.
  awarenessStatementAccepted: true;
  liabilityStatementAccepted: true;
  requestedAt: number;
};

export type AppropriatenessRecord = {
  publicKey: string;
  // v1: knowledge test + experience/objective only. v2 adds the full
  // Art. 21(2)/RTS Art. 2 information set and the categorisation block.
  version: 1 | 2;
  // Self-declared experience/objectives (ECSPR Art. 21(2), RTS Art. 2).
  experienceLevel: 'none' | 'some' | 'experienced';
  objective: 'capital_preservation' | 'income' | 'growth' | 'other';
  // v2: the full Art. 21(2) information set; null on v1 records (legacy
  // state is preserved transparently, never silently promoted).
  information?: AppropriatenessInformation | null;
  // v2: investor categorisation. Every account is non-sophisticated; a
  // captured Annex II request is stored as 'sophistication_requested' with
  // no approval/status-upgrade path on this deployment.
  categorisation?: { status: 'non_sophisticated' | 'sophistication_requested'; request: SophisticationRequest | null };
  // Knowledge-test outcome; raw answers are not stored (data minimization).
  knowledgeScore: number;
  knowledgeTotal: number;
  // 'knowledge_check_passed': the entry knowledge quiz scored above the demo
  // pass mark. This is NOT an ECSPR Art. 21(1) appropriateness determination:
  // even with the v2 Art. 21(2)/RTS Art. 2 information set captured, this
  // deployment runs no RTS Art. 1 assessment methodology, so no service is
  // ever determined to be appropriate for anyone here. 'warning_issued':
  // Art. 21(4) path - information missing or knowledge insufficient; the
  // mandated risk warning was shown and must be expressly acknowledged.
  outcome: 'knowledge_check_passed' | 'warning_issued';
  warningAcknowledgedAt: number | null;
  // Transmitted simulation result (RTS Art. 12): the only financial figures
  // the server ever sees. Never the input breakdown.
  simulation: { netWorthEur: number; capacityEur: number; transmittedAt: number } | null;
  completedAt: number;
  // ECSPR Art. 21(3)/(6): assessment review every 2 years, simulation every 1 year.
  reviewAssessmentDueAt: number;
  reviewSimulationDueAt: number | null;
};

export type Ticket = {
  id: string;
  kind: 'support' | 'feedback';
  publicKey: string;
  subject: string;
  body: string;
  status: 'open' | 'closed';
  createdAt: number;
  closedAt: number | null;
};

export type CompanyApplication = {
  id: string;
  publicKey: string;
  companyName: string;
  legalForm: string;
  registrationNumber: string;
  country: string;
  // Manual review, same posture as issuer applications: pending until a real
  // operator decides. Demo honesty: no documents are uploaded or verified in
  // this prototype; the registry fields are applicant-provided claims.
  status: 'pending' | 'approved' | 'rejected';
  createdAt: number;
  decidedAt: number | null;
};

export type IssuerApplication = {
  id: string;
  publicKey: string;
  projectName: string;
  country: string;
  instrumentType: string;
  targetAmount: string;
  description: string;
  contactEmail: string | null;
  status: 'received' | 'under_review' | 'closed';
  createdAt: number;
};

export type NotificationKind = 'application_received' | 'application_status' | 'comment_moderated' | 'ticket_closed' | 'company_received' | 'company_status';

// Owner-scoped notification generated server-side from a real event on the
// owner's own content (application submitted or status change, comment
// moderated, ticket closed). Never fabricated marketing content. title/body
// are server-rendered English fallbacks; clients may localize from kind.
export type Notification = {
  id: string;
  publicKey: string;
  kind: NotificationKind;
  title: string;
  body: string;
  // Structured event data captured at generation time so clients can render
  // localized body templates with verbatim variables instead of parsing the
  // English fallback strings. Absent on rows written before this field
  // existed - clients fall back to title/body there.
  vars?: Record<string, string>;
  refId: string | null;
  createdAt: number;
  readAt: number | null;
};

// Append-only operator/admin action record. Entries are facts about which
// gated mutation ran, when, and on what target - not a security audit
// opinion. Capped (see CommunityService.recordAudit): oldest entries drop
// off, so this is an operational recent-history aid, not an archive.
export type AuditEntry = {
  id: string;
  at: number;
  actor: string; // 'admin-key' or `operator:<wallet>` - which gate the action came through
  action: string; // e.g. 'comment.hide', 'company.status'
  target: string; // entity id the action touched
  detail?: string;
};

export type CommunityState = {
  version: 1;
  accounts: Record<string, Account>;
  emailCredentials: Record<string, EmailCredential>;
  challenges: Record<string, Challenge>;
  totpTickets: Record<string, TotpTicket>;
  sessions: Record<string, Session>;
  comments: Record<string, Comment>;
  news: Record<string, NewsPost>;
  reports: Record<string, PostFundingReport>;
  investmentDocuments: Record<string, InvestmentDocument>;
  // Keyed `${campaignId}:${publicKey}`.
  contributors: Record<string, ContributorRecord>;
  // Chain-history backfill progress per campaign (contributor-backfill.ts):
  // durable cursor plus any honestly-flagged unverifiable history window.
  backfillCheckpoints: Record<string, ContributorBackfillCheckpoint>;
  episodes: Record<string, PodcastEpisode>;
  tickets: Record<string, Ticket>;
  applications: Record<string, IssuerApplication>;
  appropriateness: Record<string, AppropriatenessRecord>;
  companies: Record<string, CompanyApplication>;
  notifications: Record<string, Notification>;
  audit: AuditEntry[];
  // Rolling 1h outbound-mail timestamps (global provider budget). Persisted
  // so a restart/redeploy cannot reset the budget.
  mailSendLog: number[];
  // Set when the provider answers 429: all sends pause until this time.
  mailProviderMutedUntil?: number | null;
};

export function emptyCommunityState(): CommunityState {
  return {
    version: 1,
    accounts: {},
    emailCredentials: {},
    challenges: {},
    totpTickets: {},
    sessions: {},
    comments: {},
    news: {},
    reports: {},
    investmentDocuments: {},
    contributors: {},
    backfillCheckpoints: {},
    episodes: {},
    tickets: {},
    applications: {},
    appropriateness: {},
    companies: {},
    notifications: {},
    audit: [],
    mailSendLog: [],
  };
}

function validate(state: any): CommunityState {
  // Forward-compatible default: docs written before notifications existed
  // gain the collection on first read instead of failing validation.
  if (state && state.version === 1 && !state.notifications) state.notifications = {};
  // Same forward-compatible default for docs written before the audit log.
  if (state && state.version === 1 && !state.audit) state.audit = [];
  if (state && state.version === 1 && !state.companies) state.companies = {};
  // Same forward-compatible default for docs written before TOTP tickets.
  if (state && state.version === 1 && !state.totpTickets) state.totpTickets = {};
  // Same forward-compatible default for docs written before podcast episodes.
  if (state && state.version === 1 && !state.episodes) state.episodes = {};
  // Same forward-compatible default for docs written before post-funding reports.
  if (state && state.version === 1 && !state.reports) state.reports = {};
  // Same forward-compatible default for docs written before contributor records.
  if (state && state.version === 1 && !state.contributors) state.contributors = {};
  // Same forward-compatible default for docs written before backfill checkpoints.
  if (state && state.version === 1 && !state.backfillCheckpoints) state.backfillCheckpoints = {};
  // Same forward-compatible default for docs written before appropriateness records.
  if (state && state.version === 1 && !state.appropriateness) state.appropriateness = {};
  // Same forward-compatible default for docs written before email credentials.
  if (state && state.version === 1 && !state.emailCredentials) state.emailCredentials = {};
  // Same forward-compatible default for docs written before investment documents.
  if (state && state.version === 1 && !state.investmentDocuments) state.investmentDocuments = {};
  // Same forward-compatible default for docs written before the mail budget.
  if (state && state.version === 1 && !state.mailSendLog) state.mailSendLog = [];
  if (
    !state ||
    state.version !== 1 ||
    !state.accounts ||
    !state.emailCredentials ||
    !state.challenges ||
    !state.sessions ||
    !state.comments ||
    !state.news ||
    !state.reports ||
    !state.contributors ||
    !state.backfillCheckpoints ||
    !state.episodes ||
    !state.tickets ||
    !state.applications ||
    !state.appropriateness ||
    !state.companies ||
    !state.notifications
  ) {
    throw new Error('invalid community store; restore or reconcile manually');
  }
  return state as CommunityState;
}

export interface CommunityStore {
  change<T>(fn: (state: CommunityState) => T): Promise<T>;
  read(): Promise<CommunityState>;
}

export class FileCommunityStore implements CommunityStore {
  private queue: Promise<unknown> = Promise.resolve();
  constructor(public readonly filename: string) {}
  read(): Promise<CommunityState> {
    if (!fs.existsSync(this.filename)) return Promise.resolve(emptyCommunityState());
    return Promise.resolve(validate(JSON.parse(fs.readFileSync(this.filename, 'utf8'))));
  }
  change<T>(fn: (state: CommunityState) => T): Promise<T> {
    // Serialize writes within this process; one API process owns the file.
    const run = this.queue.then(async () => {
      const state = await this.read();
      const result = fn(state);
      fs.mkdirSync(path.dirname(this.filename), { recursive: true });
      const tmp = `${this.filename}.tmp-${process.pid}`;
      const fd = fs.openSync(tmp, 'w', 0o600);
      try {
        fs.writeFileSync(fd, JSON.stringify(state));
        fs.fsyncSync(fd);
      } finally {
        fs.closeSync(fd);
      }
      fs.renameSync(tmp, this.filename);
      const dir = fs.openSync(path.dirname(this.filename), 'r');
      try {
        fs.fsyncSync(dir);
      } finally {
        fs.closeSync(dir);
      }
      return result;
    });
    this.queue = run.catch(() => {});
    return run;
  }
}

const PG_DOC_ID = 'main';

export class PostgresCommunityStore implements CommunityStore {
  private ready: Promise<void>;
  constructor(private pool: PgPoolLike) {
    const ddl = `CREATE TABLE IF NOT EXISTS community_store (
      id text PRIMARY KEY,
      doc jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    )`;
    const connector = (this.pool as any).connect?.bind(this.pool);
    this.ready = connector
      ? connector().then(async (client: any) => {
          try {
            await client.query('SELECT pg_advisory_lock(hashtext($1))', ['community_store_schema_init']);
            try {
              await client.query(ddl);
            } finally {
              await client.query('SELECT pg_advisory_unlock(hashtext($1))', ['community_store_schema_init']).catch(() => {});
            }
          } finally {
            client.release();
          }
        })
      : this.pool.query(ddl).then(() => {});
  }
  static async connect(url: string): Promise<PostgresCommunityStore> {
    const { Pool } = (await import('pg')).default;
    return new PostgresCommunityStore(new Pool({ connectionString: url, max: 5 }));
  }
  async read(): Promise<CommunityState> {
    await this.ready;
    const { rows } = await this.pool.query('SELECT doc FROM community_store WHERE id = $1', [PG_DOC_ID]);
    if (rows.length === 0) return emptyCommunityState();
    return validate(rows[0].doc);
  }
  async change<T>(fn: (state: CommunityState) => T): Promise<T> {
    await this.ready;
    const connector = (this.pool as any).connect?.bind(this.pool);
    if (!connector) {
      // Test fakes without connect(): plain read-modify-write.
      const state = await this.read();
      const result = fn(state);
      await this.pool.query(
        'INSERT INTO community_store (id, doc, updated_at) VALUES ($1, $2, now()) ON CONFLICT (id) DO UPDATE SET doc = $2, updated_at = now()',
        [PG_DOC_ID, JSON.stringify(state)],
      );
      return result;
    }
    const client = await connector();
    try {
      await client.query('SELECT pg_advisory_lock(hashtext($1))', ['community_store_change']);
      try {
        const { rows } = await client.query('SELECT doc FROM community_store WHERE id = $1', [PG_DOC_ID]);
        const state = rows.length === 0 ? emptyCommunityState() : validate(rows[0].doc);
        const result = fn(state);
        await client.query(
          'INSERT INTO community_store (id, doc, updated_at) VALUES ($1, $2, now()) ON CONFLICT (id) DO UPDATE SET doc = $2, updated_at = now()',
          [PG_DOC_ID, JSON.stringify(state)],
        );
        return result;
      } finally {
        await client.query('SELECT pg_advisory_unlock(hashtext($1))', ['community_store_change']).catch(() => {});
      }
    } finally {
      client.release();
    }
  }
}
