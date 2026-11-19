# ADR 0004: Free-tier hosting: Render + Neon + one Oracle VM

- Status: Historical prototype decision, app hosting superseded
- App hosting update verified: 2026-11-19
- Date: 2026-11-02 (decision predates this record; recorded from current state)

## Context

The prototype must be publicly reachable with zero budget. The owner prefers
free tiers, with any paid upgrade brought to him first.

## Historical decision (recorded 2 November 2026)

- App hosting: Render free web services - a public demo environment and a
  separate staging environment, each auto-deploying from its own branch, each
  with its own database. Superseded: both environments now run as containers on
  one Oracle Cloud VM, and neither deploys automatically. The app databases
  are now separate local PostgreSQL databases. See
  [environments.md](../environments.md) for the verified app state.
- Databases: Neon Postgres (demo and staging journals).
- Self-hosted tooling on one Oracle Cloud Always Free VM (ARM, Frankfurt):
  Weblate (translations), Uptime Kuma (uptime checks), Bitwarden, the private
  docs portal, and the nightly encrypted backup job for both Neon databases.
- Documentation portal: public build on a Render free static site; private
  build served from the Oracle VM behind basic auth.

## Historical consequences

- Zero running cost; capacity limits are real and measured before adding
  services (the GlitchTip sizing check is the standing example).
- Single VM = single point of failure for tooling and backups; whole-VM death
  cannot be reported by anything on the VM itself (see monitoring docs: ONS
  email path, dead-man's switch, candidate OCI absence alarm).
- Render free services sleep when idle; first request after idle is slow.
- Production (real money) hosting is explicitly a separate future decision;
  this ADR covers the prototype only.

## Verification anchors (observed state, 2 Nov 2026)

These anchors describe 2 November only, not current service or backup status.
App hosting was superseded by the November 2026 Oracle migration; see
[environments.md](../environments.md) for current hosts. Historical:

- Public demo: blockallisto-demo.onrender.com; staging:
  rwa-crowdfund-staging.onrender.com; public docs:
  blockallisto-docs.onrender.com; private docs on the Oracle VM.
- VM inventory (containers, memory, disk) measured live 2026-11-02.
