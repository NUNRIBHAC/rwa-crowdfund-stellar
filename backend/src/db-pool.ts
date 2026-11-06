// Database pool sizing from the environment.
//
// Hosted Postgres providers cap direct connections per database (Neon free:
// ~100; Prisma Postgres free: 10 direct of which 5 are reserved for platform
// operations). The app opens several pools against the same database
// (journal, community store, event archive), so each pool must be sized to
// fit the provider budget together with admin/migration connections. These
// overrides exist for that; the defaults preserve the previous fixed sizes,
// so an unset variable changes nothing.
//
// Invalid values fail closed at startup: a silently ignored override would
// hide a misconfigured deploy behind the default size.

export function poolMaxFromEnv(rawValue: string | undefined, sourceVar: string, fallback: number): number {
  if (rawValue === undefined || rawValue.trim() === '') return fallback;
  const trimmed = rawValue.trim();
  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isSafeInteger(parsed) || parsed < 1 || String(parsed) !== trimmed) {
    throw new Error(`${sourceVar} must be a positive integer (got ${JSON.stringify(rawValue)}); refusing to size the connection pool with an invalid value`);
  }
  return parsed;
}
