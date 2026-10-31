# Community, accounts and support API

31 October 2026. Adds registration/login, campaign comments, campaign news,
support/feedback tickets, issuer applications and campaign metadata to the
Soroban demo backend. Testnet demo code; no real funds, no real identity.

## Authentication (wallet challenge)

Registration and login are the same flow. The wallet is the identity, as in
the contribution flow. No passwords, no email, no personal data beyond the
Stellar public key and an optional display name.

1. `POST /api/auth/challenge` `{publicKey}` → `{message, expiresAt}`.
   Single-use challenge, 5-minute TTL, domain-separated human-readable text
   that says it is not a transaction.
2. The wallet signs `message` (Freighter `signMessage`).
3. `POST /api/auth/verify` `{publicKey, signature}` (base64 Ed25519) →
   `{token, expiresAt, account}`. Tokens are `bls_<hex>`, valid 30 days,
   stored sha256-hashed only.
4. Send `Authorization: Bearer <token>` on authenticated calls.
   `GET /api/auth/me`, `PUT /api/auth/me` `{displayName}`,
   `POST /api/auth/logout`.

This proves key ownership only. It is not KYC and must never gate
investment limits, cash-outs or compliance decisions (IMPLEMENTATION.md).

## Endpoints

Public reads:

- `GET /api/campaigns/:id/comments` - newest 100 visible; author shown as
  display name or truncated key, never the full key.
- `GET /api/campaigns/:id/news` - platform-posted updates, fixed
  `authorLabel: "platform-demo"` until verified issuer identity exists.
- `GET /api/campaigns/:id/metadata` - industry classification and document
  listings (see campaign-metadata.ts; documents flagged `demo: true` are
  fictional templates).

Authenticated writes (rate limited, validated):

- `POST /api/campaigns/:id/comments` `{body}` - 10/hour/account, 30/hour/IP,
  1000 chars.
- `POST /api/support/tickets` `{kind: support|feedback, subject, body}` -
  5/day/account. `GET /api/support/tickets` returns the caller's own only.
- `POST /api/issuer-applications` - 3/day/account; optional contact email.

Admin (`x-admin-key`, the existing demo-grade gate):

- `GET /api/admin/comments`, `POST /api/admin/comments/:id/hide|unhide`
- `POST /api/campaigns/:id/news` (issuer stand-in, labeled platform-demo)
- `GET /api/admin/tickets`, `POST /api/admin/tickets/:id/close`
- `GET /api/admin/issuer-applications`,
  `POST /api/admin/issuer-applications/:id/status`

## Privacy, abuse and retention

- No anonymous writes; every write is tied to a wallet session.
- Ownership: tickets and applications are readable only by their owner and
  the admin desk. Comments expose no full public keys.
- Rate limits are per-account and per-IP, in-process sliding windows; move
  to shared storage or a proxy limit before multi-instance deployment.
  Set `TRUST_PROXY=1` behind the hosting proxy for client-IP limiting.
- Clients must render comment/ticket bodies as plain text (no HTML).
- Retention: tickets and applications hard-delete after
  `COMMUNITY_RETENTION_DAYS` (default 90); hidden comments after 30 days;
  expired challenges and sessions are pruned. Pruning runs on boot and
  hourly.

## Configuration

See `backend/.env.example`: `COMMUNITY_DATABASE_URL` (falls back to
`SOROBAN_JOURNAL_DATABASE_URL`, then a local JSON file),
`COMMUNITY_STORE_PATH`, `COMMUNITY_RETENTION_DAYS`,
`CAMPAIGN_METADATA_JSON`, `TRUST_PROXY`.

## Known limits

- Single JSON document store (Postgres jsonb or file). Fine at demo scale;
  per-entity relational schema is a production follow-up.
- Admin gate is the demo-grade shared secret; production needs real admin
  identities with individual accountability.
- Freighter `signMessage` compatibility (including Ledger-backed wallets)
  must be verified in browser integration testing before the UI ships.
- Rate limiting is per-process; see above.
