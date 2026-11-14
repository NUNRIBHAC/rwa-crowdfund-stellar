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

## Hosting

- **Public portal**: Oracle VM, served at
  `https://pubdocs.92-5-187-71.sslip.io` by the `public-docs` nginx container.
  Build with `cd portal && npm ci && npm run build:public`; publish the
  `portal/build-public/` output. The old Render address
  `blockallisto-docs.onrender.com` is suspended, not the active host.
- **Private portal**: Oracle VM, served at
  `https://docs.92-5-187-71.sslip.io` by the `private-docs` nginx container,
  behind server-side basic auth. Build with
  `cd portal && npm ci && npm run build:internal`; publish the
  `portal/build-internal/` output. Keep credentials outside build output.
- A merge does not itself publish either portal. CI builds both audiences
  and checks separation; publication and private-route access checks are
  separate release steps. No hosting or deployment settings are changed by
  this README correction.

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

## Dependency security checks

The portal has its own lockfile, outside the application workspaces. CI installs it with dependency install scripts disabled, audits it with `npm audit --prefix portal --audit-level=high`, and builds both audiences. A temporary private canary must be absent from every public HTML/JS/JSON/XML/text/source-map artifact and present in the internal page. Neither a successful root audit nor `--omit=dev` substitutes for the portal audit.

Docusaurus 3.10.2 is retained as an aligned package set. Until upstream updates its ranges, exact portal-only overrides select `tinypool` 2.2.0 and `serialize-javascript` 7.1.4. These cross upstream major ranges, so clean install, serializer/worker compatibility tests and both audience builds are required; do not use `npm audit fix --force`. The overrides do not affect the app lockfile. Remove them only when upstream resolves patched versions without them and the same checks pass.

This change removes the reviewed high/critical advisories, not every advisory. Low/moderate transitive findings remain (including `deepmerge` and `uuid`); audit severity can propagate to parent packages. No audit suppression or threshold reduction is used. A dependency advisory alone does not prove a reachable exploit in the static website.
