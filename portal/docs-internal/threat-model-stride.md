# Threat model: one STRIDE pass (testnet prototype)

Scope: the money-adjacent paths the owner asked to review - TOTP and recovery
codes, escrow settlement (contract), admin operations, and webhook/ping
endpoints. Method: STRIDE per component. Sources verified 2026-11-02 from
backend/src (totp.ts, accounts.ts, ratelimit.ts, server.ts,
community-routes.ts, infrastructure/router.ts) and
contracts/crowdfund/contracts/crowdfund/src/lib.rs. This is one focused pass,
not a substitute for a professional audit before mainnet.

## Component 1: TOTP and recovery codes

Verified controls: TOTP seed encrypted server-side and never serialized to
clients (accounts.ts); 8 single-use recovery codes, shown once at enable time,
only hashes stored (totp.ts).

- Spoofing: session tokens are bearer tokens from a Freighter challenge; a
  stolen token bypasses TOTP until expiry/revocation - sessions list + revoke
  endpoints exist and should stay visible in the UI.
- Tampering: recovery code verification compares hashes; code zeroing on use
  prevents replay of the same code.
- Repudiation: second-factor actions land in the audit log (operator/admin
  audit endpoints); confirm login-time TOTP events are logged too.
- Information disclosure: seed never serialized; the risk is DB leak of
  encrypted seeds + recovery hashes - hashes are one-way, encryption key
  management is env-based and must rotate with documented procedure.
- Denial of service: TOTP verification endpoints need rate limiting - current
  limiter is in-process per instance (ratelimit.ts); a multi-instance deploy
  must move it to shared storage (noted in source).
- Elevation: enrollment/disable require an active session; confirm disable
  requires a fresh TOTP code, not just any session.

Open follow-ups: verify rate limits actually wrap /api/auth/totp/*; define
seed-encryption key rotation; decide lockout policy after N failed codes.

## Component 2: Escrow settlement (Soroban contract)

Verified controls: constructor-atomic init with creator auth; goal cap
rejects overfunding; withdraw once, creator only, after deadline, goal met;
refund once per contributor, record zeroed before payout; checked arithmetic;
state written before external token calls (rollback on failure); TTL bump
keeps records alive, expired entries archived not zeroed.

- Spoofing: all value moves require the respective party's auth
  (creator/contributor); no third-party withdrawal path exists in v1.
- Tampering: on-chain state is canonical; off-chain journal reconciles and is
  archived (145-event archive with integrity header, restore-tested).
- Repudiation: contract events emitted for contribute/withdraw/refund.
- Information disclosure: contributions are public on-chain by design; the
  privacy boundary (wallet addresses vs personal data off-chain) is ADR 0002.
- Denial of service: TTL expiry can freeze a campaign until entries are
  restored - monitor archive/restore, document the restore runbook before
  mainnet; bump permissionless by design.
- Elevation: no admin keys exist in the contract - no privileged path to
  abuse, but also no recovery path; lost creator key = funds locked at
  deadline (refund path still works for contributors if goal unmet; if goal
  met and creator key lost, funds are stuck - document this before mainnet).

Open follow-ups: Scout static analysis results (in progress); decide
emergency-pause story for v2 or accept immutability explicitly.

## Component 3: Admin operations

Verified controls: x-admin-key timing-safe compared against ADMIN_SECRET;
admin endpoints fail closed (503) when unset; audit log endpoints exist.

- Spoofing: a single shared admin secret is the whole control - rotation
  procedure proven during the Nov 2 incident response; store only in vault +
  0600 env files, never in scripts or logs.
- Tampering: admin actions cover comments, tickets, issuer applications,
  campaign news, podcast, reconciliation views; all should write audit-log
  entries - confirm every mutating admin route does.
- Repudiation: audit log exists; verify it records actor, action, timestamp
  for each admin mutation.
- Information disclosure: admin reads expose moderation queues and audit
  data; restrict to the operator's devices/networks by practice.
- Denial of service: admin endpoints share the same process; a forgotten
  ADMIN_SECRET means 503 (fail closed) - acceptable.
- Elevation: operator role is separate from admin key; keep the boundary and
  never hand the admin key to routine operator workflows.

Open follow-ups: per-route audit coverage check; consider scoping admin to
localhost/VPN when the private proxy path exists.

## Component 4: Webhook and ping endpoints

Verified controls: event-archive snapshot/verify endpoints are admin-gated;
healthchecks ping URLs (planned) are bearer tokens to be stored as secrets;
Kuma-to-ONS receiver (planned) is localhost-only with a hardcoded topic.

- Spoofing: anyone holding a ping URL can fake success pings - treat ping
  URLs as secrets, use per-check URLs, and alert on UNEXPECTED pings too
  (healthchecks supports this via check state).
- Tampering: snapshot integrity header is mandatory (restore/verify fail
  closed on headerless snapshots - regression-tested).
- Repudiation: snapshot job logs only OK/FAIL; alert path is the ONS email -
  end-to-end failure alert test pending at time of writing.
- Information disclosure: ping URLs and admin-gated endpoints leak nothing
  beyond timing; keep payloads free of event data.
- Denial of service: receiver must cap body size and stay localhost-bound;
  a public arbitrary-email relay is explicitly out of scope.
- Elevation: receiver has exactly one privilege (publish to one ONS topic);
  no shell, no file access, no other AWS/OCI calls.

Open follow-ups: land the Kuma-to-ONS receiver with the listed constraints;
run the user-approved controlled-failure test and record inbox-observed
delivery evidence.
