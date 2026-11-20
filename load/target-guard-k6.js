// Target guard for the k6 scenarios - pure ES module, no node APIs, so k6
// can import it directly AND node --test can unit-test the exact shipped
// code. Default target is loopback only; a remote target needs BOTH
// K6_ALLOW_REMOTE=1 and its host in K6_TARGET_ALLOWLIST.
//
// Parsing is strict about the authority: a URL like
// http://localhost:4000@evil.example has loopback in the USERINFO, not the
// host - a naive regex reads "localhost" and passes. Credentials in a target
// URL are never legitimate here, so any '@' in the authority refuses the run.
const LOOPBACK = ['127.0.0.1', 'localhost', '::1', '[::1]'];

// Returns { host, port } lowercased, or throws with a reason.
export function parseTargetAuthority(base) {
  const m = /^(https?):\/\/([^/?#]*)/i.exec(String(base));
  if (!m) throw new Error(`target guard: unparseable target ${JSON.stringify(base)} (need http(s)://host[:port])`);
  const authority = m[2];
  if (authority.includes('@')) throw new Error('target guard: credentials in the target URL are not allowed; refusing to run');
  let host;
  let port;
  if (authority.startsWith('[')) {
    const end = authority.indexOf(']');
    if (end === -1) throw new Error(`target guard: unparseable IPv6 authority in ${JSON.stringify(base)}`);
    host = authority.slice(0, end + 1);
    const rest = authority.slice(end + 1);
    if (rest && !/^:\d+$/.test(rest)) throw new Error(`target guard: unparseable authority ${JSON.stringify(authority)}`);
    port = rest;
  } else {
    const pm = /^([^:]+)(:\d+)?$/.exec(authority);
    if (!pm) throw new Error(`target guard: unparseable authority ${JSON.stringify(authority)}`);
    host = pm[1];
    port = pm[2] || '';
  }
  return { host: host.toLowerCase(), port };
}

// Every allowlist entry must be host or host:port - validated in full BEFORE
// the decision, so a malformed entry fails closed instead of being skipped.
export function parseAllowlist(raw) {
  return String(raw || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .map((entry) => {
      if (!/^(\[[0-9a-f:]+\]|[a-z0-9.-]+)(:\d+)?$/.test(entry)) throw new Error(`target guard: malformed allowlist entry ${JSON.stringify(entry)}`);
      return entry;
    });
}

export function assertK6Target(base, env) {
  const { host, port } = parseTargetAuthority(base);
  if (LOOPBACK.includes(host)) return;
  const allowed = parseAllowlist(env.K6_TARGET_ALLOWLIST);
  if (env.K6_ALLOW_REMOTE !== '1' || (!allowed.includes(host) && !allowed.includes(host + port))) {
    throw new Error(`target guard: refusing non-loopback target ${base}; set K6_ALLOW_REMOTE=1 and add the host to K6_TARGET_ALLOWLIST to confirm it`);
  }
}
