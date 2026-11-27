# Issuer evidence dossier: public presentation and protected correction workflow

This change provides a read model, public API and localized campaign dossier presentation. It is not a verified issuer database, compliance clearance or investment recommendation. It does not enable real offers, payments or personal advice.

## Current behavior

`GET /api/campaigns/:id/evidence` returns a cache-disabled, campaign-scoped response. With no curated record it returns `not_provided`, no facts and six unknown areas: issuer, team, track record, financials, offer documents and milestones. All existing fictional campaigns remain unknown. The endpoint does not read private issuer applications, upload storage, account records or investor holdings. It fetches no URLs and creates no records.

Operators may prepare `ISSUER_EVIDENCE_JSON` in a separate reviewed change. No environment setting is changed by this PR. Configuration is strict: unknown fields, duplicate IDs, missing references, invalid chronology and malformed records fail closed as `unavailable`, without exposing parser input or partly accepted facts. One invalid record invalidates the whole configured collection.

Every claim needs source IDs. Sources carry title, URL, publisher category, retrieval date and optional publication date. Issuer claims stay labeled `issuer_claim`. A `checked_fact` needs an explicitly dated human review note and at least one source classified as independent. This is a review assertion, not automatic verification. Code cannot prove source independence or truth. It does not infer credit quality from GitHub activity, create scores or certify an issuer. An area with only issuer claims remains unknown.

Source URLs must be HTTPS and must not contain credentials, query strings or fragments. IP literals and obvious local hostnames are rejected. This check is defense in depth, not proof that a document is safe or public. The module makes no network requests, so it is not an SSRF fetcher. A human must check the source is public, relevant, dated and safe to disclose. Do not put signed links, personal data or private application documents in this public configuration.

## Campaign view and correction review

The campaign page reads only the public evidence endpoint. Loading, missing and unavailable responses have distinct localized states. Claims, source classification, retrieval/publication dates, reviewer notes, corrections and unknown areas are shown separately. All 11 languages come from the approved Weblate batch. Arabic text is RTL without mirroring the page geometry. The view has no editing or approval controls and never reads private issuer applications.

The reviewed configuration path remains available for seeds. The protected browser editor described below uses the existing authenticated operator permission, not a new grant:

1. Prepare a new version of the public configuration offline. Retain the original claim and review. Add a unique correction ID, affected claim ID, correction date, reason and public source IDs.
2. Confirm sources are public, safe to disclose and relevant. Check the correction date is no earlier than the original review and no later than the dossier revision. The validator rejects duplicate IDs, missing references and invalid chronology.
3. Run the evidence model tests and review the exact configuration diff. A recorded correction hides the original reviewed-fact badge and makes its area unknown. Original claim, review and correction provenance remain visible.
4. Ask for the normal reviewed release approval before changing live configuration. This PR does not change an environment setting. There is no automatic publication or remote write from this workflow.
5. A later human review requires a newly reviewed dossier revision. Do not silently erase a correction or overwrite its source history. The protected editor described below adds explicit human re-review as a new linked claim; this config-only path by itself is not the promised browser workflow.

## Current shipped state and separate assistant example

The public presentation and protected correction editor shipped through PR 276,
with the public route correction in PR 285 and Arabic correction in PR 286.
They are not awaiting their original merge. The 23 public and 23 editor labels
are present in all 11 languages. Existing fictional campaigns remain
`not_provided` with six unknown areas; no real issuer evidence was seeded.

`issuer-evidence-public-source-example.md` now documents the real Kipster KIIS
example. The prepared `AssistantDocumentaryReview` section on For Investors is
separate from campaign facts and human-review badges. It names the assistant,
source provenance, review date, five findings, coverage and unresolved issues.
It is not a professional attestation and does not need one to be presented as an
assistant review. A `checked_fact` still requires the existing human review.

The separate factual information guide is already implemented. The Stellar
features remain testnet-only. This documentation change does not authorize a
merge, deployment, demo, live operator grant or configuration change.

## Protected correction editor, shipped

The implementation persists append-only evidence revisions in
CommunityStore. The write route uses the existing wallet-session/operator
allowlist, checks campaign registration and never changes live grants or env.
Revision digests reject stale edits. Request IDs fence retries. Each saved
revision and its operator audit entry commit together. Public reads use the latest
validated persisted revision, falling back to the configured seed only before the
first edit. No private application documents are read or copied.

A correction retains the original claim and review. An explicit human-reviewed
replacement is a new claim linked to the corrected original, not a silent edit.
The operator must attest personally to the review. The operator designation proves
wallet access, not professional identity. Existing public sources can be selected, or a new public HTTPS source can be appended in the same atomic update. The new source must have been checked today, is immutable once saved, and rejects credentials, query strings, fragments and private-looking hosts.

The browser editor is mounted in the existing account operator section. It previews
an update before explicit publication, masks server errors, checks the selected
campaign/session scope and reuses a request ID for a retry. Its 23 labels in all
11 languages came through the separately approved Weblate batch. The public
campaign presentation has no editing controls.

The original preparation used synthetic visual matrices for the public view and
mounted editor. Synthetic reviews are test fixtures, not real attestations. The
real Kipster source example never creates a human-reviewed claim. Current PR
validation must be recorded against its exact head rather than reusing old test
counts. No live operator permissions, source records or campaign configuration
are changed by the documentary example.
