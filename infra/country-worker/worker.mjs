const { Headers, URL, Response } = globalThis;
// Country only, derived from Cloudflare request metadata. No IP/header echo,
// upstream service, persistence, cookies or application logging.
const ORIGINS = new Set(['https://staging.92-5-187-71.sslip.io', 'https://demo.92-5-187-71.sslip.io']);
export default {
  async fetch(request) {
    const headers = new Headers({ 'Cache-Control': 'no-store', 'Content-Type': 'application/json', 'X-Content-Type-Options': 'nosniff', Vary: 'Origin' });
    const origin = request.headers.get('Origin');
    if (origin && ORIGINS.has(origin)) headers.set('Access-Control-Allow-Origin', origin);
    if (new URL(request.url).pathname !== '/country') return new Response(null, { status: 404, headers });
    if (request.method === 'OPTIONS') {
      if (!origin || !ORIGINS.has(origin)) return new Response(null, { status: 403, headers });
      headers.set('Access-Control-Allow-Methods', 'GET, HEAD');
      return new Response(null, { status: 204, headers });
    }
    if (!['GET', 'HEAD'].includes(request.method)) return new Response(null, { status: 405, headers });
    const country = typeof request.cf?.country === 'string' && /^[A-Z]{2}$/.test(request.cf.country) ? request.cf.country : null;
    return new Response(request.method === 'HEAD' ? null : JSON.stringify({ country }), { headers });
  },
};
