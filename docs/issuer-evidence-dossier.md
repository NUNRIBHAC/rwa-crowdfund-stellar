# Issuer evidence dossier: foundation for idea 10

This change is a read-model and API foundation, not a delivered investor dossier, verified issuer database, compliance clearance or investment recommendation. It does not enable real offers, payments or personal advice.

## Current behavior

`GET /api/campaigns/:id/evidence` returns a cache-disabled, campaign-scoped response. With no curated record it returns `not_provided`, no facts and six unknown areas: issuer, team, track record, financials, offer documents and milestones. All existing fictional campaigns remain unknown. The endpoint does not read private issuer applications, upload storage, account records or investor holdings. It fetches no URLs and creates no records.

Operators may prepare `ISSUER_EVIDENCE_JSON` in a separate reviewed change. No environment setting is changed by this PR. Configuration is strict: unknown fields, duplicate IDs, missing references, invalid chronology and malformed records fail closed as `unavailable`, without exposing parser input or partly accepted facts. One invalid record invalidates the whole configured collection.

Every claim needs source IDs. Sources carry title, URL, publisher category, retrieval date and optional publication date. Issuer claims stay labeled `issuer_claim`. A `checked_fact` needs an explicitly dated human review note and at least one source classified as independent. This is a review assertion, not automatic verification. Code cannot prove source independence or truth. It does not infer credit quality from GitHub activity, create scores or certify an issuer. An area with only issuer claims remains unknown.

Source URLs must be HTTPS and must not contain credentials, query strings or fragments. IP literals and obvious local hostnames are rejected. This check is defense in depth, not proof that a document is safe or public. The module makes no network requests, so it is not an SSRF fetcher. A human must check the source is public, relevant, dated and safe to disclose. Do not put signed links, personal data or private application documents in this public configuration.

## Remaining work

- A campaign dossier view with source links, dates, reviewer corrections and clear separation between issuer claims, reviewed facts and unknowns.
- All user-facing labels and errors in the existing 11-language Weblate flow, with mobile/desktop and Arabic text-direction checks. This PR adds no user-facing UI strings.
- A reviewed, genuinely public example source set. Synthetic tests are not evidence about any of the 44 fictional campaigns.
- A permission-controlled editorial workflow if configuration-file review no longer meets the product's needs. No new write permissions are introduced here.

Idea 8's factual guide can use this provenance model later. Idea 9 remains Stellar testnet only. Neither is implemented by this foundation.

No merge or deployment is authorized by publication of this PR.
