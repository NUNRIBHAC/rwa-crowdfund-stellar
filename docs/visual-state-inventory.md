# Visual state inventory

Source baseline: main a8dd9864aab154695acf0d170a8a63b0b13164c6 (merged PR289), 26 November 2026. Discovery repeated against this baseline, with the test-only changes in this PR. `playwright test --list` lists 1,941 tests in 12 files. These are test cases, not 1,941 routes, screenshots, viewport contexts or hosted comparisons. Some tests visit several routes or iterate states and widths internally.

| Suite                   | Listed tests | Explicit scope                                                                                                                                                    |
| ----------------------- | -----------: | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| captures                |          924 | 28 canonical route entries including unknown-path 404, 11 locales, widths 390/820/1440, light, signed out, synthetic API                                          |
| issuer-evidence-local   |          264 | 11 locales, 3 widths, light/dark, not_provided/unavailable/issuer_claim/corrected; public campaign evidence fixture                                               |
| operator-evidence-local |          264 | 11 locales, 3 widths, light/dark, edit/preview/error/saved; synthetic editor session, never actual operator authority                                             |
| card-actions            |           88 | 11 locales, widths 320/390/820/1440, live-shaped and default-preview fixtures; home and campaigns inside each test                                                |
| sample-contract-pointer |           88 | 11 locales, 4 widths, light/navy; preview pointer-target geometry                                                                                                 |
| payment-path-local      |           67 | 66 locale/3-width/light-dark payment-path cases, plus one exact-cache/reload regression; contribution/refund/withdraw iterated internally, not real payment proof |
| information-guide-local |           66 | 11 locales, 3 widths, light/dark; investor guide fixture                                                                                                          |
| tile-wall-local         |           66 | 11 locales, 3 widths, dark/light; tile-wall fixture                                                                                                               |
| investor-anchors        |           44 | 11 locales, light/navy, widths 390/1280; investor links to signed-out account anchors, not authenticated investor dashboards                                      |
| journey-actions         |           44 | 11 locales, widths 320/390/820/1440, light; investor/issuer CTA geometry inside each test                                                                         |
| status-labels           |           22 | 11 locales, light/navy; widths 320/390/820/1280/1600 and known/unknown status cases iterated internally, synthetic account session                                |
| illustration-contrast   |            4 | English, light/navy, widths 390/1280; hover/active/focus/rest contrast states iterated internally                                                                 |
| **Total**               |    **1,941** | All above use local fixture APIs/media, not actual account/provider data                                                                                          |

## Parity and remaining boundaries

- Route-name parity already has a test in `frontend/src/visual-routes.test.ts`: every declared RouteName appears exactly once in PUBLIC_PAGES, all 11 locales match, widths are explicit. No duplicate route-capture implementation is needed.
- Authenticated editor and account-status fixtures exist. It is wrong to call all protected states absent.
- This inventory is not an exhaustive permission/role/form/workflow state map. Email verification, MFA, deletion, support, applications, documents and every operator decision are not certified covered by this matrix. Unit/integration coverage elsewhere must be assessed separately before declaring a visual gap solved.
- Dark/navy coverage is suite-specific. Public 28-route matrix is light only. `dark` and `navy` are the literal values used by different suites here, not assumed equivalent.
- 320/1280/1600 checks exist in named geometry suites, not across all public routes.
- Local synthetic session flags are not live authentication, wallet extension signing, native device gestures or a financial/legal attestation.
- Test discovery and a passing run do not prove actual pixel quality or a reviewed hosted Argos baseline. The already completed PR289 run separately passed 1,941 cases; this pass only lists and reconciles them. PR-triggered uploads remain skipped by design.
- This document changes no visual behavior, screenshot baseline, fixture or capture count. A future state expansion must name exact routes, roles, states, themes, locales and widths instead of relabelling existing tests as complete coverage.

## Prepared assistant documentary example extension

Based on main 806ae365626b83e732cc1c7de5b5a03f977376fe (PR290), this
candidate adds `assistant-documentary-review-local`: 66 tests, 11 locales ×
390/820/1440 × light/dark, on the existing For Investors route. Each checks
five findings, six source links, no write requests, no runtime errors, no
horizontal overflow and Arabic text direction with fixed list geometry.
Discovery is now 2,007 tests across 13 files. No route was added and the
28-route light-only public capture matrix is unchanged. These are local
synthetic-API presentation checks, not a human review or hosted release proof.
