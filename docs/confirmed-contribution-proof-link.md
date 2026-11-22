# Confirmed contribution proof link

Approved presentation change, 22 Nov 2026. The saved transaction card shows a "View network proof" link after a successful contribution.

- Only `SUCCESS` + `contribute` with a valid 64-character hexadecimal transaction hash gets the link.
- Destination is the existing Stellar Expert testnet transaction page format. Network is explicitly testnet, not mainnet.
- The link is an anchor styled as a button, opens a new tab, and uses `noopener noreferrer`.
- Eleven localized labels are in the Weblate-facing JSON catalogs and generated TypeScript dictionaries.
- No signature, broadcast, retry, transaction creation, ledger polling, balance write or contract change was added.
- The existing activity/history links are unchanged. This change makes the proof easier to find on the confirmed card itself.

## Validation

- Focused IntentPanel tests: 26 passed, including all 11 locales, pending/failed/cancelled states, malformed hashes and non-contribution actions.
- Full frontend regression: 105 distinct files and 865 distinct tests passed in bounded groups. The combined shell call reached its time limit during the root group, so the 16 not-yet-completed files were rerun separately. Every file has a passing result. This is not a coverage-threshold run.
- Build and i18n JSON/TypeScript checks pass, 22,066 translation units.
- 88 browser checks: 11 locales x 2 existing themes x 4 widths (320, 390, 820, 1280). Expected exact hash destination, external-link attributes, nonempty labels, no page overflow or JavaScript errors.
- Actual screenshots inspected, including all-locale desktop contact sheet and Arabic mobile.

The browser preview used a locally populated confirmed transaction record. It did not change the deployed application or send any transaction. Merge and deployment still require the owner's per-PR phrase.
