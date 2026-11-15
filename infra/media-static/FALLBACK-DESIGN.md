# Pages, Worker and temporary B2 authorization

PR implementation, 15 November 2026. Design and third-level daily budget
approved; no live direct-B2 configuration or Worker deployment. Pages is the authoritative
published copy. The current staging release still has its old read-only media
mount; this proposal does not authorize its removal or a release.

## Chain

1. The browser uses the static Pages copy first. Pages has no Functions.
2. On a failure or bounded timeout, the browser requests the app's existing
   `/media/<public-key>` URL. Replace that route's filesystem handler with a
   server-side gateway to the existing media Worker, which reads private B2.
3. If the Worker is unavailable, including its free request quota, the app
   server gets a short-lived B2 download authorization and downloads the same
   allowlisted key directly from B2. Return only verified media bytes to the
   browser. Do not return the authorization, redirect or upstream headers.

The final leg does not use Cloudflare. It does use the existing app server and
B2. It bypasses a Worker limit, never a B2 limit. B2 outages, disabled keys and
B2 account download/transaction caps can still stop it. No limit is increased,
no card is added and no paid escalation is allowed.

The `/media/` URL is not a VM media copy. It remains as a bounded gateway URL
so existing font secondary sources, image error handlers and timeout handlers
do not need a new public token endpoint or additional browser CSP origins.
It must not read a local media directory. Keep only public key/hash/size
metadata in the runtime image, never the exported media files. No disk media
cache, periodic synchronization or archive is part of the replacement.

For non-JavaScript icon/PWA consumers that already use `/media/`, the gateway
must try Pages first, then Worker, then direct B2. Normal image/font retries
can signal that Pages has already failed to avoid a second stalled primary
attempt. Social crawlers viewing Pages links cannot run client failover.

## Identity, key mapping and integrity

Accept GET/HEAD only. Decode once, require an exact exported public key or
reviewed alias, reject traversal, double encoding, dotfiles, unknown paths,
Range and arbitrary upstream URLs before any outbound call. Ignore incoming
cookies, Authorization, Host and query parameters when constructing upstream
requests. Never list the bucket at request time.

Use the reviewed manifest to produce a metadata-only runtime allowlist and
alias table. Verify response byte length and SHA-256 before returning a body.
Bound each body to the manifest length and a fixed maximum, abort on timeout,
redirect, size overflow or hash mismatch. No upstream HTML/error page can be
returned as an asset. Rebuild the response's MIME/cache/nosniff headers locally.

Pages font CSS uses relative URLs. B2/Worker source CSS uses older absolute
Worker URLs. Normalize verified CSS font URLs to `/media/fonts/...` when
serving through the gateway, keeping face descriptors and font bytes unchanged.
Never change Pages itself as part of runtime fallback. Test nested font failures
and Arabic/CJK rendering, not only the CSS request.

The ten exact `social icons/<name>` canonical paths map to their existing B2
keys, while the safe Worker alias is `social/<name>`. Names:
`discord.svg`, `email.svg`, `facebook.svg`, `farcaster.svg`, `instagram.svg`,
`linkedin.png`, `telegram.svg`, `threads.svg`, `x.svg`, `youtube.svg`.

The remaining three mappings are:

| Pages/Worker request  | B2 object under public/     |
| --------------------- | --------------------------- |
| icon-192.png          | icons/icon-192.png          |
| icon-512.png          | icons/icon-512.png          |
| icon-512-maskable.png | icons/icon-512-maskable.png |

Only these reviewed space-containing paths are accepted, not arbitrary spaces.
AVIF must be added to the Worker's extension list for the six new derivatives.
The local routing test covers all 13 mappings, six derivatives, bad paths and
non-GET/HEAD rejection. This is not evidence of live deployment or B2 writes.

## Temporary authorization

Keep the application key server-side in secret files. Use a separate key
restricted to the existing bucket and `public/`, with only the capabilities
required to authorize and download public assets, including `shareFiles`.
Do not widen or replace the Worker's existing read-only key. First inspect
whether an existing suitable server key already exists; creating one needs
approval. No key or bearer token belongs in code, browser URLs, logs, metrics,
errors or test receipts.

`b2_get_download_authorization` accepts a filename prefix, not an exact-file
capability. Use the full canonical `public/<key>` as the narrowest prefix,
120-second lifetime and server-side Authorization header. Exact membership
is enforced by the gateway. Because the token never leaves the server, any
same-prefix suffix scope is not exposed to browser callers. Share concurrent
in-flight requests for the same key. Never mint whole-bucket or `public/`
browser tokens. Cache authorization only in process memory until expiry.

Browser-visible signed URLs are a different design: replayable until expiry,
bypassing the gateway's byte/rate accounting and requiring B2 CORS for fonts.
They are not proposed here. The server-side design needs no bucket CORS or
bucket-publicity change and no new browser destination.

## Free-tier and abuse fences

Vendor-enforced $0 daily caps remain authoritative. Verify current console
usage before live tests; reserve space for other B2 clients. Never infer
available budget from marketing allowances.

The approved shared daily budget stays below
the account limit. Ceiling: 64 MiB direct-download bytes,
256 direct downloads and 256 token-mint operations per UTC day. Reserve the
manifest byte length before starting a request, including failed attempts;
do not refund failures automatically. Include account-auth operations in a
bounded counter. The candidate conservatively shares a 256-operation ceiling
between token mints and account authorizations, so total token mints can never
exceed the approved 256. Authentication consumes part of that ceiling. Persist reservations atomically outside the app image
and fail closed if accounting is unavailable. Restarts must not reset the
budget. Multiple app processes/environments must not each receive a full copy
of that budget. Keep demo unchanged and direct fallback disabled there.

Apply per-IP and global rate limits, bounded map cardinality, at most four
concurrent direct downloads, in-flight coalescing, body-size ceilings and
short connect/body timeouts. Rate limiting behind a proxy needs verified
trusted-proxy configuration; never trust arbitrary X-Forwarded-For. A hostile
client can still consume some permitted budget, so return an honest bounded
unavailable response when exhausted. Availability is not promised after a
free quota is spent. Do not silently increase limits to recover.

Primary/Worker requests also need bounded concurrency, timeouts, a short
circuit breaker and negative caching so a dead provider does not receive one
repeated request per font or image. Do not retry recursively. At most one
attempt per stage per asset request, with a total deadline. Log only stage,
public key, status class and duration, never credentials or signed URLs.

## Current evidence and remaining gates

The pre-publication Worker audit returned matching bytes for 547 of 558
canonical original keys plus 22 of 25 aliases. The 13 missing routes above are mapping gaps, not
evidence that B2 lacks those files. The canonical audit compared
`fonts/SHA256SUMS.txt` against newer repository metadata. Both live Pages and
B2 actually hold the same older digest text. Eight CSS digest entries are older
than current CSS responses; actual font binaries matched. Pages remains authoritative. Do not
silently overwrite upstream metadata or call that mismatch font corruption.
The app does not fetch this archival text as a runtime font dependency.

Before release, test Pages-primary, Pages blocked, both Cloudflare hosts
blocked/Worker quota response, B2 rejection, cap exhaustion, expired token,
invalid credential, timeouts, hash/size mismatch, redirect, concurrent expiry,
restart accounting, path bypass, and disconnect cancellation. Verify images,
font faces, HTML icons, PWA icons, responsive picture fallback and all themes,
11 locales, mobile/desktop and Arabic RTL with real rendered pixels.

Required approvals, separately:

- Final gateway design and budget approved. Persistence location/provisioning
  remains a release decision; missing or corrupt accounting fails closed.
- Create a separate scoped B2 server key only if needed. No CORS/public change.
- Deploy reviewed Worker alias/AVIF changes. Demo uses this Worker, so check
  its existing routes without changing demo's app/container.
- Six derivatives publication complete: B2 then Pages, with all 589 live
  assets verified and previous 583 preserved, no VM change.
- PR203 gateway amendment and merge/staging release are approved subject to
  fresh complete CI and content-level release checks. Keep direct B2 disabled
  until its separate key and persistent-ledger gates are approved.
- Remove staging's old mount/env only with the gateway release; after forced
  final-leg success and Pages integrity confirmation, delete exactly the named
  obsolete VM directory. No archive or unrelated cleanup.

This document does not grant authority for a live step. The old copy is not a comparison
baseline and needs no further content audit for this design.

## Official references

- https://www.backblaze.com/apidocs/b2-get-download-authorization
- https://www.backblaze.com/docs/cloud-storage-download-files-with-the-native-api
- https://www.backblaze.com/docs/en/cloud-storage-create-and-manage-caps-and-alerts
- https://developers.cloudflare.com/workers/platform/pricing/
- https://developers.cloudflare.com/pages/functions/pricing/
- https://www.backblaze.com/docs/cloud-storage-cross-origin-resource-sharing-rules

## Candidate runtime configuration

`backend/scripts/media-index.mjs` emits only key/byte-count/hash metadata into
`backend/dist/public-media-index.json`. Docker builds it after app compilation
and copies gateway code, not media fixtures. The host fails startup on partial
or relative direct-fallback file configuration. With no direct configuration,
Pages/Worker gateway stages still work and the final stage fails closed.

All three paths must be supplied by an approved staging release:

- `MEDIA_B2_KEY_ID_FILE`: secret-file path for a separate readFiles/shareFiles key.
- `MEDIA_B2_KEY_FILE`: its secret-file path. Exact bucket/public-prefix scope
  required; write/delete capabilities are rejected, even if the key works.
- `MEDIA_B2_BUDGET_FILE`: durable shared accounting JSON path, provisioned once
  outside the app image, not recreated at startup. Suggested staging-only
  placement must be approved before release. The state fields are `day` (UTC
  YYYY-MM-DD), `bytes`, `downloads`, `operations`, initially zero on provisioning.

Atomic exclusive lock plus file and parent-directory fsync protects reservations.
A crash-stale lock blocks direct fallback until an operator reconciles it; code
never deletes an unfamiliar lock or resets allowance. UTC rollover resets a
valid prior-day ledger under the same lock; clock rollback blocks it. Sharing
this budget across hosts would need a real shared store, not copied JSON files.
Only staging may enable it under the present scope; demo remains untouched.

At most 32 gateway callers are admitted; at most four direct transfers run,
with a bounded FIFO for the rest. A 20-asset simultaneous-load regression checks
all complete with peak direct concurrency four. No media bodies survive beyond
in-flight coalescing; the browser may cache successful public responses for 24h.
A provider circuit breaker and per-key negative cache last 30 seconds. Each
provider attempt is bounded to four seconds, total twelve seconds. Disconnects
cancel unneeded upstream work once the last coalesced caller leaves.

Local verification: 24 gateway tests, 6 public-export tests, 1 Worker routing
test; real production-host integration; 132 rendered detail-page cases across
three provider modes, 11 locales, two themes and two widths. These use fixture
providers, not live B2 token minting. A live scoped-key and forced final-leg test
remains mandatory before deleting the obsolete media directory.
