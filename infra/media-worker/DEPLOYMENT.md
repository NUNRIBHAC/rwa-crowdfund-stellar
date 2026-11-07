# blockallisto-media Worker - deployment + recovery notes (NO SECRETS)
Updated 2026-11-07 00:25 WET. Covers the live v4 (cache + scoped CORS). Secrets live only in the Instinct vault and the Cloudflare worker secrets store; this document contains names, never values.

## Architecture
- Public origin: https://blockallisto-media.nunrib-df6.workers.dev/
- URL mapping: `GET /<path>` -> B2 object `public/<path>` in PRIVATE bucket `blockallisto-media` (ID 435986d81e2ab338a91e071a, region EU Central 003, endpoint s3.eu-central-003.backblazeb2.com, B2 account 3968ea389e7a, console login blockallisto@gmail.com).
- Cloudflare account df6a6c336a69b2f5f62d53e89bcefe22 (login nunrib@sapo.pt), worker script name `blockallisto-media`, workers.dev subdomain `nunrib-df6`.
- The bucket is allPrivate; the ONLY public path is this worker. The worker authenticates to B2 with a read-only application key restricted to namePrefix public/.

## Deployed versions (source files in this package)
| ver | file | bytes | sha256 | deployed | notes |
|-----|------|-------|--------|----------|-------|
| v2 | worker-v2-rollback.js | 2157 | 4a81aa5e91a6532922ad3803c1a3032081cf1aea081c6b0a11812a7f18ad7202 | 2026-11-06 23:13 WET | downloadUrl fix (apiInfo.storageApi nesting), no cache, no CORS |
| v3 | worker-v3-rollback.js | 3181 | 5427ce28239a810477bffea328a3b6b99957f96df013f4fb4479eaa13f8d1177 | 2026-11-06 23:16 WET | + Cache API edge cache, max-age 86400, X-Worker-Cache header |
| v4 | worker-blockallisto-media-v4.js | 3948 | eb52ed0767b861a4019fa22e92ab2d2283b67636c06af2a201b474a2dbcd64cc | 2026-11-06 23:21 WET | + scoped CORS allowlist (staging+demo origins), origin-partitioned cache keys, Vary: Origin |

v4 provenance: pulled live from the Cloudflare API (GET .../workers/scripts/blockallisto-media) on 2026-11-07 00:25 WET and byte-compared to the reviewed draft - identical. Live deploy etag d93103a59389e470737499178c3ef0c64e642193a31ce53f98f0e4530d72802b, modified 2026-11-06T23:21:41Z.

## Worker secrets (names only)
- B2_KEY_ID, B2_KEY = the read-only, prefix-public/ B2 application key ("Backblaze B2 app key - blockallisto-media-public-ro" in the vault).
- Values exist only in the vault and the Cloudflare worker secrets store. Never in code, logs, or responses.

## Deploy / rollback procedure
1. Obtain the scoped API token from the vault ("Cloudflare API token - blockallisto-media-worker-deploy"; permission: Workers Scripts: Edit, this account only, no expiry per user decision 2026-11-06 23:17).
2. PUT https://api.cloudflare.com/client/v4/accounts/df6a6c336a69b2f5f62d53e89bcefe22/workers/scripts/blockallisto-media as multipart form: metadata part = {"main_module":"worker.js","compatibility_date":"2026-11-06"} (type application/json), script part named exactly `worker.js` (type application/javascript+module). The part name must equal the main_module filename.
3. Rollback = PUT any earlier version file from this package the same way. No token or permission change needed.
4. Setting worker secrets after a redeploy is NOT required (secrets persist per script); if ever needed: PUT .../workers/scripts/blockallisto-media/secrets with {"name":"B2_KEY_ID","text":"...","type":"secret_text"}.

## Security properties (current v4)
- GET/HEAD only; other methods 405. Path: decode once, charset whitelist [A-Za-z0-9._/-], reject "..", "//", encoded traversal (400/404). Query string discarded from both the B2 key and the cache key.
- Extension allowlist: svg,png,jpg,jpeg,webp,gif,ico,css,js,woff,woff2,html,json,txt. mp4 and pdf are NOT allowed (404 by construction); extending requires deliberate review (range/MIME/security).
- Fail-closed: B2 miss 404, upstream fault 502, empty error bodies. No redirects, no signed URLs, no listing, no upload. Client headers never forwarded; response rebuilt (Content-Type, Content-Length, Cache-Control, X-Content-Type-Options, plus CORS headers below).
- Edge cache (Cache API): GET only, keyed by origin + decoded path + allowed-Origin marker, TTL bounded by Cache-Control max-age=86400. HEAD is never cached. X-Worker-Cache: hit|miss proves behavior. Safe invalidation relies on VERSIONED asset keys (content-hashed paths); the 24h TTL is the second fence.
- Scoped CORS: Access-Control-Allow-Origin emitted ONLY for exact allowlisted origins (staging + demo site origins; see the source for the current set). No reflection of arbitrary Origin. The allowed Origin is folded into the cache key, so a cached ACAO can never leak across origins (Cache API ignores Vary); Vary: Origin is still set for downstream caches.
- Auth to B2: token fetched server-side (b2_authorize_account v3), cached in isolate memory 2h, handles the apiInfo.storageApi nesting. 401 from B2 triggers one forced re-auth retry.
- Rate/cost ceilings: Workers free plan = 100k requests/day hard stop (Error 1027, no billing escalation). B2 caps shown at $0.00/day (=10GB storage / 1GB bandwidth) and 2,500 Class B/C per day; caps UI not editable without a card (verified). Event notifications (Class D, uncappable) stay OFF. No card on either account.

## Known operational notes
- Cloudflare error 1010 blocks python-urllib user agents on workers.dev; verify with curl or a browser UA.
- Edge cache put->match takes a few seconds per colo; first GETs after a cold start may miss before hits stick. Verify with repeated GETs.
- Dash Monaco editor cannot be driven programmatically; deploy via the API token only.
- The site CSP (staging + demo) currently does not include the media origin; until the writer's CSP cutover ships, browsers block font/fetch loads from the site to the worker (img/link/script work without CORS).
