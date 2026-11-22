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

- Production build and i18n projection/whitespace guard passed, 21,967 translation units.
- Frontend tests run in bounded groups. All 104 files and 842 tests passed after removing the obsolete banner assertion. The first components run exposed that obsolete assertion; its focused rerun passed. This is not a claim of a coverage-threshold run.
- 11 locales x 5 campaign widths, 242 instrument selections, no horizontal overflow or page JavaScript errors.
- 11 locales x 2 themes x 5 footer widths = 110 checks. All four groups, 10 social links, risk-disclosure link, missing removed blocks, mobile toggles, and home callout absence checked.
- Screenshots inspected: all-locale footer sheets at desktop/tablet/mobile; Arabic desktop footer and left sidebar at 1280.

No deployment. Merge and staging release need the owner's phrase for the specific PR number.
