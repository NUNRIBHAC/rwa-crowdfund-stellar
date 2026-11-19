# Database query budget and outage behavior

## Scope

This change reduces redundant SQL and stops database outages from terminating background startup work. It does not change providers, data retention, campaign/escrow state, database URLs, pool limits, billing plans or deployment configuration. Business actions still fail closed when their required state cannot be read or written. No hosted database was queried for these measurements.

## Reproduce the before/after measurements

Use Node 24 and the repository lockfile. Give the script the absolute path of each checkout. The baseline is commit `573173c4688b3564462102c6a5477644a1e61966`; the profiling script from this PR works with both versions.

```sh
NODE_ENV=test node --import tsx scripts/profile-database-queries.mjs /absolute/path/to/baseline
NODE_ENV=test node --import tsx scripts/profile-database-queries.mjs /absolute/path/to/candidate
```

The fixture injects an in-memory fake PostgreSQL pool. It counts actual calls to its `query` method, including BEGIN, lock, SELECT, write and COMMIT statements. It does not access a network, production data or provider quota. Both versions use an existing empty document and the same fixture. The first row measures that store path, not all SQL issued by a complete server startup.

| Scenario                                                                     | Before SQL calls | After SQL calls | Change                                                           |
| ---------------------------------------------------------------------------- | ---------------: | --------------: | ---------------------------------------------------------------- |
| First unchanged store mutation (prune path), including schema initialization |                9 |               8 | One unnecessary write removed                                    |
| 100 subsequent unchanged maintenance mutations                               |              500 |             400 | 20% fewer calls; writes reduced from 100 to 0                    |
| 100 rapid failed community initialization requests                           |              100 |               1 | 99% fewer attempted SQL calls within the one-minute retry window |

Additional deterministic regression measurements:

- Store construction starts zero SQL calls. Initialization runs only when an operation awaits it, so a constructor cannot create an unobserved rejected initialization promise.
- One quota failure followed by 100 new query attempts reaches the fake pool once. Later attempts reject locally during the quota backoff.
- Fifty simultaneous readiness refreshes issue one SELECT 1. Another 100 health/readiness reads within the fresh interval issue no SQL.
- Tests importing the server or default community factory start no maintenance timers. Tests can still explicitly exercise the runners with fakes.
- Real edits still use BEGIN, transaction-scoped lock, read, write and COMMIT. Failed edits still roll back and release the client. A no-op retains the transaction and lock but skips the write.

These are repeatable SQL-call measurements, not Prisma billing measurements or a prediction that any free monthly allowance will suffice. Normal user traffic, other databases sharing the workspace, separate processes and restarts still consume the provider's budget.

## Runtime behavior

All four PostgreSQL pool factories use a shared process-local meter and operational-failure circuit. Direct and `pooled.` host variants of the same URL identity share the circuit. Credentials, SQL, parameters and error messages are not returned by the meter.

- Idle-pool `error` events have a listener and mark the database unavailable instead of becoming fatal unhandled events.
- Quota errors back off for one hour. Other recognized connection/server/authentication failures start at one minute and back off exponentially to a 30-minute cap. SQL/business errors still propagate normally; the circuit is not a substitute for validation.
- New work rejects during backoff. Existing transaction rollback and session advisory-lock cleanup can still run. A failed client is destroyed on release rather than returning a potentially locked session to the pool. A failed COMMIT marks the database unavailable and does not claim success.
- Background startup and interval tasks catch failures and do not overlap themselves. Community initialization is single-flight and retryable with a one-minute minimum delay. Successful initialization stays shared for the lifetime of the process.
- Contributor reconciliation avoids repeating successful presence checks for the same campaign/actor within a pass. Failed confirmation work remains retryable.
- Existing retention and private-object cleanup semantics/cadences are unchanged. No startup query is removed if doing so would skip validation or cleanup work.

## Health and operator measurements

`GET /health` returns 503 while a required database has no recent successful evidence, has an open circuit or has stale evidence. A required community router must also have initialized successfully. File-only test/development configurations keep their existing health behavior. Health responses do not run SQL or reveal connection details.

A background tick runs once per minute, with at most one SELECT 1 per distinct registered database identity per five minutes, skipped during backoff and when ordinary successful work provides fresh evidence. Evidence expires after six minutes. This detects idle failures without charging SQL per load-balancer health request. It is sampled connectivity/readiness evidence, not an exhaustive proof that every table, permission, RPC or business operation works. A failure can occur between samples.

The idle probe ceiling is 12 SQL calls/hour per distinct identity per process, or 8,928 over a continuously running 31-day month. Ordinary successful work suppresses probes; restarts can add initialization/probe calls. Choose a provider budget with this overhead and all deployed processes in mind. The circuit is process-local, not a workspace-wide quota coordinator.

`GET /api/operator/database-usage` uses the existing admin-key gate and returns aggregate process-local SQL attempts, operational failures, last successful query time and retry-after time for each opaque identity. It does not query PostgreSQL. Counters reset at process restart, omit attempts rejected locally before SQL, and are not the provider's billed-operation meter. Compare snapshots over a known interval and reconcile with the provider console separately.

## Validation

Regression tests cover a production-mode server subprocess pointed exclusively at an unreachable loopback database: startup survives and health stays 503 across 50 requests. Fake-pool tests cover quota/connection failure, recovery, idle errors, cross-pool identity, non-overlapping tasks, callback failures, probe throttling, transaction rollback and session-lock cleanup. A real Express health test checks pending -> healthy -> failed state without SQL per poll.

No merge or deployment follows from opening this PR. Staging needs its own approval; demo is out of scope.

## Follow-up: read-only prune fast path

`CommunityStore.view(fn)` returns a validated snapshot with one `SELECT doc` and no transaction, advisory lock or write. `CommunityService.prune()` uses it to check whether any retention item is eligible before acquiring the locked `change()` path.

| Scenario                    | SQL calls | Notes                                                                               |
| --------------------------- | --------- | ----------------------------------------------------------------------------------- |
| No-op prune (100 runs)      | 100       | One `view()` `SELECT` each; no `BEGIN`/lock/`COMMIT`/write                          |
| No-op `change()` (100 runs) | 400       | Baseline retained for mutating callers; `BEGIN`, lock, `SELECT`, `COMMIT`           |
| Real prune with deletions   | 6         | `view()` `SELECT` + locked `change()` (`BEGIN`, lock, `SELECT`, `INSERT`, `COMMIT`) |

Regression coverage:

- `database-runtime.test.ts` asserts `view()` issues only `SELECT doc`, never `BEGIN`, `COMMIT`, `ROLLBACK`, advisory locks or writes, and that mutations inside the callback do not persist.
- `database-runtime.test.ts` asserts a no-op prune uses a single `view()` `SELECT`, while a prune with deletions still uses the locked `change()` transaction.
- Existing prune semantics are preserved: old tickets, applications, sessions, challenges, hidden comments and notifications are still deleted under the advisory lock.
