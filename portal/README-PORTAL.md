# Blockallisto documentation portals (Docusaurus, dual audience)

Two portals from one source tree, approved by the owner 2026-11-02:

- **Public portal** - curated platform docs for users and partners.
- **Private portal** - everything on the public portal plus internal
  technical/operational docs (`docs-internal/`).

## Audience separation (how private content stays out of the public build)

- `DOCS_AUDIENCE=public` (default): only `docs/` is registered. The
  `docs-internal/` instance does not exist in this build - internal content
  cannot appear in HTML, the search index, sitemap or assets.
- `DOCS_AUDIENCE=internal`: adds the `internal` docs plugin instance
  (`docs-internal/` at `/internal/`), an "Internal" navbar item and a fixed
  warning bar. Search covers both sets.
- Keep internal images/assets out of `static/` (that directory ships in both
  builds). Add a separate static dir to the internal branch of the config if
  internal assets are ever needed.
- Rule: no secrets in either build. Keys live in the vault/provider env vars.

## Builds

```bash
npm ci
npm run build:public    # outputs build-public/
npm run build:internal  # outputs build-internal/
```

## Hosting (free, researched 2026-11-02)

- **Public portal**: Render static site on the existing account.
  Build command: `cd portal && npm ci && npm run build:public`
  Publish directory: `portal/build-public`
  Auto-deploys from `main`; free TLS; hostname
  `blockallisto-docs.onrender.com` (custom domain later).
- **Private portal**: serve `build-internal/` from the existing Oracle Cloud
  VM behind nginx basic auth (server-side enforcement, free, TLS via Let's
  Encrypt - same pattern as the existing Weblate/Kuma services).
  Deploy: pull the repo on the VM, build, and point the nginx vhost at
  `portal/build-internal/` (or rsync the build output).
  - Rejected: Render static sites have no built-in access control (feature
    request still "planned", feedback.render.com) and PageCrypt-style
    client-side password gates are bypassable with view-source.
  - Alternative: Cloudflare Pages + Cloudflare Access (Zero Trust free plan,
    up to 50 users, email OTP) - real server-side enforcement, but adds a
    new vendor/account.
  - Fallback: oauth2-proxy in front of a Render web service (adds a sleeping
    free-tier hop).

## Versioning

When a named release is cut: `npm run docusaurus docs:version 1.0`.
Keep off until the first real release.

## i18n

English-only for now (repo rule). Docusaurus i18n is native; add locales via
the existing Weblate workflow when wanted.

## Search

Free local search (`@easyops-cn/docusaurus-search-local`) in both builds.
Public upgrade path: Algolia DocSearch once the public portal is stable
(free program; requires public production docs + Algolia logo).
