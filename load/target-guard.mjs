// Shared target guard for the e2e/load scripts (review point: scripts that
// POST or submit must never run against whatever URL happens to be in the
// environment). Default target is loopback. Any other host needs BOTH the
// explicit opt-in flag AND an allowlisted host.
const LOOPBACK = new Set(['127.0.0.1', 'localhost', '::1', '[::1]']);

export function assertAllowedTarget(baseUrl, { optIn, allowlist = '' } = {}) {
  let url;
  try {
    url = new URL(baseUrl);
  } catch {
    throw new Error(`target guard: unparseable BASE_URL ${JSON.stringify(baseUrl)}`);
  }
  // Credentials in a target URL are never legitimate here; userinfo must
  // never be mistaken for the destination host.
  if (url.username || url.password) throw new Error('target guard: credentials in the target URL are not allowed; refusing to run.');
  if (LOOPBACK.has(url.hostname)) return url;
  if (optIn !== '1') {
    throw new Error(
      `target guard: refusing non-loopback target ${url.origin}. ` +
        'Set the opt-in variable to 1 AND list the host in the allowlist variable to confirm this exact target.',
    );
  }
  const allowed = new Set(
    allowlist
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  );
  if (!allowed.has(url.host) && !allowed.has(url.hostname)) {
    throw new Error(`target guard: ${url.host} is not in the allowlist (${[...allowed].join(', ') || 'empty'}); refusing to run.`);
  }
  return url;
}
