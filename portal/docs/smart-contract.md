# Smart contract

Campaign funding rules are enforced by a Soroban smart contract on Stellar,
not by the platform backend.

## Funding model

- **All-or-nothing**: a campaign pays out only if it reaches its funding
  goal by its deadline.
- **Capped contributions**: total contributions cannot exceed the campaign
  goal.
- **Per-contributor balances**: each contribution is recorded on the
  contract against the contributor's address.
- **Refund path**: if a campaign misses its goal, contributors can reclaim
  what they put in.

## What the contract does not do (yet)

- No transferable investment token: positions are recorded as balances, not
  as transferable assets.
- No live funds: the contract runs on testnet with test USDC.

These constraints are deliberate for the prototype stage and are revisited
as the platform matures.
