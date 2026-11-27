# Automatic-refund operator recovery, testnet prototype

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

This is a single-host prototype, not a deployed service. Nothing here authorizes
a contract deployment, account funding, mainnet use, existing-campaign changes,
or removing a lock. The bounded command accepts explicit recipients only.

## Before any run

- Obtain the required approval for the exact testnet rehearsal and per-PR
  publication/deployment scope. Do not use real money, credits or mainnet keys.
- Use a dedicated testnet payer, not the creator, investor or production wallet.
  Its existing named CLI identity must match the public payer in config.
- Review the built WASM hash, new contract address, token, creator, goal and
  deadline. There is no registry migration or automatic old-campaign upgrade.
- Keep config mode 0600 and the state directory mode 0700 on one host. All
  invocations sharing a payer must use the same directory. Multiple hosts or
  multiple directories are unsupported and can produce sequence conflicts.
- Set an explicit fee cap in stroops and at most 25 explicit recipients. A
  testnet fee cap is not approval for any real-currency fee.
- Keep the state directory and its private backups. A payer journal or signed
  recipient record must never be discarded to make a retry work.

## Normal states

`pending` means no payment proven. `signed` and `submitted` are not paid.
`confirmed` requires the exact transaction hash, successful result, reviewed
contract's `refunded` event, original wallet and positive matching amount, plus
the same return amount. A zero balance is never treated as payment evidence.
`blocked` requires investigation, not an automatic replacement transaction.

The batch stops after its first unresolved transaction. Run it again only under
its approved scope. It reconciles the stored envelope; it never replaces a live or uncertain
envelope. Only the separate expiry recovery described below can retire one. Other recipients wait for that payer
sequence to settle. An expired envelope can remain blocked even if history is
missing, which is safer than a second uncertain send.

## After an interrupted process

1. Stop all invocations for that payer. Do not start a second host or directory.
2. Preserve a byte-for-byte private copy of the entire state directory, including
   locks, recipient records and payer journal. Never paste signed envelopes in
   chat or expose them in a public UI/log.
3. Check the stored payer journal hash and the recipient hash agree. A journal
   reservation may exist before its recipient row after a disk failure. The
   code can recover the exact row from that reservation. Conflicting hashes
   fail closed and require manual investigation.
4. Query the exact testnet transaction hash and inspect its original envelope,
   status, event and amount. Missing RPC history is not proof it was never sent.
   Use an independent testnet source if necessary. Record both read times.
5. Only after the owning process is proved gone and the journal has been
   reconciled may an approved operator remove that exact abandoned lock. There
   is intentionally no timeout-based lock stealing or automatic lock cleanup.
6. Resume with the same private directory and named payer. Do not edit amount,
   contributor, hash or signed XDR to get through a validation failure.

## Specific failures

- Wrong WASM/config/network, stale ledger, invalid signature, unexpected auth,
  method/recipient mismatch, excessive fee or expiry: stop before sending.
- Send timeout or uncertain response: retain signed bytes and hash. Reconcile or
  retry only those exact bytes while valid; never prepare another envelope.
- Failed on-chain transaction: record blocked, never paid. The consumed payer
  sequence can be released for other recipients after envelope identity is
  verified. That failed recipient is not automatically retried.
- Successful transaction with missing/wrong/duplicate event or wrong amount:
  block the payer stream. Do not mark paid, clear its journal or continue.
- Disk full/fsync error: stop. No send occurs before its durable records commit.
  Preserve state; do not delete records or archives to create space without
  separate approval.
- Expired envelope with unavailable history: its recipient remains blocked.
  The separate reviewed recovery may release its expired payer reservation,
  never infer payment or authorize a replacement for that recipient.

## Rehearsal evidence and remaining proof

See `automatic-refunds-testnet.md` for the isolated rehearsal hashes. Two
contributors, original amounts, payer-only automatic signatures, manual
fallback, lost-response restart recovery and confirmed rerun without duplicate
payment were exercised on testnet. Independent RPC reads checked the exact
methods, sources, event wallets and return amounts.

A failed token transfer remains native/mock proof only. All backend/frontend test files pass in bounded runs, without a combined
coverage claim. The archived source build passes; an actual Docker image and
CI coverage checks remain unverified. The authenticated account read is
implemented but not deployed or configured. These limits must remain visible
in any release review. No hosted service or unattended monitor is claimed.

## Explicit expiry recovery, not payment confirmation

Not deployed. The bounded 27 November rehearsal is complete; its approval is
consumed and does not authorize another run. For a separately approved specific
environment, invoke the same private config and directory with:

```sh
AUTO_REFUND_EXECUTION=testnet_only_explicit node --import tsx backend/scripts/automatic-refunds-testnet.ts /absolute/private-config.json --recover-expired
```

This command cannot sign or submit. It checks the saved hash, payer signature,
fee cap, contract and original recipient against the exact signed XDR. It uses
the approved testnet RPC and requires a fresh getTransaction NOT_FOUND response
whose latest closed ledger time is strictly greater than maxTime. Local time
only rejects stale data; it does not prove expiry.

New transactions include a positive minTime. An absence proof additionally
requires oldestLedgerCloseTime strictly before that minTime in the same response.
This conservative inequality includes equal-time ledgers at the lower bound.
A retained-history gap or legacy minTime=0 yields history_unknown, never absent.

An expired record keeps its exact signed bytes, hash and proof. The recovery
transition writes the payer journal first, then the recipient, then clears the
payer reservation, all while holding its shared lock. A crash can therefore be
reconciled without deleting a live envelope. No lock is stolen.

A later normal batch may replace a proved-absent attempt only after archiving
its bytes and proof in the durable recipient journal. At most ten expired
attempts are archived. It checks the prior hashes again and halts on disagreement.
The successor payer reservation carries the predecessor archive, so a crash
before the recipient write recovers the exact new envelope, not another signature.

Unknown-history recipients remain blocked and are never automatically retried
or marked paid. The expired reservation may release the stream for unrelated
recipients because it can no longer execute in a future ledger. Manual refund
or a zero balance does not prove which historical transaction paid. Operators
must preserve and independently investigate unknown history; no journal editing.

The reviewed rehearsal artifact is the unoptimized CLI28.1.0 build. CI builds
crowdfund-auto with --locked --optimize=false and checks its exact1603bf0e digest.
The contract and its artifact are unchanged by this recovery candidate.

Sources: Stellar RPC submission guide, Wait for the result and NOT_FOUND helper
branch, https://developers.stellar.org/docs/build/guides/transactions/submit-transaction-wait-js ;
retention and response fields,
https://developers.stellar.org/docs/data/apis/rpc/api-reference/methods/getTransaction .

### Stream-wide reconciliation and trust boundary

The retired-hash watch is a separate durable payer record, bounded to 250
active entries. It is checked under the shared payer lock before each batch
recipient or recovery. Unknown history remains checked while this RPC can
still hold a possible inclusion ledger. A later exact successful
refund can confirm an unknown-history recipient; a definitive failure remains
blocked without being counted as payment. A result contradicting an absence
proof, an amount mismatch or journal conflict records a durable stream halt,
which blocks other recipients and later invocations too. A restart cannot clear
that halt. No automatic clearing of poison is implemented; safe watch archival is described below.

The proof trusts the one configured official Stellar testnet RPC over TLS,
with network passphrase and fresh same-response history metadata checks. It is
not an independent consensus proof. Adding another provider is not required by
the transaction protocol, and no second provider is silently added here. If that
RPC's historical data is wrong but internally consistent, the local checks
cannot prove it honest. A later contradictory result halts the stream. After
history ages out, repeated NOT_FOUND checks cannot recover a previously missed
execution; the saved coverage proof remains the reason replacement was allowed.

Actual read-only field-shape check on 24 Nov 2026 returned NOT_FOUND for a
synthetic hash: oldest/latest ledger numbers were integers and close-time
fields strings. Its latest close time converted to 24 Nov 2026 22:39:27 UTC, three seconds
before the read. This is a fresh field-shape check, not a recovery proof for
a real signed envelope. No live recovery, signing or submission was performed.

### Watch retirement and operator stop procedure

The watch is bounded to 250 active hashes. A definitive unknown-history success
or failure is saved on its original recipient and archived in a separate
per-hash private record before removal from the active watch. A NOT_FOUND row
can also retire once the RPC oldest retained close time is strictly after the
signed maxTime: no possible inclusion ledger remains queryable on that node.
That archival operation never changes a recipient's payment state or permits an
unknown-history retry. Original recipient and attempt journals remain intact.
An archive write failure or watch update failure stops the invocation; retries
are safe because the archive key is deterministic. Recent saturation stays a
safe hard stop until retained entries settle or age out, not a request to edit
state. Monitoring after retention cannot be promised or manufactured.

Before clearing a poison, stop every invocation, preserve the private state and
obtain independent exact-hash evidence for every conflict. No automatic or
hand-edit clearing command is supplied. A reviewed corrective migration with
explicit authority is required; do not remove the poison or use another state
directory to bypass it. RPC errors stop the invocation without clearing watches
or reservations. This is a single-host bounded testnet operator tool, not an
unattended high-volume service.

Retirement archives record the source endpoint, status, reason, known oldest
and latest ledger/time, recipient outcome and local recording time. Their first
write is immutable; retries reuse it. A changed source endpoint reported against
the saved expiry source halts the stream. The adapter itself only accepts the
fixed official testnet endpoint. A real captured SUCCESS response was replayed
through the installed SDK parser and this adapter: exact refunded event and
return amount were both 10000000 stroops. This did not sign, send, or exercise
an actual expired-envelope recovery.

## Operational successor: bounded observation and evidence-only diagnostics

The successor gathers the complete active watch with at most four hash reads
in flight, no automatic retries and a total cap of 250. All reads settle before
any reconciliation writes or new signature. Any missing read stops execution
without changing journals. The payer lock covers the read set and subsequent
writes, so another invocation cannot sign during the observation phase. This
reduces serial latency without introducing background polling or ignoring rows.
The recent 250-active limit remains a deliberate safety stop until settlement
or archival, not permission to discard records.

The private command also supports --diagnose. It takes no lock and makes no
filesystem changes. It reads the watch and active
reservation even when poisoned, gathers bounded status evidence, and returns
only hash/campaign/recipient/status/proof metadata, never signed XDR. The signer
is disabled in this mode. It cannot write records, clear poison, mark a payment,
retry a refund, or infer that a manual refund is safe. The report is an input to
review, not reset authority. An unknown prior payment must be reconciled before
any separately approved manual action.

Diagnostics are deliberately an unlocked observation report, never an atomic
reconciliation decision. They re-read the local watch/reservation after network
reads and expose snapshotUnchanged, but this is not a proof that no concurrent
change occurred. They work even while a real worker holds the payer lock and
cannot strand a new lock after termination. Do not use a report to authorize a
reset or payment. The actual mutation path still takes the payer lock.

The four-call limit counts status calls, not HTTP requests. The current adapter
checks getNetwork for each hash before getTransaction, so 250 hashes can issue
up to 500 sequential-pair RPC requests, at most four hash workflows in flight.
This has not been load-tested on the public endpoint. No high-volume live test
or faster polling has been started; throttling fails closed without retries.

## Completed real expiry proof

The 27 November isolated rehearsal exercised the actual expiry recovery and
one replacement through this worker. See `automatic-refunds-testnet.md` and the
safe JSON receipt for exact hashes, history bounds, amount and fees. Earlier
paragraphs describing parser replay and field-shape checks remain limited to
those checks; they are not the evidence for the later live rehearsal. The
failed-token-transfer case, aggregate CI coverage, exact Docker image and hosted
activation remain separate gates. No further chain trial is authorized here.
