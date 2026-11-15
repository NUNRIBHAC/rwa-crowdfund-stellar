import { createHash } from 'node:crypto';

type State = {
  attempts: number;
  failures: number;
  lastSuccess: number;
  retryAt: number;
  streak: number;
  lastProbe: number;
  probes: Map<object, () => Promise<unknown>>;
  inFlight?: Promise<void>;
};
const states = new Map<string, State>();
const PROBE_MS = 5 * 60_000;
const FRESH_MS = 6 * 60_000;
export class DatabaseUnavailable extends Error {
  readonly code = 'API_UNAVAILABLE';
  constructor() {
    super('Database temporarily unavailable');
  }
}
const operational = (error: any) =>
  /^(08|28|53|57P|58|XX|ECONN|ETIMEDOUT|ENET|EPIPE)/.test(String(error?.code ?? '')) ||
  /planLimitReached|account has restrictions|connection terminated|Connection terminated|timeout expired/i.test(String(error?.message ?? ''));
const quota = (error: any) => /planLimitReached/.test(String(error?.message ?? ''));

// Metrics contain no URL, credentials, SQL text, parameters or error messages.
// Pooled/direct endpoints for the same credential/database share a circuit.
export function databaseKey(url: string): string {
  const u = new URL(url);
  u.hostname = u.hostname.replace(/^pooled\./, '');
  u.search = '';
  return createHash('sha256').update(u.toString()).digest('hex');
}
export function trackDatabasePool<T extends object>(pool: T, url: string, clock = Date.now): T {
  const key = databaseKey(url);
  let state = states.get(key);
  if (!state) {
    state = { attempts: 0, failures: 0, lastSuccess: 0, retryAt: 0, streak: 0, lastProbe: 0, probes: new Map() };
    states.set(key, state);
  }
  const s = state;
  const fail = (error: unknown, force = false) => {
    if (!force && !operational(error)) return;
    s.failures++;
    s.streak++;
    s.lastSuccess = 0;
    s.retryAt = clock() + (quota(error) ? 60 * 60_000 : Math.min(30 * 60_000, 60_000 * 2 ** Math.min(s.streak - 1, 5)));
  };
  // pg emits errors for idle clients outside any request promise. Handling the
  // event keeps the process alive; readiness still becomes unavailable.
  (pool as any).on?.('error', (error: unknown) => fail(error, true));
  const query = async (target: any, args: unknown[], cleanup = false) => {
    if (!cleanup && clock() < s.retryAt) throw new DatabaseUnavailable();
    s.attempts++;
    try {
      const result = await target.query(...args);
      if (!cleanup) {
        s.lastSuccess = clock();
        s.retryAt = 0;
        s.streak = 0;
      }
      return result;
    } catch (error) {
      fail(error);
      throw error;
    }
  };
  s.probes.set(pool, () => query(pool, ['SELECT 1']));
  return new Proxy(pool, {
    get(target: any, property) {
      if (property === 'end')
        return async () => {
          s.probes.delete(pool);
          return target.end();
        };
      if (property === 'query') return (...args: unknown[]) => query(target, args);
      if (property === 'connect')
        return async () => {
          if (clock() < s.retryAt) throw new DatabaseUnavailable();
          let client: any;
          try {
            client = await target.connect();
          } catch (error) {
            fail(error);
            throw error;
          }
          let discard = false;
          return new Proxy(client, {
            get(c, p) {
              if (p === 'release') return (error?: Error | boolean) => c.release(error || discard);
              if (p === 'query')
                return async (...args: unknown[]) => {
                  const cleanup =
                    /^\s*(ROLLBACK|COMMIT)\s*;?\s*$/i.test(String(args[0])) || /^SELECT pg_advisory_unlock\(hashtext\(\$1\)\)$/i.test(String(args[0]));
                  try {
                    return await query(c, args, cleanup);
                  } catch (error) {
                    if (operational(error) || error instanceof DatabaseUnavailable || cleanup) discard = true;
                    throw error;
                  }
                };
              const value = c[p];
              return typeof value === 'function' ? value.bind(c) : value;
            },
          });
        };
      const value = target[property];
      return typeof value === 'function' ? value.bind(target) : value;
    },
  });
}
export function databaseReadiness(env: NodeJS.ProcessEnv = process.env, now = Date.now()) {
  const urls = [env.COMMUNITY_DATABASE_URL, env.SOROBAN_JOURNAL_DATABASE_URL, env.EVENT_ARCHIVE_DATABASE_URL, env.DEPLOYMENT_MANIFEST_DATABASE_URL].filter(
    (u): u is string => !!u,
  );
  let invalid = 0;
  const expected = new Set<string>();
  for (const url of urls) {
    try {
      expected.add(databaseKey(url));
    } catch {
      invalid++;
    }
  }
  if (env.SOROBAN_JOURNAL_BACKEND === 'postgres' && !env.SOROBAN_JOURNAL_DATABASE_URL) invalid++;
  if (env.COMMUNITY_REQUIRE_POSTGRES === '1' && !env.COMMUNITY_DATABASE_URL && !env.SOROBAN_JOURNAL_DATABASE_URL) invalid++;
  if ((env.EVENT_ARCHIVE_BACKEND === 'postgres' || env.DEPLOYMENT_MANIFEST_BACKEND === 'postgres') && urls.length === 0) invalid++;

  const ready =
    invalid === 0 &&
    [...expected].every((key) => {
      const s = states.get(key);
      return !!s && s.retryAt <= now && s.lastSuccess > 0 && now - s.lastSuccess <= FRESH_MS;
    });
  return {
    ready,
    configured: expected.size,
    unavailable:
      invalid +
      [...expected].filter((key) => {
        const s = states.get(key);
        return !s || s.retryAt > now || !s.lastSuccess || now - s.lastSuccess > FRESH_MS;
      }).length,
  };
}
// At most one probe per identity/five minutes, and no probes during backoff.
// /health itself never runs SQL. Ordinary successful work refreshes readiness.
export async function refreshDatabaseReadiness(now = Date.now()): Promise<void> {
  await Promise.all(
    [...states.values()].map(async (s) => {
      const probe = s.probes.values().next().value;
      if (!probe || s.retryAt > now || (s.lastSuccess > 0 && now - s.lastSuccess < PROBE_MS) || (s.lastProbe > 0 && now - s.lastProbe < PROBE_MS)) return;
      if (!s.inFlight) {
        s.lastProbe = now;
        s.inFlight = probe()
          .then(
            () => {},
            () => {},
          )
          .finally(() => {
            s.inFlight = undefined;
          });
      }
      await s.inFlight;
    }),
  );
}
export function databaseMetrics() {
  return [...states.values()].map(({ attempts, failures, lastSuccess, retryAt }) => ({ attempts, failures, lastSuccess, retryAt }));
}
export function resetDatabaseRuntimeForTests() {
  states.clear();
}
