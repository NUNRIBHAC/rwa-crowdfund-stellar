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
