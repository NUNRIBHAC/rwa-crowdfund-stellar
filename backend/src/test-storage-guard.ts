import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Fail-closed test isolation: a test process must never open a Postgres
// connection to a non-local database. Test runs inherit the environment of
// the shell that launched them; when that shell is inside a live deployment
// (e.g. docker exec into a running container), the inherited
// SOROBAN_JOURNAL_DATABASE_URL points at the hosted database and fixture
// writes land in production data. This happened on 2026-11-06: a suite run
// via docker exec wrote phantom rows into the hosted journal.
//
// There is deliberately no bypass flag. Tests that need Postgres use a local
// disposable database (localhost) or inject fakes through the existing test
// hooks (injectJournalBackendForTests, constructor-injected pools).

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);

function isLocalDatabaseUrl(raw: string): boolean {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    // Unparseable DSN: refuse, fail closed.
    return false;
  }
  if (url.protocol !== 'postgres:' && url.protocol !== 'postgresql:') return false;
  // pg-connection-string copies query options before the authority host;
  // the last host query value wins; an empty value uses the authority host.
  // Refuse native/libpq alternate routing rather than guessing its target.
  if (url.searchParams.has('hostaddr') || url.searchParams.has('service')) return false;
  try {
    const hosts = url.searchParams.getAll('host');
    const host = hosts.at(-1) || decodeURIComponent(url.hostname);
    return LOCAL_HOSTS.has(host) || host.startsWith('/');
  } catch {
    return false;
  }
}

// Two markers: the npm test scripts set NODE_ENV=test, and `node --test`
// itself sets NODE_TEST_CONTEXT in every spawned test file process. The
// second marker keeps the guard armed for direct runner invocations that
// skip the npm scripts (e.g. `node --test test/foo.test.ts` inside a live
// container - exactly the leak vector this guard exists for).
export function isTestProcess(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.NODE_ENV === 'test' || typeof env.NODE_TEST_CONTEXT === 'string';
}

// Call immediately before opening a real Postgres connection. Inert outside
// test processes; fail-closed inside them.
export function assertTestSafeDatabaseUrl(rawUrl: string | undefined, sourceVar: string, env: NodeJS.ProcessEnv = process.env): void {
  if (!isTestProcess(env)) return;
  if (!rawUrl) {
    throw new Error(`test isolation: ${sourceVar} is empty in a test process; refusing to open a Postgres connection without an explicit local database URL`);
  }
  if (!isLocalDatabaseUrl(rawUrl)) {
    throw new Error(
      `test isolation: refusing Postgres connection from a test process to a non-local database via ${sourceVar}. ` +
        'Tests must use a localhost database or inject fakes via the existing test hooks; there is no bypass.',
    );
  }
}

// G1: a constructor-injected REAL pg Pool bypasses the connect() guard, so
// every Postgres store constructor re-checks the pool it receives. Real pg
// Pool instances expose options.connectionString; fake test pools carry no
// options and remain injectable unchanged.
export function assertPooledDatabaseUrlTestSafe(pool: unknown, env: NodeJS.ProcessEnv = process.env): void {
  if (!isTestProcess(env)) return;
  const opts = (pool as { options?: { connectionString?: unknown; host?: unknown } } | null | undefined)?.options;
  if (!opts || typeof opts !== 'object') return; // fake test pool: no pg options, stays injectable
  if (typeof opts.connectionString === 'string') {
    assertTestSafeDatabaseUrl(opts.connectionString, 'constructor-injected pg Pool connectionString', env);
    return;
  }
  // pg resolves host lazily at connect: Pool({host}) is inspectable, but a
  // bare Pool() silently inherits PGHOST. Both must fail closed here.
  const host = typeof opts.host === 'string' && opts.host.length > 0 ? opts.host : env.PGHOST;
  if (typeof host === 'string' && host.length > 0 && !LOCAL_HOSTS.has(host) && !host.startsWith('/')) {
    const via = typeof opts.host === 'string' && opts.host.length > 0 ? 'pg Pool host option' : 'inherited PGHOST';
    throw new Error(
      `test isolation: refusing Postgres connection from a test process to a non-local database ('${host}' via ${via}). ` +
        'Tests must use a localhost database or inject fakes via the existing test hooks; there is no bypass.',
    );
  }
}

// Community test storage must be issued by this process, not authorized by an
// inherited environment string. Other file stores retain their existing guard.
const communityTestRoots = new Map<string, { dev: number; ino: number }>();
export function createCommunityTestDirectory(): string {
  if (!isTestProcess()) throw new Error('community test directories are available only in test processes');
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'community-isolated-test-'));
  fs.chmodSync(root, 0o700);
  const canonical = fs.realpathSync(root);
  const stat = fs.statSync(canonical);
  communityTestRoots.set(canonical, { dev: stat.dev, ino: stat.ino });
  return canonical;
}

// Undefined and empty values never authorize a test file. For community storage,
// reject inherited live paths, traversal and symlinks, even if explicitly set.
export function assertExplicitFileStorePath(explicitPath: string | undefined, sourceVar: string, env: NodeJS.ProcessEnv = process.env): void {
  if (!isTestProcess(env)) return;
  if (explicitPath === undefined || explicitPath.trim() === '') {
    throw new Error(`test isolation: ${sourceVar} is not set in a test process; use an explicit isolated per-test path`);
  }
  if (sourceVar !== 'COMMUNITY_STORE_PATH') return;
  const fail = () => {
    throw new Error('test isolation: COMMUNITY_STORE_PATH must be a file directly inside a process-issued community test directory');
  };
  if (!path.isAbsolute(explicitPath) || path.normalize(explicitPath) !== explicitPath) return fail();
  const parent = path.dirname(explicitPath);
  const registered = communityTestRoots.get(parent);
  if (!registered) return fail();
  try {
    const stat = fs.lstatSync(parent);
    if (!stat.isDirectory() || stat.isSymbolicLink() || stat.dev !== registered.dev || stat.ino !== registered.ino || fs.realpathSync(parent) !== parent)
      return fail();
    if (fs.existsSync(explicitPath)) {
      const file = fs.lstatSync(explicitPath);
      if (!file.isFile() || file.isSymbolicLink() || file.nlink !== 1) return fail();
    } else {
      // existsSync follows links; a dangling link still has an lstat entry.
      try {
        fs.lstatSync(explicitPath);
        return fail();
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      }
    }
  } catch {
    return fail();
  }
}
