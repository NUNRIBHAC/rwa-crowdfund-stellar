# Illustrative business photos, 22 November 2026

Local candidate only. No photo upload, Pages publication, app release or old-asset deletion is included in this change.

- 44 fictional businesses have 44 mapped covers from 41 distinct stock source pages.
- Every cover has a JPEG fallback plus AVIF/WebP at 480, 800 and 1280 pixels: 308 new immutable keys, 21,734,994 bytes total. The largest file is 393,177 bytes, below the gateway's 1 MiB cap.
- All covers remain explicitly illustrative in every supported language. They are not evidence of an issuer, funded business, assets, ownership or valuation.
- `business-photo-provenance.json` records the source pages, creators, source license, reviewed crop hash and all derivative hashes. Unsplash/Pexels source licenses were checked. No independent third-party clearance is asserted.
- Raw source images are not served. The cargo-bike crop removes background faces, signs and the marked rear frame. The accessibility crop removes the child's face. The electric-bus image shows charging equipment, not an actual minibus fleet. Agricultural/material images do not prove regenerative or reclaimed-material claims. Architectural tile imagery is illustrative, not a claim about ownership of the pictured design.
- Existing assets and metadata remain unchanged. New bytes live under `frontend/media-external/campaigns/businesses-20261122`, outside frontend public output. That directory is excluded from release archives. The build-time gateway index needs only the manifest metadata, not photo bytes.

## Publication gate

Obtain the user's release phrase before any upload or GitHub/release action. The eventual sequence remains private B2 origin, reviewed verified static Pages copy, then the existing same-origin bounded gateway and its Worker/private-B2 fallbacks. Do not hotlink the stock providers, add a public bucket, change CORS, or introduce a VM media copy.

Verify all new keys against B2 and Pages before releasing app code that references them. Preserve all existing published assets. Old image/archive deletion requires a separate exact list and the user's approval. Local route interception proves rendering against the candidate bytes, not live publication or CDN availability.
