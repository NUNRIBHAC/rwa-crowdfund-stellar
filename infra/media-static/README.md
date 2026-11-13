# Static public media and independent reserve

Status: the static Pages snapshot was deployed on 2026-11-13. The app cutover and independent VM reserve are prepared, not deployed. The observed Pages origin is `https://blockallisto-public-media.pages.dev`. All 583 asset responses were HTTP 200 and SHA-256 matched the local export; the remote checksums file also matched its local hash. No Functions were uploaded.

## Public-only export

`node infra/media-static/export.mjs NEW_DIRECTORY` builds an offline snapshot of public media. The manifest records original source files, lengths and SHA-256 hashes. It includes 558 B2 public object keys (548 from the 00:03 UTC inventory plus 10 architecture objects verified again at 04:42 UTC) and 25 compatibility aliases. It is not a live B2 synchronization job.

Every source is verified before output. Unknown keys fail closed. The export contains no credentials, private uploads, `functions/` directory or `_worker.js`. Font CSS absolute Worker URLs become relative URLs so both hosts work without the Worker. `checksums.json` describes the exported bytes, including those deliberate CSS rewrites. `_headers` permits cross-origin reads of these already-public assets and sets a bounded 24-hour browser cache. The largest asset is below Pages' 25 MiB limit.

Keep B2 unchanged as the upstream archive. When adding or replacing public media, update and review the source manifest and regenerate both static copies. No bucket deletion or private-bucket access change is part of this work.

## Pages primary

Create a **Pages Direct Upload** project, not a Worker or Pages Functions project. Stop if the UI requests a card, upgrade or paid plan. Upload only the generated directory. Static requests are free and unlimited; Functions share the Worker request quota and must stay absent.

After creation, record its exact observed HTTPS host. Build with `VITE_PUBLIC_MEDIA_ORIGIN=https://ACTUAL_HOST` and set the backend's existing `MEDIA_ORIGIN` to that exact origin. The build applies this one base to TS/JS, CSS and HTML. CSP permits that exact origin only for images and fonts. Do not add wildcards, remote scripts or general `connect-src` permission. Confirm exported checksums through the created host before approving a site release.

The frontend and Docker defaults now use the verified Pages origin. `VITE_PUBLIC_MEDIA_ORIGIN` still permits an explicit build override. Docker runtime `MEDIA_ORIGIN` defaults to Pages, but an existing environment file can override it: staging must explicitly replace its old Worker value at the approved release. The server outside Docker keeps its existing self-only CSP when the variable is unset. A prepared default is not proof of app cutover.

## Independent Oracle reserve

The verified export has 583 public assets plus the checksums file and `_headers`: 22,513,376 bytes of file content, 22,628,064 bytes (22.63 MB) including directory metadata in the prepared tree, and 23,945,216 allocated bytes on the preparation filesystem. Check actual allocation on the target filesystem rather than assuming that last number. With separate staging release approval, copy the verified export into a versioned directory under `/var/oled/public-media/`, retaining disk safety gates. Mount that directory read-only into the **staging** container at `/public-media` and set `PUBLIC_MEDIA_DIR=/public-media`. Do not bind a directory containing private documents, backups or secrets. The production host serves it at `/media/`; unknown paths and dotfiles do not fall through to SPA HTML. No media is copied into app images. Demo requires its own release approval.

Release gates: re-read current staging identity and disk state; require at least 3 GiB free on both `/` and `/var/oled` before transfer, after extraction, before build/switch and after deployment. Stop if a gate fails, without extra cleanup or cache relocation. Verify every exported file checksum after copying, before binding it. Keep the reserve outside app images and private-data mounts. Build and test the integration with current main, then change only staging's exact `MEDIA_ORIGIN`, `PUBLIC_MEDIA_DIR` and read-only media mount. Verify the real SPA, API failures, assets, CSP, Pages-primary and forced-unavailable modes before completion. Preserve the current-only root image and immediately-previous archive retention rule. No demo deployment, DNS change, paid service or Cloudflare settings change belongs to that approval.

Images retry the same path once against `/media/` on HTTP/network failure or after eight seconds. The capture-phase handler prevents an old component from selecting a second asset on the same failed host. A changed theme/source can receive a fresh retry. Lazy-image clocks start only when the image reaches the viewport. A second failure never loops back to Pages.

Font CSS contains the local reserve as its second source. For a stalled primary, after eight seconds the app replaces app font-face sources and adds a generated same-origin reserve sheet with the same face descriptors. Loaded local faces render even if the browser retains old pending font requests in FontFaceSet bookkeeping. This does not retry the primary repeatedly. Favicons and PWA icons use the same-origin reserve directly because non-JavaScript consumers cannot run the image error handler. Social preview metadata uses the configured Pages host; remote crawlers cannot perform client failover.

## Visual CI

All visual specs use `e2e-visual/fixtures.ts`. It intercepts media requests before network access and serves the same hash-verified source bytes, with the deliberate relative CSS rewrite. Missing assets fail the test; they never fall back to a live request. APIs remain synthetic as before. No quota change, workflow disable or weaker screenshot matrix is needed.

The fixture is not a live CDN availability test. Keep a small, explicit post-release browser check for Pages-primary and primary-unavailable modes on the real app, including Arabic RTL, both themes and mobile/desktop widths.

Official references:

- https://developers.cloudflare.com/pages/functions/pricing/
- https://developers.cloudflare.com/pages/platform/limits/
- https://developers.cloudflare.com/pages/get-started/direct-upload/
