# SEP-41 share token (testnet scaffold)

Targets [SEP-41 version 0.5.2](https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0041.md)
with Soroban SDK 29.0.1. This is not a security audit or a production token.

- `approve(from, spender, amount, live_until_ledger)` replaces the allowance.
  The expiry ledger is inclusive. An expired allowance reads as zero and
  spending never moves its expiry. Positive approvals must fit the network's
  maximum temporary-entry lifetime. Zero approval revokes even with a past
  expiry. Clients should revoke and confirm before replacing an allowance
  when avoiding the allowance replacement race matters.
- Allowances use a new temporary-storage key. Old indefinite persistent
  allowances are not promoted, inferred, or made spendable.
- `burn_from` requires spender authorization, consumes allowance and reduces
  the holder balance and total supply atomically. Pause blocks all movement,
  including delegated burns; revocation remains possible while paused.
- `transfer` accepts plain or muxed addresses, credits the base address and
  includes the muxed id in event data when supplied. Zero movement is valid;
  negative movement is rejected.
- Events use SEP-41 topics: `approve/from/spender`, `transfer/from/to`,
  `burn/from`, `mint/to`. Approval data is `[amount, live_until_ledger]`;
  transfer data is a map with `amount` and optional `to_muxed_id`; burn and
  mint data is the amount. There is no SAC asset-identifier topic.
- Standard `METADATA` storage contains `decimal`, `name`, `symbol` in the
  same shape as soroban-token-sdk 29.0.1. Existing getters remain available.

## Release boundary

The backend packages the new bytes as `v2-share-token-sep41.wasm`, with an
exact hash pin. New token deployment preparation uses those bytes. Read-only
position checks accept either that pin or the one exact existing scaffold
pin, so existing legacy positions do not disappear. Unknown code is still
rejected. Legacy compatibility is not a claim that the old token is SEP-41.

This does not upgrade, migrate, or deploy an existing contract, grant new
production roles, change the crowdfunding contract, or move any real assets.
An existing token needs a separately reviewed migration/redeployment plan;
old allowance storage is intentionally not reused. Merging source or
publishing the app is not a contract deployment. In-flight old deployment
intents must be reconciled before preparing deployment under a new pin.

## Tests

`cargo test --locked` covers the workspace. The share-token suite checks
expiry boundaries, no sliding, revocation, delegation, rollback, exact event
shapes, muxed destinations, unauthorized calls, metadata and the standard
Soroban token client. `stellar contract build` with CLI 28.1.0 builds the
packaged Wasm; CI compares its SHA256 and all bytes with the packaged file.
