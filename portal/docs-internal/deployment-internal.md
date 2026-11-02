# Deploying the two portals

Both portals are live as of 2026-11-02. Details below describe the
verified running services.

## Public portal

- Live at [blockallisto-docs.onrender.com](https://blockallisto-docs.onrender.com) (custom
  domain later,
  after the domain purchase). Verified 2026-11-02: all routes 200, search
  functional, leak grep clean (see below).
- Render static site on the existing account, auto-deploy from `main`.
- Build command: `cd portal && npm ci && npm run build:public`
- Publish directory: `portal/build-public`

## Private portal (this build)

- Live at [docs.92-5-187-71.sslip.io](https://docs.92-5-187-71.sslip.io) behind
  **server-side basic
  auth** - no client-side gates. Deployed and verified 2026-11-02; the
  sslip.io wildcard resolves the hostname to the VM, no DNS change needed.
- Actual implementation: the internal build is rsynced to
  `/home/opc/private-docs/html` on the Oracle VM and served by an
  `nginx:alpine` container (`private-docs`) on the `weblate_default` Docker
  network. The htpasswd file lives outside the webroot. TLS is terminated by
  the existing `https-portal` container (Let's Encrypt cert issued
  2026-11-02); the host nginx stays inactive.
- Deploy flow: run `npm ci && npm run build:internal` off-VM, rsync
  `portal/build-internal/` to `/home/opc/private-docs/html`. No container
  restart needed for content updates.
- Existing VM services were re-checked after the ~10s https-portal
  recreation during setup and kept their expected responses.
- The basic-auth credentials live in the vault, never in the repo or docs.

## Rejected options

- Render static sites: no built-in access control (feature request still
  "planned" on feedback.render.com); client-side password gates
  (PageCrypt-style) are bypassable with view-source.
- oauth2-proxy in front of a Render web service: workable but adds a
  sleeping free-tier hop and another moving part.
- Cloudflare Pages + Access: real server-side enforcement (Zero Trust free
  plan, up to 50 users, email OTP) but adds a new vendor and account.

## Leak checks (run before every publish)

The public build must not contain internal markers. Verified 2026-11-02:
`OPERATOR_WALLETS`, `x-admin-key`, `BACKFILL_VERSION`, the staging hostname,
internal page slugs and vendor names are absent from `build-public/`
(including the search index). Repeat the grep in CI or before deploy.

Access gate test (mandatory before the private portal is considered live):
every private route and asset must return 401/403 without credentials -
test `/`, `/internal/`, direct page URLs, search index files and static
assets. Status: PASSED 2026-11-02 - without credentials, `/`, `/internal/`,
`/docs/intro/`, `/search-index.json`, `/img/logo.png` and
`/assets/js/main.js` all returned 401; with credentials, `/`, `/internal/`
and `/search-index.json` returned 200. Re-run after every hosting change.
