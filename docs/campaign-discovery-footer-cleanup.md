# Campaign discovery and footer cleanup

Orders 5, 9, 10, 11. Staging candidate only. No contract or database changes.

- Campaign filter is physically left at desktop widths in all 11 locales, including Arabic. Mobile uses a collapsed filter button. Existing instrument dropdown stays.
- Section titles follow the selected status. The known staging-load testing campaign retains its testing provenance instead of changing its data.
- The removed prototype-unavailable paragraph had one renderer, Home.tsx. Its hero.unavailable key was removed from all 11 locale JSON and generated TypeScript catalogs.
- The three removed footer blocks had one shared renderer, Footer.tsx, used across pages: footer.legalPre + legalLink + legalPost, footer.status + statusText, and RiskBanner using riskBanner. RiskBanner had no other consumer, so the component was removed. The six resulting unused keys were removed in all 11 languages, along with the whitespace-baseline entries for those deleted keys. No other page uses these same keys.
- One accessibility test required the old risk banner on every page and was removed. New footer coverage verifies the four link groups, the Risk Disclosure link, 10 social links, and absence of the removed text panel.
- The Legal Risk Disclosure link remains. Other page-specific risk warnings remain.
- Desktop footer now has four balanced link columns. Tablet uses full available text width and a separate decorative band. Mobile keeps the existing expandable groups and social links.

## Validation

- Production build, lint (zero errors, four existing warnings), whole-tree format and i18n projection/whitespace guard pass. All 27,456 translation units across 11 languages match the Weblate JSON round trip. Only JSON was imported, not Weblate history. The 77 retired units are absent.
- All 976 frontend tests in 111 disjoint files pass. Combined coverage passes the unchanged global thresholds: 81.99% lines, 74.64% functions and 76.38% branches.
- Campaign checks cover 11 locales x 2 themes x 5 widths (320, 390, 820, 1280, 1600), all 44 live-contract link targets per context (4,840 pointer checks), and all 15 instrument selections per locale/theme (330 selections). No Learn-only concept cards return to the catalog.
- Footer checks cover the same 110 contexts: four link groups, 10 social links, Risk Disclosure link, absence of the retired blocks, mobile disclosures, and Home callout removal. Desktop checks also require brand and navigation to share one row, with four equal-width columns in every locale. Zero page errors, unexpected requests or horizontal overflow.
- Pixel review found an intrinsic-width-dependent desktop wrap and corrected it using a zero flex basis and min-width: 0, without changing translations or links. The full 242-row visual matrix was rerun after that correction. All-locale light/navy sheets and selected full-size mobile/tablet/desktop screenshots were inspected.

Staging-only release candidate. No contract, registry, database, demo or infrastructure changes. CI, exact archived-image validation and actual-host checks are separate release gates.
