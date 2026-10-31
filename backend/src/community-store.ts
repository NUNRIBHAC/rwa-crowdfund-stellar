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

export type NotificationKind =
  | 'application_received'
  | 'application_status'
  | 'comment_moderated'
  | 'ticket_closed'
  | 'company_received'
  | 'company_status';

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
  challenges: Record<string, Challenge>;
  sessions: Record<string, Session>;
  comments: Record<string, Comment>;
  news: Record<string, NewsPost>;
  tickets: Record<string, Ticket>;
  applications: Record<string, IssuerApplication>;
  companies: Record<string, CompanyApplication>;
  notifications: Record<string, Notification>;
  audit: AuditEntry[];
};

export function emptyCommunityState(): CommunityState {
  return {
    version: 1,
    accounts: {},
    challenges: {},
    sessions: {},
    comments: {},
    news: {},
    tickets: {},
    applications: {},
    companies: {},
    notifications: {},
    audit: [],
  };
}

function validate(state: any): CommunityState {
  // Forward-compatible default: docs written before notifications existed
  // gain the collection on first read instead of failing validation.
  if (state && state.version === 1 && !state.notifications) state.notifications = {};
  // Same forward-compatible default for docs written before the audit log.
  if (state && state.version === 1 && !state.audit) state.audit = [];
  if (state && state.version === 1 && !state.companies) state.companies = {};
  if (
    !state ||
    state.version !== 1 ||
    !state.accounts ||
    !state.challenges ||
    !state.sessions ||
    !state.comments ||
    !state.news ||
    !state.tickets ||
    !state.applications ||
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
