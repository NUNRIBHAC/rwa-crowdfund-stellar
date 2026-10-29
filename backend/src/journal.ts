import fs from 'node:fs';
import path from 'node:path';

// Durable signed-intent journal. The journal is safety state: it records
// every prepared/signed envelope so broadcast ambiguity is never resolved by
// building a replacement. Two backends: atomic local file (default, single
// developer) and Postgres (hosted deployments where the filesystem is
// ephemeral). Backend selection is explicit; a configured Postgres backend
// that cannot be reached fails closed, never silently falls back to a file.
export type Intent = { hash: string; campaign: string; actor: string; action: string; xdr: string; signedXdr?: string; status: string; amount?: string };
export type IntentStore = { intents: Intent[] };

export interface Journal {
  read(): Promise<IntentStore>;
  save(store: IntentStore): Promise<void>;
}

class FileJournal implements Journal {
  constructor(private file: string) {}
  async read(): Promise<IntentStore> {
    return fs.existsSync(this.file) ? JSON.parse(fs.readFileSync(this.file, 'utf8')) : { intents: [] };
  }
  async save(store: IntentStore): Promise<void> {
    fs.mkdirSync(path.dirname(this.file), { recursive: true });
    const tmp = `${this.file}.tmp`; const fd = fs.openSync(tmp, 'w', 0o600);
    try { fs.writeFileSync(fd, JSON.stringify(store)); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
    fs.renameSync(tmp, this.file);
    const dir = fs.openSync(path.dirname(this.file), 'r'); try { fs.fsyncSync(dir); } finally { fs.closeSync(dir); }
  }
}

// Minimal pool surface so tests can inject a fake; the real implementation is
// a pg.Pool created from SOROBAN_JOURNAL_DATABASE_URL.
export interface PgPoolLike {
  query(text: string, params?: unknown[]): Promise<{ rows: any[] }>;
  end(): Promise<void>;
}

export class PostgresJournal implements Journal {
  private ready: Promise<void>;
  constructor(private pool: PgPoolLike) {
    this.ready = pool.query(`CREATE TABLE IF NOT EXISTS soroban_intents (
      seq bigserial PRIMARY KEY,
      hash text NOT NULL UNIQUE,
      campaign text NOT NULL,
      actor text NOT NULL,
      action text NOT NULL,
      amount text,
      xdr text NOT NULL,
      signed_xdr text,
      status text NOT NULL
    )`).then(() => {});
  }
  static async connect(url: string | undefined): Promise<PostgresJournal> {
    if (!url) throw new Error('SOROBAN_JOURNAL_BACKEND=postgres requires SOROBAN_JOURNAL_DATABASE_URL; refusing to fall back to a volatile file journal');
    const { Pool } = (await import('pg')).default;
    return new PostgresJournal(new Pool({ connectionString: url }));
  }
  async read(): Promise<IntentStore> {
    await this.ready;
    const r = await this.pool.query('SELECT hash, campaign, actor, action, amount, xdr, signed_xdr, status FROM soroban_intents ORDER BY seq');
    return {
      intents: r.rows.map(row => ({
        hash: row.hash, campaign: row.campaign, actor: row.actor, action: row.action,
        xdr: row.xdr, status: row.status,
        ...(row.signed_xdr != null ? { signedXdr: row.signed_xdr } : {}),
        ...(row.amount != null ? { amount: row.amount } : {}),
      })),
    };
  }
  async save(store: IntentStore): Promise<void> {
    await this.ready;
    await this.pool.query('BEGIN');
    try {
      for (const i of store.intents) {
        await this.pool.query(
          `INSERT INTO soroban_intents (hash, campaign, actor, action, amount, xdr, signed_xdr, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (hash) DO UPDATE SET campaign = EXCLUDED.campaign, actor = EXCLUDED.actor, action = EXCLUDED.action,
             amount = EXCLUDED.amount, xdr = EXCLUDED.xdr, signed_xdr = EXCLUDED.signed_xdr, status = EXCLUDED.status`,
          [i.hash, i.campaign, i.actor, i.action, i.amount ?? null, i.xdr, i.signedXdr ?? null, i.status]);
      }
      await this.pool.query('COMMIT');
    } catch (err) {
      await this.pool.query('ROLLBACK').catch(() => {});
      throw err;
    }
  }
}

let instance: Promise<Journal> | null = null;
export function journalBackend(): Promise<Journal> {
  if (!instance) {
    const backend = (process.env.SOROBAN_JOURNAL_BACKEND ?? 'file').toLowerCase();
    if (backend === 'file') {
      instance = Promise.resolve(new FileJournal(process.env.SOROBAN_INTENTS_PATH ?? path.resolve('data/soroban-intents.json')));
    } else if (backend === 'postgres') {
      instance = PostgresJournal.connect(process.env.SOROBAN_JOURNAL_DATABASE_URL);
    } else {
      throw new Error(`unknown SOROBAN_JOURNAL_BACKEND '${backend}' (expected file or postgres)`);
    }
    // A failed connect must not poison later attempts behind a rejected memo.
    instance.catch(() => { instance = null; });
  }
  return instance;
}
// Test hook: reset the memoized backend between scenarios.
export function resetJournalBackendForTests(): void { instance = null; }
