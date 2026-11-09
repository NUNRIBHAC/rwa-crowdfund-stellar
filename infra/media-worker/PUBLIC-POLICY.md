# public/ bucket policy (media worker)

The media worker serves ONLY objects under the `public/` bucket prefix.
Therefore every object under `public/` is world-readable by construction.

Rules:

- NEVER place non-public objects under `public/` (no secrets, no PII, no
  drafts, no backups, no credentials). If it is under public/, assume it is
  already public forever (edge caches may hold copies for 24h).
- Non-public data belongs under a different prefix the worker never maps
  (the worker hard-fails any request outside its fixed mapping + SAFE
  allowlist, and all constructed keys start with the constant `public/`).
- The SAFE regex intentionally rejects spaces and `%` in _request_ paths.
  Folder names containing spaces (e.g. `social icons/`) are reachable only
  through the fixed mapping constants in worker.js (`/social/<file>`),
  never directly (`/social%20icons/<file>` is 404 by design).

## Current layout (as of commit 786693d)

    public/
      social/            og-image.png (carve-out: /social/og-image.png AND /og-image.png)
      social icons/      9 social SVGs + linkedin.png, via /social/<file>
      icons/             favicons, apple-touch-icon, PWA icons (root favicon URLs map here)
      animations/        about-accumulation.svg, faq-question.svg (root URLs map here)
      logo/              blockallisto-lockup-horizontal(-reversed).svg (root URLs map here)
      campaigns/         demo-solar-farm.jpg (root URL maps here)
      fonts/             woff2 + CSS + licenses (passthrough)
      illustrative-covers/, (other folders passthrough 1:1)

Cache: 200s cached 24h at the edge; 404s are never cached. The cache key is
origin+path (+origin for allowlisted CORS origins) - query strings do not
bust the cache.
