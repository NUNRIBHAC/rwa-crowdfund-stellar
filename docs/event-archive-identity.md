# Archive identity and reset recovery

Archive format v2 binds new rows and checkpoints to the configured network
passphrase hash, the contract id, and `EVENT_ARCHIVE_EPOCH`. The default epoch
label is `initial`. An epoch label is a storage namespace, not independent
proof of a chain's identity. RPC `getNetwork` must match the configured network,
and a saved ledger-hash anchor must still match before a cursor is reused.

The archiver requires `getLatestLedger` to return its ledger id and uses
`getLedgers` for an older anchor. A regressed ledger, changed hash, missing
anchor, unavailable lookup or expired RPC history holds the cursor. It does
not infer that an old cursor covers a reset chain, even if the replacement
chain has already passed that ledger number. Every completed window also
rechecks the scan's head anchor before writing rows and advancing its cursor.

## Existing history

- V1 rows and unscoped checkpoints stay in place without being stamped with
  a network or epoch that was never recorded.
- A new identity starts its own scan from ledger 1. The RPC retention floor
  still produces a recorded gap; an identity migration cannot recover history
  the RPC no longer serves.
- Row deduplication includes campaign, identity and the original RPC event id.
  Equal RPC ids across contracts, networks or epochs cannot erase each other.
- Snapshot v2 hashes include identity and use scoped row keys. V1 snapshots
  remain readable with their original row hashes. Restore never guesses an
  identity for an unbound legacy row.
- Deletion-history evidence requires matching current identity and a verified
  chain anchor. Legacy or foreign-identity rows make a mixed campaign archive
  unavailable for a clear-history claim. They are preserved, not ignored.

## A held archive

First check whether the RPC endpoint is wrong, temporarily unavailable or
merely behind. Keep the exact archive and checkpoint. Do not clear either one,
relabel old rows or choose a new epoch simply to make the error disappear.

After an operator reviews evidence of a chain reset, or an unbridgeable
retention gap, a separately approved configuration change can select a new
unique epoch such as `testnet-reset-2026-11`. It creates a separate scope and
rescans only available history. It does not repair missing historical coverage
or authorize deletion. Returning to an old epoch will recheck that epoch's old
anchor and may still fail. No automatic reset detection claims or epoch
switches are made on an operator's behalf.

## Rollout limits

The existing tables need no destructive migration. New scoped keys coexist
with old keys, so the first v2 pass may create additional rows for events that
also exist unbound. Keep old rows, backups and snapshots. Verify capacity before
rollout and confirm external snapshot consumers accept v2 before upgrading them.
This change does not modify the contributor-backfill identity model, restore
missing events or prove complete historical coverage of earlier chain epochs.
