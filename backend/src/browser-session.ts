import type express from 'express';
import { createHmac, timingSafeEqual } from 'node:crypto';

export const COOKIE_SESSION = 'cookie-session';
const SESSION = '__Host-blockallisto-session';
const CSRF = '__Host-blockallisto-csrf';
const MAX_AGE = 30 * 24 * 60 * 60 * 1000;
const csrfFor = (token: string) => createHmac('sha256', token).update('blockallisto-community-csrf-v1').digest('hex');
function cookies(req: express.Request): Map<string, string> {
  const result = new Map<string, string>();
  for (const item of (req.headers.cookie ?? '').split(';')) {
    const split = item.indexOf('=');
    if (split < 1) continue;
    const name = item.slice(0, split).trim();
    const value = item.slice(split + 1).trim();
    // Duplicate security cookies fail closed, never first/last-wins.
    if (result.has(name)) result.set(name, '');
    else result.set(name, value);
  }
  return result;
}
const same = (a: string, b: string) => Buffer.byteLength(a) === Buffer.byteLength(b) && timingSafeEqual(Buffer.from(a), Buffer.from(b));
export function setBrowserSession(res: express.Response, token: string, expiresAt: number): void {
  if (!/^bls_[A-Za-z0-9_-]+$/.test(token)) throw new Error('Invalid session token');
  const maxAge = Math.max(0, Math.min(MAX_AGE, expiresAt - Date.now()));
  const options = { secure: true, sameSite: 'lax' as const, path: '/', maxAge };
  res.cookie(SESSION, token, { ...options, httpOnly: true });
  res.cookie(CSRF, csrfFor(token), { ...options, httpOnly: false });
  res.set('Cache-Control', 'no-store');
}
export function clearBrowserSession(res: express.Response): void {
  for (const name of [SESSION, CSRF]) res.clearCookie(name, { secure: true, sameSite: 'lax', path: '/', httpOnly: name === SESSION });
}

// Existing non-browser bearer clients retain their explicit-token contract.
// Browser mode never returns a session bearer to JavaScript or a URL fragment.
export function browserSessionTransport(): express.RequestHandler {
  return (req, res, next) => {
    const browser = req.get('x-community-session') === 'cookie';
    const saved = cookies(req);
    const token = saved.get(SESSION) ?? '';
    const authorization = req.get('authorization');
    const cookieAuth = token && (!authorization || authorization === 'Bearer ' + COOKIE_SESSION);
    if (cookieAuth) {
      if (!/^bls_[A-Za-z0-9_-]+$/.test(token)) return res.status(401).json({ code: 'invalid_session', error: 'invalid session' });
      if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        const origin = req.get('origin');
        const expected = 'https://' + req.get('host');
        const site = req.get('sec-fetch-site');
        const csrf = req.get('x-community-csrf') ?? '';
        if ((origin && origin !== expected) || (site && site !== 'same-origin') || !same(csrf, csrfFor(token)))
          return res.status(403).json({ code: 'forbidden', error: 'forbidden' });
      }
      req.headers.authorization = 'Bearer ' + token;
    } else if (browser && !['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      // Prevent login CSRF too; no session cookie is needed for this check.
      const origin = req.get('origin');
      const site = req.get('sec-fetch-site');
      if ((origin && origin !== 'https://' + req.get('host')) || (site && site !== 'same-origin'))
        return res.status(403).json({ code: 'forbidden', error: 'forbidden' });
    }
    const json = res.json.bind(res);
    res.json = ((body: unknown) => {
      if (browser && res.statusCode < 400 && body && typeof body === 'object' && !Array.isArray(body)) {
        const value = body as Record<string, unknown>;
        if (typeof value.token === 'string' && typeof value.expiresAt === 'number' && value.account) {
          setBrowserSession(res, value.token, value.expiresAt);
          body = { ...value, token: COOKIE_SESSION };
        }
        if (req.path === '/api/auth/logout' && value.ok) clearBrowserSession(res);
      }
      return json(body);
    }) as express.Response['json'];
    next();
  };
}
