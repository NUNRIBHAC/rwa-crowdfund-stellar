# Campaign read batching - shadow check evidence

One bounded live pass comparing the old per-campaign simulation reads with
the batched ledger read, on 2026-11-05 ~08:45 WET against
https://soroban-testnet.stellar.org, using the three campaigns documented in
docs/testnet-deployment.md and a random actor without balances. Script:
backend/scripts/shadow-campaign-reads.ts (manual use only, never scheduled).

Raw output:

    demo-solar MATCH {"old":{"raised":"566000000","withdrawn":false,"balance":"0"},"new":{"raised":"566000000","withdrawn":false,"balance":"0"}}
    e2e-success MATCH {"old":{"raised":"100000000","withdrawn":true,"balance":"0"},"new":{"raised":"100000000","withdrawn":true,"balance":"0"}}
    e2e-refund MATCH {"old":{"raised":"50000000","withdrawn":false,"balance":"0"},"new":{"raised":"50000000","withdrawn":false,"balance":"0"}}
    mismatches=0 newBatchMs=9686 oldPerCampaignMs=13274

Timing labels: newBatchMs is the new batched path (one sorobanCampaigns
call); oldPerCampaignMs is the old path (per campaign: verifyCode entry read
plus get_config/total_raised/is_withdrawn/balance_of simulations, campaigns
concurrent). Single samples in one cold-ish window on the public RPC;
indicative only, not a performance claim.

Measured RPC call counts in that run:

- old: 15 calls total = 12 simulateTransaction (4 per campaign) + 3
  getLedgerEntries (1 per campaign, the verifyCode entry read).
- new: 4 calls total = 1 batched getLedgerEntries carrying all 6 keys for
  all 3 campaigns (3 instance + 3 balance) + 3 balance_of simulation
  fallbacks (every balance entry was missing for the random actor).

Theoretical bounds (chunk limit 100 keys): old = 5N calls; new =
ceil(k/100) batched reads, k = N keys without actor and 2N with, plus one
balance_of simulation per campaign whose balance entry is missing or has an
unexpected shape. Unit coverage: 101 campaigns without actor = 2 chunked
reads and 0 simulations.
