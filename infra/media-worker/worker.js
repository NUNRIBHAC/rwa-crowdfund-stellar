const BUCKET = "blockallisto-media";
const PREFIX = "public/";
const EXT = /\.(svg|png|jpe?g|webp|gif|ico|css|js|woff2?|html|json|txt)$/i;
const SAFE = /^[A-Za-z0-9._\/-]+$/;
// Scoped CORS: ONLY these app origins may read cross-origin (needed by
// @font-face woff2; images do not require it). Never reflect arbitrary
// Origin values. Cache API ignores Vary, so the allowlisted Origin is
// folded into the cache key itself - a cached ACAO can never leak to a
// different origin.
const ALLOWED_ORIGINS = new Set([
  "https://staging.92-5-187-71.sslip.io",
  "https://demo.92-5-187-71.sslip.io",
]);
let A = null;
async function auth(env, force) {
  if (A && !force && Date.now() < A.e) return A;
  const r = await fetch("https://api.backblazeb2.com/b2api/v3/b2_authorize_account", {
    headers: { Authorization: "Basic " + btoa(env.B2_KEY_ID + ":" + env.B2_KEY) },
  });
  if (!r.ok) throw new Error("b2 auth failed");
  const j = await r.json();
  const info = (j.apiInfo && j.apiInfo.storageApi) ? j.apiInfo.storageApi : j;
  A = { t: j.authorizationToken, d: info.downloadUrl, e: Date.now() + 7200000 };
  return A;
}
async function b2get(env, key, method, force) {
  const a = await auth(env, force);
  const url = a.d + "/file/" + BUCKET + "/" + key.split("/").map(encodeURIComponent).join("/");
  return fetch(url, { method, headers: { Authorization: a.t } });
}
export default {
  async fetch(request, env) {
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response(null, { status: 405 });
    }
    let p;
    try {
      p = decodeURIComponent(new URL(request.url).pathname);
    } catch {
      return new Response(null, { status: 400 });
    }
    p = p.replace(/^\/+/, "");
    if (!p || !SAFE.test(p) || p.includes("..") || p.includes("//") || !EXT.test(p)) {
      return new Response(null, { status: 404 });
    }
    // B2 storage folder rename (owner decision 2026-11-07): the bucket folder
    // is now "social icons". The public URL path stays /social/ so no site
    // reference changes; only the B2 key is remapped. b2get() percent-encodes
    // each segment, so the space is safe on the wire. Old social/* keys are
    // retained until explicit owner approval - no deletion on this change.
    const key = p.startsWith("social/")
      ? "social icons/" + p.slice("social/".length)
      : /^(favicon\.ico|favicon\.svg|favicon-(48|32|16)\.png)$/.test(p)
        ? "icons/" + p
        : p;
    // Edge cache (Cache API): serve repeat requests without a B2 fetch.
    // Safe invalidation comes from VERSIONED asset keys (writer uploads
    // content-hashed/versioned paths, e.g. icons/logo.<hash>.svg), so a
    // stale edge copy can never outlive its asset version. Bounded 24h TTL
    // as a second fence. X-Worker-Cache header proves hit/miss in tests.
    const cache = caches.default;
    const reqOrigin = request.headers.get("Origin") || "";
    const corsOrigin = ALLOWED_ORIGINS.has(reqOrigin) ? reqOrigin : "";
    const cacheKey = new Request(
      new URL(request.url).origin + "/" + p + (corsOrigin ? "?__origin=" + encodeURIComponent(corsOrigin) : ""),
      { method: "GET" }
    );
    if (request.method === "GET") {
      const hit = await cache.match(cacheKey);
      if (hit) {
        const hh = new Headers(hit.headers);
        hh.set("X-Worker-Cache", "hit");
        return new Response(hit.body, { status: 200, headers: hh });
      }
    }
    try {
      let r = await b2get(env, PREFIX + key, request.method, false);
      if (r.status === 401) r = await b2get(env, PREFIX + key, request.method, true);
      if (!r.ok) return new Response(null, { status: 404 });
      const h = new Headers();
      h.set("Content-Type", r.headers.get("Content-Type") || "application/octet-stream");
      const cl = r.headers.get("Content-Length");
      if (cl) h.set("Content-Length", cl);
      h.set("Cache-Control", "public, max-age=86400");
      h.set("X-Content-Type-Options", "nosniff");
      h.set("X-Worker-Cache", "miss");
      if (corsOrigin) {
        h.set("Access-Control-Allow-Origin", corsOrigin);
        h.set("Vary", "Origin");
      }
      const body = request.method === "HEAD" ? null : r.body;
      const resp = new Response(body, { status: 200, headers: h });
      if (request.method === "GET") {
        // Store a clone; Cache API honors the response Cache-Control TTL.
        await cache.put(cacheKey, resp.clone());
      }
      return resp;
    } catch {
      return new Response(null, { status: 502 });
    }
  },
};
