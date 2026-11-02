# Backend operations

## Contributor backfill

- Rebuilds the contributor journal from Soroban RPC `getEvents`.
- RPC retention is a bounded ledger window (default ~7 days on stock
  servers); the backfill floor-clamps ranges and stores versioned
  checkpoints (`BACKFILL_VERSION=2`) so re-runs are incremental.
- Backfilled rows carry the synthetic actor `backend-backfill` so they are
  distinguishable from live contributions.

## Reconciliation

- Admin reconciliation endpoint compares journal state against chain state;
  requires the `x-admin-key` header (value in Render env vars, not in the
  repo).

## Durable event archive (approved direction, 2026-11-02)

- Owner approved keeping our own archive of chain events and transactions
  with independent backups and restore verification - not just current
  balance exports.
- Rationale: RPC history is a moving window, current contract state is not
  history (refunds zero balances), and testnet resets erase history
  permanently.
- Production prerequisite: continuous archiving from each contract's first
  deployment ledger, gap detection on the sync, and tested restores before
  any real-money activation.

## Backups

- Nightly encrypted backups of both Neon databases from the Oracle VM.
