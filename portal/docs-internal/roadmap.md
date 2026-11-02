# Roadmap and known gaps

State as of 2026-11-02. This page lists planned work; nothing here is
shipped unless it also appears in the public docs.

## In progress (execution backlog)

CONDA-derived gaps, post-funding reports, campaign-builder deploy, email
registration polish, account security, payout history, issuer verification,
investor assessment depth, Freighter e2e, funding blocks, production
readiness, my-account, community flows, navbar disconnect edge,
8-opportunities page.

## Approved expansion (2026-11-02, phased)

- Share register with exports (PDF/CSV/JSON) - first in execution order.
- Payments: provider-agnostic checkout (fiat via PSP + stablecoin), on/off
  ramps, investor payouts - abstraction layer first against sandbox/test
  providers; provider selection and costs need owner approval.
- KYC/e-sign: provider-neutral adapters and record design; provider choice
  gated.
- Corporate actions: distributions, voting, meetings, issuer dashboard,
  holdings dashboard actions.
- Contract v2: per-offering min/max, RBAC, pausable, upgradeable, SEP-41
  token base - see `contract-operations.md`.
- Durable chain-event archive with backups and restore tests - production
  prerequisite (see `backend-operations.md`).
- Documentation portals: this dual-audience Docusaurus setup.

## Gated on owner decisions

Provider selection (PSP, ramps, payout, KYC, e-sign), anything touching
holder rights (freeze/clawback/forced transfer), upgrade authority design,
real-money activation, legal operator details, domain purchase.
