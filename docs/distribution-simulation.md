# Isolated distribution execution rehearsal

This module advances the prototype from a disposable allocation preview to a saved, reviewed and receipted **simulation**. It is not a payment system or a declaration of shareholder rights.

Run from the repository root:

```sh
node --import tsx backend/scripts/demo-distribution-simulation.ts
node --import tsx --test backend/test/distribution-simulation.test.ts
```

The demo always creates a fresh temporary local ledger with fictitious holders and removes it afterward. It does not read environment credentials, use a wallet, contact a network, or modify the hosted application.

## Lifecycle

1. Prepare an instruction from a complete, positive, single-basis cap table and a positive total. Unknown holders, mixed bases and duplicate holders are rejected. Exact allocations reuse the existing decimal-unit largest-remainder calculation.
2. Save a copied snapshot, its consistency hash, copied allocations and an input-bound idempotency key. Matching repeated preparation returns the same instruction. Different inputs with the same campaign/key fail.
3. A different synthetic actor reviews the draft. Review does not establish real identity, a legal mandate or an authorized dividend.
4. The reviewer starts simulation. The ledger saves `dispatching` before calling the mock adapter. A second invocation, a competing process or a reopened process cannot dispatch that instruction again.
5. Only a complete, matching set of unique `simulation:` receipts produces `simulated`. Missing, altered or lost responses produce `unknown`, with no receipts and no automatic retry. A process crash during dispatch leaves `dispatching` for inspection, not a new dispatch.
6. A participant can cancel only before dispatch with a recorded reason. Every transition has an audit entry.

Files use private permissions and atomic replace with file and directory synchronization. An exclusive process lock protects updates. A crash lock is not removed automatically. The snapshot hash detects inconsistent content; it is not an authenticated signature and does not protect a ledger against an attacker who can rewrite the whole file.

## Boundaries and unfinished integration

- The adapter accepts only `test_only`. There is no live adapter, HTTP route, operator UI, provider instruction, custody operation or chain transaction.
- Synthetic actor labels are not authentication. Any future hosted integration must use the existing authenticated session and operator gates, not accept an actor supplied by a request body.
- The fixture ledger is separate from existing journals. This module never archives or repairs historical records.
- A complete app-known register can still omit holders outside the app. This simulation does not certify the completeness of a legal register, record-date entitlements or current balances.
- Real execution still requires validated issuer instructions, holder/record-date evidence, rights and tax rules, payment-provider controls, authorization, reconciliation, security review and separately approved activation. The mock receipt is not evidence of payment.
- Investor meetings, resolutions, votes, issuer messaging and their UI remain separate work. This module does not claim those are implemented.

## Optional local HTTP harness

`createDistributionSimulationRouter` is available for isolated integration tests, but is **not mounted** in the application server. Its dependencies must explicitly select `test_only`, provide an isolated ledger and synthetic register, and use authenticated account sessions. The current allowlist is checked for every request. Request bodies cannot supply actors or register snapshots. Preparation fetches the injected synthetic testnet register; approval and simulation use the session's account identity. The local HTTP test signs fresh fixture challenges, checks anonymous/non-operator/removed-operator rejection and distinct review, then verifies the community store was unchanged.

This is local session/API integration evidence, not a hosted operator-session verification or a production-ready authentication/authorization review. Two authenticated fixture actors are two accounts, not proof of independent real people.
