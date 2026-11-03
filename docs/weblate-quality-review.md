# Weblate quality review (2026-11-03)

## Scope and safe return path

The self-hosted Blockallisto UI and legal components were updated from
`6ad016b` to published `8e295b3`. Both use the same repository. The working tree
was clean before update. Changes were made with Weblate's translation model,
then imported by exact key with the previous value checked, not by replacing
whole locale catalogs. The TypeScript/JSON roundtrip and placeholder contracts
are checked before release. No automatic upstream push is enabled. Repository
commits use `NUNRIBHAC <nunrib@sapo.pt>` only.

## Findings acted on

65 changed string targets:

- 10 stale wallet-login notes incorrectly said the prototype has no password.
- 3 issuer-preview notes retained obsolete directional wording.
- 12 French strings needed punctuation spacing (including 3 legal strings;
  whitespace only, no legal meaning changed).
- 33 loading/submitting/select strings across 11 locales use the ellipsis glyph.
- Arabic share-token symbol label repeated the same word; French search lost
  the name/contract qualification; French opened-column wording did not denote
  a date; Hindi holding-position wording was indistinguishable from status.
- 3 English optional-plural strings were rewritten without `(s)` syntax.

## Contextual checks, not blanket errors

The initial live project displayed 13 needs-editing strings and 966 strings
with checks. These are affected-string counts, not counts of proven defects.
A post-first-pass export contained 1,014 check instances, including overlapping
checks: same 719, multiple-failures 114, inline-markup spacing 57, end-stop 31,
end-ellipsis 30, reused 28, capitalization 13, duplicate 11, begin-space 6,
optional-plural 3, end-colon 2. The 30 end-ellipsis cases were introduced by
normalizing the English source and were then normalized in the targets.

The same-as-source list was reviewed by key and target. Machine IDs, routing
keys and enums must not be translated. Their actual use was checked in Learn,
campaign/profile composition and locale parity tests. These fields are now
excluded from exported catalogs and restored from the English schema during
import: id, group, state, campaignId, instrumentClass, instrumentSeniority,
instrumentOverlays, seniorityStates and profile country codes. Visible country
labels are still translated. Locale-dependent chip composition remains intact.

Names and conventional terms (Soroban, USDC, testnet, Mini Bond, the explicitly
quoted German instrument term), demo company/address examples and dynamic
contact placeholders are intentionally preserved. Identical French/German
words and common loanwords are not evidence of missing translation.

All 28 reused cases were inspected: equivalent status/state labels, time spans
and deadlines can correctly share translations. The French search/date and
Hindi holding cases above were corrected. Repeated numerical groups, German
relative-clause wording and act/act notation explain duplicate checks; the
Arabic symbol label was a real duplicate. The 13 capitalization cases contain
ID or jurisdiction-specific legal-form abbreviations, not stray all-caps prose.
The 6 beginning-space cases are sentence fragments or CJK parenthesized suffixes;
the 2 Hindi colons introduce linked content/identity. German USt-IdNr. ends in
an abbreviation stop. These were not changed merely to clear a counter.

57 markup-boundary checks occur in Hindi (10), Japanese (12), Korean (9) and
Chinese (13 each). A space before/after an English bold phrase is not a universal
rule for these languages. Placeholder/tag structure is checked mechanically;
these warnings remain visible for language review rather than forcing English
spacing. This is not native-speaker or legal approval.

## Remaining coverage

UI JSON includes the public, investor, issuer and operator locale trees; legal
JSON includes the seven documents that have translated sources. Backend
transactional email copy is separate in `backend/src/email-templates.ts` and
was not yet a Weblate component at this checkpoint. Runtime campaign/news/user
content and raw server error codes are not automatically translated by these
catalogs. New unreleased strings require a final post-release Weblate sync.
