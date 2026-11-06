# ADR 0004: Free-tier hosting: Render + Neon + one Oracle VM

- Status: Accepted (prototype stage)
- Date: 2026-11-02 (decision predates this record; recorded from current state)

## Context

The prototype must be publicly reachable with zero budget. The owner prefers
free tiers, with any paid upgrade brought to him first.

## Decision

- App hosting: Render free web services - a public demo environment and a
  separate staging environment, each auto-deploying from its own branch, each
  with its own database.
- Databases: Neon Postgres (demo and staging journals).
- Self-hosted tooling on one Oracle Cloud Always Free VM (ARM, Frankfurt):
  Weblate (translations), Uptime Kuma (uptime checks), Bitwarden, the private
  docs portal, and the nightly encrypted backup job for both Neon databases.
- Documentation portal: public build on a Render free static site; private
  build served from the Oracle VM behind basic auth.

## Consequences

- Zero running cost; capacity limits are real and measured before adding
  services (the GlitchTip sizing check is the standing example).
- Single VM = single point of failure for tooling and backups; whole-VM death
  cannot be reported by anything on the VM itself (see monitoring docs: ONS
  email path, dead-man's switch, candidate OCI absence alarm).
- Render free services sleep when idle; first request after idle is slow.
- Production (real money) hosting is explicitly a separate future decision;
  this ADR covers the prototype only.

## Verification anchors (observed state, 2 Nov 2026)

Superseded by the November 2026 Oracle migration; see
[environments.md](../environments.md) for current hosts. Historical:

- Public demo: blockallisto-demo.onrender.com; staging:
  rwa-crowdfund-staging.onrender.com; public docs:
  blockallisto-docs.onrender.com; private docs on the Oracle VM.
- VM inventory (containers, memory, disk) measured live 2026-11-02.
