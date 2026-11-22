# Non-Latin self-hosted fonts

This change activates existing OFL-licensed font objects for Japanese, Korean, Simplified Chinese, Traditional Chinese, Arabic and Hindi. It adds no font binaries, uploads, paid service, media origin or account setting. The existing public-media build plugin rewrites the source URLs to Cloudflare Pages and adds the existing same-origin media gateway fallback.

## Families and roles

| Locale | Body                 | Display          | Figures / Latin                                       |
| ------ | -------------------- | ---------------- | ----------------------------------------------------- |
| ja     | Noto Sans JP         | Noto Sans JP     | Existing Inter / Montserrat / Plus Jakarta Sans first |
| ko     | Noto Sans KR         | Noto Sans KR     | Existing brand fonts first                            |
| zh-CN  | Noto Sans SC         | Noto Sans SC     | Existing brand fonts first                            |
| zh-TW  | Noto Sans TC         | Noto Sans TC     | Existing brand fonts first                            |
| ar     | Noto Sans Arabic     | Noto Kufi Arabic | Existing brand fonts first                            |
| hi     | Noto Sans Devanagari | Poppins          | Existing brand fonts first                            |

Latin text and digits retain the brand stacks. Regional CJK families are selected by the current `html.lang`, rather than sharing an arbitrary Han fallback. The six locale rules can be disabled locally for comparison by setting `data-fonts-l10n="off"` on `html`. No runtime toggle or new preference is introduced.

All 485 face declarations use `font-display: swap`, normal style and the upstream Unicode slices. CJK and Noto Arabic/Devanagari files have a real 100-900 variable weight axis. The CSS activates 400-900; current UI weights 400-800 are covered. Poppins uses separate 400/500/600/700/800 files. No synthetic-bold claim is based on the internal font name, which may still contain "Thin" for a variable face.

## Evidence on main a5ba5229

The candidate production CSS was substituted locally into the live staging application. JavaScript, backend, content and live deployment were not replaced. These are browser preview checks, not a deployment or a native-speaker readability certification.

- 24 before/after page pairs: six locales on home, campaign registry, donation detail and account.
- 72 responsive checks: six locales, 320/390/820/1280px, home/detail/account. No horizontal document overflow. Desktop and 390px page images inspected.
- Actual rendered heading glyphs inspected with the browser's platform-font data: JP, KR, SC, TC, Kufi Arabic and Poppins custom fonts were used, rather than merely appearing in computed CSS.
- Offline cmap union covers all target-script characters in the current locale source files: ja 808, ko 562, zh-CN 938, zh-TW 968, ar 48, hi 61. Zero missing in this bounded set. This does not promise all future text or every Unicode character.
- Arabic joined text and Hindi conjunct probes inspected at 400/500/600/700/800 with synthesis disabled. Selected Kufi/Poppins display compared on the actual home page against Noto Sans Arabic/Devanagari display alternatives. Selected pair is visually closer to the existing heavy geometric heading role, not proven universally best.
- Existing Arabic local mirroring rules preserved. Global `html.dir` remains LTR, as before this change.
- Font failure simulated for all six locales. Text remains visible using system fallback. No promise that an arbitrary device's fallback covers every script.
- Five Latin Learn-page before/after comparisons: pt/es/fr pixel-identical; en/de differed by only 5/19 pixels respectively, with no text or layout change seen. Do not call all five pixel-identical.
- No JavaScript errors in the 24-pair run. Font requests for the activated families returned 200 from the existing Pages host. Activated-family response hashes matched the archived font files. Some repeated response bodies were unavailable after navigation, so the report does not claim every repeated network response was hashed.

## Size budget and free-service scope

No font file is added to the repository's exported build or to the media hosts. Existing font archive remains excluded from `git archive`. The production CSS grows from 82,140 bytes to about 565,920 bytes, about 128KB additional gzip. The gateway-only emergency sheet also includes the locale faces. Neither sheet eagerly downloads every font slice.

Unique font-body bytes observed across the four-route cold browser run, including existing brand fonts:

| Locale |     Bytes | Unique URLs |
| ------ | --------: | ----------: |
| ja     | 1,305,084 |          47 |
| ko     |   668,476 |          20 |
| zh-CN  | 1,371,664 |          22 |
| zh-TW  | 1,608,244 |          23 |
| ar     |   711,584 |           8 |
| hi     |   659,476 |          10 |

Budget for this measured route set: at most 1.7MB unique font bodies per locale and 160KB gzip main CSS. This is an observed route-set budget, not a universal site maximum or wire-transfer measurement. Responses can be reused by browser cache; repeated navigation counts must not be added as if all bytes were transferred cold again.

Staging disk checked before work: over 5GB free on root and OLED after PR261. This PR adds no font binaries to the VM image. Cloudflare Pages static asset requests are documented as free and unlimited; Free projects support 20,000 files and 25MiB per file. No files or Functions are added here. Existing gateway/Worker/B2 fallback budgets remain unchanged and bounded, not claimed unlimited.

## Sources

- Noto use and script/family guidance: https://fonts.google.com/noto/use
- Regional CJK deployment formats: https://github.com/googlefonts/noto-cjk/blob/main/Sans/README.md
- Arabic project and license: https://github.com/notofonts/arabic/
- Devanagari project and license: https://github.com/notofonts/devanagari
- Poppins license: https://github.com/google/fonts/blob/main/ofl/poppins/OFL.txt
- Font license texts are also preserved under `assets/fonts/licenses/` in the full clone, not in the deployment archive.
- Pages static asset pricing: https://developers.cloudflare.com/pages/functions/pricing/
- Pages file limits: https://developers.cloudflare.com/pages/platform/limits/
- B2 pricing, only relevant to the existing fallback: https://www.backblaze.com/cloud-storage/pricing

## Tests and remaining gate

Frontend 825/825 tests including nine new CSS contract cases; UI-kit 14/14; production build, formatting and translation sync pass locally. Backend sources are unchanged. Full local backend attempts exceeded the command time limit and are not reported as passed; fresh CI is required. No merge or staging deployment is part of this PR.
