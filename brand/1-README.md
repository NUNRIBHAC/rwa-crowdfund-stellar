# Blockallisto - brand package (Fraction identity)

Version 1.4 - October 31, 2026. Built on the Fraction logo direction chosen by Nuno Ribeiro:
an asset (the block) split into tokens that fill up as the crowd funds it, with the next token on its way in.

Tagline: "Real assets. Shared possibilities."

IMPORTANT: draft identity for a prototype. No trademark search or registration has been done on the
name or the mark. Do not use in regulated investor-facing material without legal review.

## Files

logo/svg/          Editable vector logos (SVG)
  blockallisto-mark.svg                    Symbol, color, for light backgrounds
  blockallisto-mark-reversed.svg           Symbol for dark backgrounds (white outline, color tiles)
  blockallisto-mark-mono-ink.svg           Symbol, one color (ink)
  blockallisto-mark-mono-white.svg         Symbol, one color (white, for dark/photo backgrounds)
  blockallisto-mark-small.svg              Simplified symbol for very small sizes (favicons, < 24 px)
  blockallisto-mark-small-white.svg        Same, white
  blockallisto-wordmark.svg                "Blockallisto" text only, two-tone
  blockallisto-wordmark-reversed.svg       Wordmark for dark backgrounds
  blockallisto-wordmark-mono-ink.svg / -mono-white.svg
  blockallisto-lockup-horizontal.svg       Symbol + wordmark side by side (primary logo)
  blockallisto-lockup-stacked.svg          Symbol above wordmark (centered layouts)
  blockallisto-lockup-*-reversed.svg       Dark-background versions
  blockallisto-lockup-*-mono-ink.svg / -mono-white.svg  One-color versions

logo/png/          Ready-to-use transparent PNGs at several sizes (same names as the SVGs)

icons/             Website and app icons
  favicon.svg, favicon.ico, favicon-16/32/48.png
  apple-touch-icon.png (180x180)
  icon-192.png, icon-512.png, icon-512-maskable.png (Android/PWA)
  app-icon-1024.png (app store master)
  avatar-400.png (profile picture)

social/            Social graphics (tagline: "Real assets. Shared possibilities.")
  og-image.png (1200x630, Open Graph / WhatsApp / Facebook link cards)
  x-card.png (1200x600, X/Twitter large card)
  github-social-preview.png (1280x640, set in repo Settings > General > Social preview)
  linkedin-banner.png (1584x396, LinkedIn profile banner)

web/                 Website starters
  site.webmanifest       PWA manifest referencing the icons
  hero-concept.html      Homepage hero concept (self-contained, uses Google Fonts)
  hero-concept-desktop.png / hero-concept-mobile.png   Screenshots of the concept

brand-tokens.css / brand-tokens.json   Design tokens (colors, fonts, radii, spacing,
                                       layout grid, motion, component states)

ui-kit/            Interface foundations for the platform
  components/layout-foundations.svg    Grid (12-col desktop / 4-col mobile, 24px margins),
                                       spacing scale, corner radius scale
  components/buttons-states.svg        Button states: default, hover, active, disabled
                                       (primary Indigo + secondary outline)
  components/form-inputs.svg           Text inputs and checkboxes: normal, focus, error,
                                       disabled
  components/funding-grid-spec.svg     Scaling the token block as a progress grid
                                       (3x3 summaries to 10x10 detail, 1 tile = 1%)
  motion/token-fitting-spec.json       Motion values: global transition, token docking,
                                       loading pulse, reduced-motion behavior

## Logo usage

- Primary logo: horizontal lockup, color version, on paper (#F6F6FE) or white.
- On dark surfaces (ink #14163A or photos): use the reversed versions.
- One-color printing: mono ink (light backgrounds) or mono white (dark). In the mono versions the floating token carries a thin knockout ring in the background color, so its outer contour stays solid and separate from the block corner at any size.
- Below 24 px tall: use mark-small (simplified: no dashed or floating tile).
- Clear space: keep empty space around the logo at least the height of one tile
  (about 1/6 of the symbol height) on all sides.
- In the horizontal lockup the gap between the block and the wordmark was widened
  (~13%) so the two stay readable at very small sizes such as the site navbar.
- Minimum sizes: horizontal lockup 120 px wide, stacked lockup 96 px wide, symbol 16 px.
- Do not: stretch, rotate, recolor, add shadows/effects, rearrange tiles, or place the
  color version on busy or low-contrast backgrounds.

## Colors

Brand
  Ink        #14163A   primary text, outlines, dark surfaces
  Indigo     #4B4FE2   brand primary: buttons, links, highlights (a funded token)
  Indigo 400 #8B8EF0   mid tone (funding in progress)
  Indigo 200 #C7C8F9  pale tone (token not yet funded / dashed placeholder)
  Paper      #F6F6FE   brand background

Extended scale and support colors are in brand-tokens.css.
Text on paper: Ink. Secondary text: Ink 2 (#5A5C75). On dark: white, secondary pale #C7C8F9.

Support (status) colors - success #1DE9B6, warning #FFA726, danger #FF5252: use ONLY in
small badges, chips and labels (e.g. "Funded", "Funding", "Closed"), never on large
surfaces, so they do not compete with the ink + indigo identity. Pair them with ink (#14163A) label text - white text does not have enough contrast on these bright tones.

## Typography

  Montserrat        headings, wordmark. Weights: ExtraBold 800 / Bold 700 / SemiBold 600.
  Inter             interface and body text. Weights: Regular 400 / Medium 500 / SemiBold 600.
  Plus Jakarta Sans key UI figures (Bold 700): estimated return, token value and round
                    progress on asset cards and dashboards - set slightly larger than
                    surrounding text so they stand out immediately.

All three are free and open source (SIL Open Font License). Download: Google Fonts
(Montserrat, Inter, Plus Jakarta Sans).

Wordmark SVGs are already converted to outlines, so they render correctly without the fonts.

## Homepage hero (concept)

Suggested layout: left-aligned headline using the tagline ("Real assets." ink,
"Shared possibilities." indigo), short sub-copy, primary + secondary buttons, and an
asset card on the right that reuses the token tiles as a funding-progress grid.
See web/hero-concept.html - a suggestion only; the live site is unchanged.

## The symbol

A rounded block (the asset) containing a 3x3 grid of tokens. Solid indigo tokens are funded,
lighter tones show funding in progress, the dashed token is the one still open, and the small
tile arriving at the corner is the next investor joining. Keep this reading when animating or
adapting the mark.

## Animating the symbol

If the mark is animated on the site (CSS or Lottie), the floating tile docks into the open
slot along a single straight vector - measured in the 240-unit viewBox of the SVG sources:

  start : tile 36x36 px, rotated 12 degrees, center at (214, 26) - the corner orbit position
  end   : tile 40x40 px, rotation 0 degrees, center at (170, 70) - the dashed slot
  path  : translate(-44, +44), a straight 45-degree slide, while de-rotating 12 -> 0 degrees
          and scaling 36 -> 40 px

The dashed slot is centered exactly on that vector, so the tile lands flush on the dashed
outline with no curve or waypoint. Keep the tile above the block outline during the slide so
it reads as arriving from outside.


## UI layout foundations

- Layout grid: flexible 12-column grid on desktop, 4 columns on mobile, with fixed 24px
  side margins on both (24px gutters desktop, 16px mobile; content max width 1280px, centered).
- Spacing scale (4px base): space-4, 8, 12, 16, 24, 32. These are the only allowed
  margin/padding values - no arbitrary spacing.
- Corner radius scale:
    radius-sm  4px   checkboxes, tags, small badges
    radius-md  8px   buttons, text inputs
    radius-lg  16px  asset cards (e.g. the Riverside Apartments card), dropdown menus
    radius-xl  24px  modals, large interface contours (dashboard blocks)
  The logo keeps its own relative radii (tile 22.5%, block 14.1%); the two systems coexist.
- Diagram: ui-kit/components/layout-foundations.svg.

## Component states

Buttons (ui-kit/components/buttons-states.svg):
- Primary (Indigo #4B4FE2, white text): hover #363AB2, active #24278F,
  disabled = 40% opacity with cursor: not-allowed (the gated state, e.g. while
  verification/KYC is not approved).
- Secondary (e.g. "How it works"): outline style - 1.5px ink border on transparent;
  hover gains a faint Paper (#F6F6FE) fill, active #E6E6FB, disabled 40% opacity.
- Shared: radius-md 8px, padding 12px 24px, Inter SemiBold 15px,
  transition all 200ms cubic-bezier(0.4, 0, 0.2, 1).
- Keyboard accessibility: a visible focus ring (2px indigo, 2px offset) on :focus-visible.

Form inputs (ui-kit/components/form-inputs.svg):
- Normal: 1px border Indigo 500 (#7376E8) - the accessible control boundary (3.8:1 on
  white). Indigo 200 (#C7C8F9) stays in the palette as the brand tint for placeholder
  fills, not for control outlines.
- Focus: 1.5px Indigo border with a soft indigo ring (0 0 0 3px at 12%).
- Error: 1.5px Danger (#FF5252) border, with helper text in the darker accessible
  danger-text #D32F2F (4.9:1 on white), an error icon and an explicit "Error:" label -
  never color alone. Disabled: paper fill, tertiary text.
- Fields use radius-md 8px and padding 12px 16px; checkboxes use radius-sm 4px at 18px.
- Investment amounts in USDC are illustrative interface copy for the production
  platform design.

## Motion

Design specifications for the production platform - none of this is implemented, in the
package or on the site. The current testnet prototype records contribution confirmations
only; there are no real purchases, so the success and loading animations below describe
future product behavior.

Full machine-readable values: ui-kit/motion/token-fitting-spec.json.
- Global: every button, hover and input transition runs all 200ms cubic-bezier(0.4, 0, 0.2, 1).
- Loading state: while the platform refreshes live data from the Stellar network, the open
  (dashed) token pulses its opacity between 40% and 100% in Indigo 200
  (1.2s ease-in-out, infinite alternate). CSS: the bl-token-pulse keyframes in
  brand-tokens.css.
- Purchase success ("fund token"): the floating corner tile docks into the open slot exactly
  as specified in "Animating the symbol" below (straight -44/+44 slide, de-rotate 12 -> 0
  degrees, scale 36 -> 40 px, about 700ms), and on landing its fill settles from
  Indigo 400 (#8B8EF0) to solid Indigo (#4B4FE2) over 200ms.
- Reduced motion: under prefers-reduced-motion, replace the slide with a 200ms fade, keep
  the dashed token at full opacity (no pulse), and keep the 200ms color transitions.

## Data and dashboard components

- Asset grid (funding progress): reuse the token block as a scalable grid -
  3x3 for cards and quick summaries, 10x10 (100 tiles) on project detail pages where
  1 tile = 1% funded. Scaling ratios, fill order (bottom row first, left to right, upward)
  and token states: ui-kit/components/funding-grid-spec.svg.
- Charts (accumulated yield lines): thin 2px Indigo (#4B4FE2) lines on clean Paper
  (#F6F6FE) backgrounds; no 3D effects, heavy shadows or grid clutter. Key figures stay
  Plus Jakarta Sans Bold, slightly larger than surrounding text.
- These dashboard patterns (KYC gating, USDC amounts, yield charts) describe the
  production platform this identity is designed toward. The current testnet prototype
  records contributions only - no real funds, ownership tokens, secondary liquidity or
  custody - so treat every financial figure in these files as illustrative.

## Changes in 1.4

- New ui-kit/ folder: layout foundations, button states, form input states, funding grid
  scaling spec (SVG spec sheets) and the token motion spec (JSON).
- Accessible companions labeled alongside the brand swatches: Indigo 500 #7376E8 for
  control boundaries (Indigo 200 stays the placeholder tint) and danger-text #D32F2F for
  error text with icon + explicit label (Danger #FF5252 stays for borders/badges).
- brand-tokens.css / .json extended: spacing scale, layout grid, radius scale, motion
  values, button/input component tokens, focus ring and reduced-motion behavior.

## Changes in 1.3

- og-image.png / x-card.png: tagline lowered 5 px, balancing the space between the wordmark
  and the tagline against the space below it.
- Animation docking spec for the mark documented above.
