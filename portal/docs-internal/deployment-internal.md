# Deploying the two portals

Approved design (2026-11-02). Nothing deployed yet - creating the hosted
services is a separate owner-approved step.

## Public portal

- Render static site on the existing account, auto-deploy from `main`.
- Build command: `cd portal && npm ci && npm run build:public`
- Publish directory: `portal/build-public`
- Hostname: `blockallisto-docs.onrender.com` (custom domain later, after
  the domain purchase).

## Private portal (this build)

- Serve `build-internal/` from the existing Oracle Cloud VM behind **nginx
  basic auth** - server-side enforcement, no client-side gates.
- Same pattern as the existing Weblate and Uptime Kuma services on that VM;
  TLS via Let's Encrypt.
- Deploy flow: pull the repo on the VM (or rsync the build output), run
  `npm ci && npm run build:internal`, point the authenticated nginx vhost
  at `portal/build-internal/`.
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
