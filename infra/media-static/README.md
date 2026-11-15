# Static public media and fallback migration

Status, 15 November 2026: Pages is the authoritative published copy. The current
staging release still uses an old read-only VM reserve. The selected target is
Pages -> Worker/private B2 -> server-side temporary B2 download authorization.
It has no VM media copy and no public bucket or browser bearer token. The local
[replacement design](./FALLBACK-DESIGN.md) is not deployed. Do not merge the
performance release while its runtime fallback still reads the old directory.

## Public-only export

`node infra/media-static/export.mjs NEW_DIRECTORY` builds an offline snapshot of public media. The manifest records original source files, lengths and SHA-256 hashes. It includes 558 B2 public object keys (548 from the 00:03 UTC inventory plus 10 architecture objects verified again at 04:42 UTC) and 25 compatibility aliases. It is not a live B2 synchronization job.

Every source is verified before output. Unknown keys fail closed. The export contains no credentials, private uploads, `functions/` directory or `_worker.js`. Font CSS absolute Worker URLs become relative URLs so both hosts work without the Worker. `checksums.json` describes the exported bytes, including those deliberate CSS rewrites. `_headers` permits cross-origin reads of these already-public assets and sets a bounded 24-hour browser cache. The largest asset is below Pages' 25 MiB limit.

Pages is the correct published copy. Treat B2 as its private upstream, not the
obsolete VM copy as a comparison baseline. New public media needs a separate
approved B2 write followed by a reviewed Pages update. The six campaign image derivatives were published to B2 and then Pages on
15 November 2026. All 589 live asset responses matched their reviewed hashes;
the previous 583 assets were unchanged. No other media write is included. No bucket deletion or publicity/CORS change is
part of the proposed server-side fallback.

## Pages primary

Create a **Pages Direct Upload** project, not a Worker or Pages Functions project. Stop if the UI requests a card, upgrade or paid plan. Upload only the generated directory. Static requests are free and unlimited; Functions share the Worker request quota and must stay absent.

After creation, record its exact observed HTTPS host. Build with `VITE_PUBLIC_MEDIA_ORIGIN=https://ACTUAL_HOST` and set the backend's existing `MEDIA_ORIGIN` to that exact origin. The build applies this one base to TS/JS, CSS and HTML. CSP permits that exact origin only for images and fonts. Do not add wildcards, remote scripts or general `connect-src` permission. Confirm exported checksums through the created host before approving a site release.

The frontend and Docker defaults now use the verified Pages origin. `VITE_PUBLIC_MEDIA_ORIGIN` still permits an explicit build override. Docker runtime `MEDIA_ORIGIN` defaults to Pages, but an existing environment file can override it: staging must explicitly replace its old Worker value at the approved release. The server outside Docker keeps its existing self-only CSP when the variable is unset. A prepared default is not proof of app cutover.

## Replace the obsolete VM reserve

The deployed `/media/` route still reads a mounted directory. The local
replacement now uses the bounded gateway in
[FALLBACK-DESIGN.md](./FALLBACK-DESIGN.md), with production integration tests.
Remove the old mount and `PUBLIC_MEDIA_DIR` only during an approved staging
release. Keep the URL as a gateway, not a stored media copy. Font secondary
sources, image timeout handlers, HTML favicons and PWA icons must all use the
new chain. No media files belong in the runtime image.

The ten canonical social paths with spaces and three root PWA aliases require
the exact reviewed mappings in the design. The Worker also needs AVIF support.
Those are local code candidates only, not live Worker changes. The six media
files are already present in B2 and Pages. Both app and Worker
changes need their own release checks; the existing demo app must stay unchanged.

Release gates: verify the final chain and Pages integrity, require at least
3 GiB free on `/` and `/var/oled` and the approved build reserve before work,
rerun full tests/CI, and exercise the real SPA with forced failures. Temporary
B2 authorization covers a Worker outage/quota, never the B2 account caps.
Keep $0 caps and fail closed at the approved durable direct-download budget.
No new CORS rule is needed when the authorization stays server-side.

After the approved gateway is live, staging no longer uses its mount and the
forced final leg works, delete only the explicitly approved obsolete media
directory. No archive, extra copy, unrelated cleanup or demo deployment.
Deletion is still held. The obsolete copy needs no further B2 content audit.

## Visual CI

All visual specs use `e2e-visual/fixtures.ts`. It intercepts media requests before network access and serves the same hash-verified source bytes, with the deliberate relative CSS rewrite. Missing assets fail the test; they never fall back to a live request. APIs remain synthetic as before. No quota change, workflow disable or weaker screenshot matrix is needed.

The fixture is not a live CDN availability test. Keep a small, explicit post-release browser check for Pages-primary and primary-unavailable modes on the real app, including Arabic RTL, both themes and mobile/desktop widths.

Official references:

- https://developers.cloudflare.com/pages/functions/pricing/
- https://developers.cloudflare.com/pages/platform/limits/
- https://developers.cloudflare.com/pages/get-started/direct-upload/

## Media-only publication receipt, 15 November 2026

Exactly six AVIF/WebP derivatives (480/800/1280) were added to B2 under
`public/campaigns/`, then to Pages. No existing B2 key was overwritten.
Pages deployment `ac01b8b4-5080-4c0d-a625-24ddaf34e511` is static, no Functions.
All 589 assets were downloaded and verified, including all 583 previous assets
unchanged. Existing `fonts/SHA256SUMS.txt` was preserved deliberately, not
corrected as part of a six-image-only approval.

- https://blockallisto-public-media.pages.dev/checksums.json
- https://dash.cloudflare.com/df6a6c336a69b2f5f62d53e89bcefe22/pages/view/blockallisto-public-media/ac01b8b4-5080-4c0d-a625-24ddaf34e511

This is a media publication, not an app/Worker deployment or VM deletion.
