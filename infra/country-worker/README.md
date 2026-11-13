# Country-only locale fallback

Approved map v4, 13 November 2026. The app's 249-country table is a product
fallback, not a claim about a person's language or nationality. North Korea
uses English; South Korea uses Korean. The complete approved CSV is the source
for `frontend/src/i18n/country-locales.json`.

Precedence: valid saved manual choice, first supported ordered browser language,
country, English. Chinese script aliases take priority over region. The app
requests country only when manual/browser choices cannot decide. The request
has no credentials, referrer or cache, is bounded to 800 ms before React mounts,
and never changes language after the first render. Automatic choices, country,
IP and browser preferences are not stored by the app.

Set `VITE_COUNTRY_ORIGIN` at build time and the matching `COUNTRY_ORIGIN` at
runtime to the exact verified HTTPS Worker origin. Empty configuration makes
local/dev builds use manual/browser/English without a network request. CSP adds
only that exact origin to connect-src, never script-src or img-src. No existing
environment or demo is changed by adding these source files.

The Worker returns only `{country}` from `request.cf.country`. It ignores
client country/IP headers, has no upstream calls, bindings, storage, cookies,
application logging or shared response cache. Cloudflare still sees the normal
network request and may retain its own operational/security records. This is
not a promise that the network provider keeps no logs. Only GET/HEAD and scoped
CORS preflight are accepted at `/country`.

Workers Free remains the required plan: 100,000 requests/day shared with other
Workers. On quota failure the app uses English when no manual/browser choice
exists. No paid upgrade, custom domain, KV, analytics or log destination is
needed. Publishing the Worker is separate from merging/deploying the app.

Checks:

```sh
node --test infra/country-worker/worker.test.mjs
npm --prefix frontend exec -- vitest run src/i18n/locale-negotiation.test.ts src/i18n/locale-bootstrap.test.ts
```

## Publication evidence

Published 13 November 2026 at 20:21:06 UTC as `blockallisto-country` on the
existing Free account. Public origin:
<https://blockallisto-country.nunrib-df6.workers.dev/>. Endpoint: `/country`.
Deployment ID `dc044f144eaa443ba68ef375918fb354`.
Module SHA-256 `23833317d6bf140446b18092de00a493f8b75c5a3f957ff79b70e9f0ece4880f`.
Downloaded deployed module was byte-identical to `worker.mjs`. Creation response
and dashboard showed logs/traces disabled, no bindings, no logpush. Preview URLs
are disabled. No custom domain or route was added.

The first public request at 20:22:16 UTC returned HTTP 429, Cloudflare error
1027, because the account's existing free daily quota was exhausted. This is
not a verified live country response. The next check is after the daily UTC
reset. No repeated requests or paid upgrade were made.

Docker builds default to this exact origin; local/dev builds remain
unconfigured unless explicitly supplied. These source changes do not activate
or replace the existing staging or demo containers.
