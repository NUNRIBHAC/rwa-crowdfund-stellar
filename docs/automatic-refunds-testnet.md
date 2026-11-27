# Automatic refunds, isolated testnet prototype

## Latest integration validation, 27 November 2026

On main PR 296, all 1,004 backend tests and 1,905 frontend tests passed.
Merged local coverage exceeded unchanged thresholds: backend lines 94.54%,
branches 87.55%, functions 96.11%; frontend lines 84.2%, branches 79.04%,
functions 77.12%. Exact exported source passed build, lint, formatting, catalog
sync and production-host integration. The actual arm64 Docker candidate built
successfully; 101 backend/frontend/WASM/runtime-script hashes matched the
independent build. No service was restarted. Hosted CI is still pending branch
publication. These later results supersede earlier local gate-status statements
below, which describe their dated rehearsal or implementation stage.

The account reader remains disabled by default and not deployed. A real failed
token transfer and native Safari remain unverified. No new chain execution is
authorized by this document.

## Scope

This work is a new opt-in contract variant, `crowdfund-auto`. It does not change
v1 source, its reviewed WASM, any deployed contract or campaign registry entry.
`refund_for(contributor)` has no payee or amount parameter. After a failed goal
and deadline, it returns the contributor's recorded balance only to that address.
The signed `refund` method remains available. A failed token transfer rolls back
the balance removal, and one recipient uses one transaction.

## Current implementation

- Separate contract variant and 26 native contract tests.
- Existing contract workspace regression: 94 tests passed in total.
- Worker core with explicit testnet passphrase, contract/WASM allowlist and fee
  cap. Signed envelopes are saved before submission. An uncertain send retries
  only the same signed envelope/hash. Confirmation requires a matching amount
  from chain evidence. Zero balance is not proof of a completed refund.
- Single-host private file store with exclusive per-recipient locks, file fsync,
  atomic rename and directory fsync. An abandoned lock is never stolen on a
  timeout; reconcile its stored transaction before operator recovery.
- 102 worker/store/envelope/payer/event/RPC/batch/CLI tests pass. Backend typecheck
  and scoped lint pass. RPC tests are mock transport tests, not chain proof.
- Independent decoder checks both unsigned preparation before the signer and
  final signed XDR: one operation, original contributor, method, payer/sequence,
  testnet-bound hash/signature, total/resource fee and finite expiry.
- Shared payer journal serializes all campaigns/recipients. Signed XDR is fsynced
  to the payer reservation before its recipient record. Recovery never invents
  a new envelope; unresolved transactions block other recipients.
- Concrete RPC adapter only permits the official HTTPS testnet RPC, verifies
  fetched WASM and exact creator/token/goal/deadline, checks chain freshness,
  and requires the precise refund event plus return amount for confirmation.
- Event wire schema is checked against the actual Rust contract event macro.
- Explicit bounded batch command, at most 25 named recipients, stops on the first
  unresolved payer sequence. No service loop or production server wiring.
- Safe status view exposes translation keys and evidence-backed states only,
  never signed XDR or raw remote/signing errors.

## Isolated testnet rehearsal, 24 November 2026

Two fresh opt-in contracts and dedicated faucet-funded test accounts were used.
No real money, staging configuration, campaign registry or existing campaign was
changed. Reviewed WASM SHA-256:
`1603bf0edb92ab1b6594e37dcb825fc64c065b38ec62dbe913fda6f2df92e855`.

- Contract `CAWYL4NUIPHQOSZUVKT3S5IX77ZFG6UPYMHDRNO5EAERAZAHJ65B73M7`:
  two contributors received exactly 1 and 2 test XLM after a failed goal.
  Both automatic transactions have one signature, from the dedicated payer,
  with exact original-wallet refund event and return amount independently read.
  Hashes: `43a10fac731d62180efd97d7f0aec510bc2f141070297f9cf8fdb495aa45103f`
  and `5d37fce8b67e4f6e4f9278fcd13030e19161b667c1fd8341dc990a93435f273b`.
  Actual fee: 8,097 stroops each. Repeating a confirmed run did not send again.
- Contract `CBH67LI3B2PBARD2JUCIZLJTGWPXI2OXIKXAMFEMYM3GC27ZCTFTH526`:
  manual `refund` returned 1 test XLM, hash
  `d8f1742ed6cd8008809ba9b644b8daad513fa9f8a12b8c74ed092cc873ccc9f7`.
  A 2 test XLM automatic refund simulated a lost response after accepted send.
  Restart reconciled the same hash
  `d53295c016f8d0b79246ed5c1d59eae557df5609543186b08787ec87f525fa2c`.
  Both amounts, methods, sources and events were independently read from RPC.
  The manually refunded account subsequently returns no balance, not invented
  automatic payment evidence. An attempt before deadline did not sign or send.
- Setup upload/deploy/contribution simulation needed a separate ceiling of
  10 test XLM. The worker ceiling stayed 0.1 test XLM. These are test-only caps,
  not actual fees or permission to spend real money.
- The bounded CLI was run against the already-confirmed two-recipient journal;
  it returned both existing confirmations with no new transaction. The normal
  CLI signing path is unit-tested; first sends in the rehearsal used a private
  harness around the same adapter, verifier, worker and durable store.

A real failed-transfer transaction has NOT been rehearsed. Native contract
rollback and mock failure tests are not chain proof. All 1,004 backend and 1,905 frontend tests pass in disjoint bounded runs, plus
14 UI-kit tests and 94 Rust tests. This is not a combined coverage result.
The exact git archive builds under Node 24 with the Docker build variables;
media index, reviewed WASM, host integration, lint and formatting pass.
An actual Docker image build and CI coverage checks remain unverified.

## Account read screen, opt-in and disabled by default

`AUTO_REFUND_READ_CONFIG` is unset by default. Only on testnet does it enable a
read provider using the same private config/journal. The authenticated wallet
session selects the contributor, never an actor query parameter. Email/social
sessions are refused. Responses are no-store and contain only campaign, safe
status and a positive confirmed amount. No signer or worker execution occurs
on a read. Missing configuration fails closed; no payment progress is invented.
The first read screen supports native test XLM only, rejecting other token
configs rather than displaying the wrong unit. It is mounted in the account
source, but not deployed or configured on staging. Existing v1 campaigns are
not registered with this worker or given misleading manual-refund links.

All 88 new texts passed through Weblate for all 11 locales. The five status
states passed a 66-cell language/width/theme matrix at 320/390/1280px, including
Arabic text direction with unchanged LTR geometry. Theme selection is applied;
the shared content surface intentionally has the same colors in both modes.

## Bounded command

`backend/scripts/automatic-refunds-testnet.ts` is intentionally absent from the
server and npm start. It requires `AUTO_REFUND_EXECUTION=testnet_only_explicit`
and a private mode-0600 JSON config path. Config contains public identifiers,
explicit recipients, one reviewed WASM, absolute private store and CLI binary
paths, a named pre-existing CLI testnet identity, and exact fee/batch limits.
No secret seed is accepted in config or command arguments. The CLI signer gets
unsigned XDR via stdin, with inherited secret/network overrides removed. The
final signed bytes are independently checked before the durable journal stores
or sends them. Output is private operator state and hashes, not signed XDR.

Any further execution, funding or contract deployment must stay within explicit
approved scope. The isolated rehearsal approval is not main/staging/deployment
approval. Existing v1, production and the registry remain unchanged. Fees use testnet currency only;
there is no mainnet mode or real-money route.

## Expiry and replacement rehearsal, 27 November 2026

A separately approved fresh contract and two dedicated test accounts exercised
the real integrated worker, verifier and durable store. The first refund was
signed once, stored in identical payer/recipient journals and never submitted.
Its positive 120-second time window expired. The official testnet RPC returned
NOT_FOUND for its exact hash with retained history starting before minTime and
ending after maxTime. Recovery signed and submitted nothing.

One later normal-worker call signed and submitted one replacement. Its successful
result, payer signature, exact contract/original recipient, native-token transfer,
contract refund event and return value independently agree on 10,000,000 stroops
(1 test XLM). A repeated worker call signed and submitted nothing. The expired
bytes remain unchanged in the private durable attempt history.

Public chain identifiers and safe proof metadata are recorded in
`automatic-refund-expiry-rehearsal-20261127.json`. No keys, signed envelopes,
private paths or personal accounts are included. Actual setup fees were
923,838 stroops and the replacement cost 8,097 stroops. No real money, existing
campaign, owner wallet or site configuration was used or changed. This closes
the real expiry/replacement rehearsal only, not feature deployment or the
unrehearsed failed-token-transfer case.
