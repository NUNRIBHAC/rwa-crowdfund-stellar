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
5. A later human review requires a newly reviewed dossier revision. Do not silently erase a correction or overwrite its source history. The protected editor preparation described below adds explicit human re-review as a new linked claim; this config-only path by itself is not the promised browser workflow.

## Public-source example and remaining limits

`issuer-evidence-public-source-example.md` compares the EIB's shareholder page with the EU institutional directory for one narrow identity statement. It is explicitly documentation only, with no association to any of the fictional campaigns. It is an automated source comparison, not a human reviewer attestation. No human-reviewed fact is fabricated to make the example appear complete. An actual reviewer attestation remains a product sign-off requirement before this example could carry that badge.

Merge remains held pending the existing legal/status translation PRs and a clean verified translation-history integration. The full Weblate head must not be discarded or falsely recorded as merged. No PR 250, 275 or 276 release is authorized here.

Idea 8's factual guide can use this provenance model later. Idea 9 remains Stellar testnet only. Neither is implemented by this foundation.

No merge or deployment is authorized by publication of this PR.

## Protected correction editor candidate (25 November, unpublished)

A local unmerged implementation now persists append-only evidence revisions in
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

Local regression: narrow current-main candidate, 823 backend tests across 98 files,
1,194 frontend tests across 121 files. The preserving dependency analysis graph
with PRs 250/275 and the full translation history passed 823 backend tests and
1,776 frontend tests across 126 files. These are different graphs, not interchangeable
counts. Both public presentation and mounted editor have 264-cell synthetic visual
matrices (11 languages, three widths, light/dark, four states). Synthetic review
fixtures are not real human attestations. The real-source example remains explicitly
unreviewed. No live operator permissions, source records or campaign configuration
were changed by these tests.

The narrow candidate deliberately does not include unrelated pending legal/status
catalogs. The preserving analysis retains the full Weblate branch and dormant
refund text without activating the feature. Before merging main, the exact chosen
release graph still needs current-head translation mergeability and CI checks.
After any approved main merge, Weblate health, ancestry and pending content must
be verified again. This preparation does not authorize a PR merge, deploy or demo.
