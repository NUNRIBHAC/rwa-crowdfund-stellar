// IP reputation via ipapi.is (https://ipapi.is/developers.html).
//
// SHADOW MODE IS THE DEFAULT: verdicts are computed and counted, nothing is
// blocked. IPREP_ENFORCE=1 switches to denying. Policy is abuse-only by
// design: an IP is denied only on recent-abuse evidence (is_abuser or a very
// high abuser_score). VPN/proxy/Tor/datacenter flags are NEVER a deny reason
// on their own - those users get the ordinary Turnstile challenge like
// everyone else. This follows the provider's own conservative-deployment
// guidance and the operator constraint against blanket anonymity blocks.
//
// Privacy: queried addresses live only in transient memory and the short-TTL
// cache. Logs and stats carry AGGREGATE verdict counters, never raw IPs.
// ipapi.is states it does not log queried addresses and processes them as an
// Art. 28 GDPR processor under its standard terms (free tier included).
//
// Failure posture: provider errors and budget exhaustion fail OPEN (the
// request proceeds); the global outbound-mail budgets remain the backstop.
// An attacker can burn the daily lookup budget to degrade this layer - a
// documented availability-of-protection limitation of the free tier.

export type RepVerdict = 'abuse' | 'anonymous' | 'clean' | 'unknown';

export interface ReputationStats {
  lookups: number;
  cacheHits: number;
  cacheEntries: number;
  providerErrors: number;
  budgetTripped: boolean;
  verdicts: Record<RepVerdict, number>;
  denied: number;
}

interface CacheEntry {
  verdict: RepVerdict;
  expiresAt: number;
}

// Provider-recommended caching bounds (https://proxycheck.io/api/ and
// ipapi.is guidance): clean results 10-60 min, anonymous/abuse 1-15 min.
const CLEAN_TTL_MS = 30 * 60 * 1000;
const FLAGGED_TTL_MS = 5 * 60 * 1000;
const UNKNOWN_TTL_MS = 60 * 1000;
export const IP_REPUTATION_CACHE_LIMIT = 1000;

// Deny only on very strong abuse evidence. The provider's abuser_score is a
// probability with a band label; 0.9 is the initial ceiling band. This is an
// UNCALIBRATED starting threshold - shadow-mode observations on real traffic
// must tune it before enforcement is considered proven.
export const ABUSE_SCORE_DENY = 0.9;
const DEFAULT_DAILY_BUDGET = 800; // 80% of the 1,000/day free tier
const DAY_MS = 24 * 60 * 60 * 1000;
const LOOKUP_TIMEOUT_MS = 4000;

export interface IpReputation {
  check(ip: string): Promise<RepVerdict>; // throws CommunityError(403) when enforcing an abuse verdict
  stats(): ReputationStats;
}

interface IpApiIsResponse {
  is_abuser?: boolean;
  abuser_score?: string;
  is_vpn?: boolean;
  is_proxy?: boolean;
  is_tor?: boolean;
  is_datacenter?: boolean;
}

function classify(data: IpApiIsResponse): RepVerdict {
  const scoreMatch = typeof data.abuser_score === 'string' ? data.abuser_score.match(/^([0-9.]+)/) : null;
  const score = scoreMatch ? Number(scoreMatch[1]) : 0;
  if (data.is_abuser === true || (Number.isFinite(score) && score >= ABUSE_SCORE_DENY)) return 'abuse';
  if (data.is_vpn || data.is_proxy || data.is_tor || data.is_datacenter) return 'anonymous';
  return 'clean';
}

export function createIpReputation(options: {
  apiKey?: string;
  enforce: boolean;
  dailyBudget?: number;
  fetchImpl?: typeof fetch;
  now?: () => number;
  denyError?: (message: string, code: string) => Error;
}): IpReputation {
  const fetchImpl = options.fetchImpl ?? fetch;
  const now = options.now ?? Date.now;
  const budget = options.dailyBudget ?? DEFAULT_DAILY_BUDGET;
  const cache = new Map<string, CacheEntry>();
  const stats: ReputationStats = {
    lookups: 0,
    cacheHits: 0,
    cacheEntries: 0,
    providerErrors: 0,
    budgetTripped: false,
    verdicts: { abuse: 0, anonymous: 0, clean: 0, unknown: 0 },
    denied: 0,
  };
  let dayStart = now();

  const rollDay = () => {
    if (now() - dayStart >= DAY_MS) {
      dayStart = now();
      stats.lookups = 0;
      stats.budgetTripped = false;
    }
  };

  const pruneExpired = () => {
    const time = now();
    for (const [ip, entry] of cache) if (entry.expiresAt <= time) cache.delete(ip);
  };

  return {
    async check(ip: string): Promise<RepVerdict> {
      rollDay();
      pruneExpired();
      const cached = cache.get(ip);
      if (cached && cached.expiresAt > now()) {
        // Refresh recency without extending the provider verdict TTL.
        cache.delete(ip);
        cache.set(ip, cached);
        stats.cacheHits += 1;
        return cached.verdict;
      }
      let verdict: RepVerdict = 'unknown';
      let ttl = UNKNOWN_TTL_MS;
      let cacheResult = false;
      if (!options.apiKey || stats.lookups >= budget) {
        if (options.apiKey) stats.budgetTripped = true; // fail open, counted
      } else {
        cacheResult = true;
        stats.lookups += 1;
        try {
          const res = await fetchImpl(`https://api.ipapi.is/?q=${encodeURIComponent(ip)}&key=${encodeURIComponent(options.apiKey)}`, {
            signal: AbortSignal.timeout(LOOKUP_TIMEOUT_MS),
          });
          const data = (await res.json()) as IpApiIsResponse;
          verdict = classify(data);
          ttl = verdict === 'clean' ? CLEAN_TTL_MS : verdict === 'unknown' ? UNKNOWN_TTL_MS : FLAGGED_TTL_MS;
        } catch {
          stats.providerErrors += 1; // fail open
        }
      }
      if (cacheResult) {
        // Do not retain raw addresses for disabled or exhausted providers.
        // Bound all provider results, including transient failures.
        cache.delete(ip);
        while (cache.size >= IP_REPUTATION_CACHE_LIMIT) cache.delete(cache.keys().next().value!);
        cache.set(ip, { verdict, expiresAt: now() + ttl });
      }
      stats.verdicts[verdict] += 1;
      if (verdict === 'abuse' && options.enforce) {
        stats.denied += 1;
        throw options.denyError?.('registration is temporarily unavailable from this network', 'ip_reputation_abuse') ?? new Error('ip_reputation_abuse');
      }
      return verdict;
    },
    stats: () => {
      pruneExpired();
      return { ...stats, cacheEntries: cache.size, verdicts: { ...stats.verdicts } };
    },
  };
}

export function ipReputationFromEnv(env: NodeJS.ProcessEnv = process.env, denyError?: (message: string, code: string) => Error): IpReputation {
  return createIpReputation({
    apiKey: env.IPREP_API_KEY?.trim() || undefined,
    // Allocate this shared provider allowance across deployments. The counter
    // remains in-memory: this is a best-effort cap, not durable quota accounting.
    dailyBudget: (() => {
      const raw = Number(env.IPREP_DAILY_BUDGET);
      return Number.isInteger(raw) && raw >= 1 && raw <= DEFAULT_DAILY_BUDGET ? raw : DEFAULT_DAILY_BUDGET;
    })(),
    enforce: env.IPREP_ENFORCE === '1',
    denyError,
  });
}
