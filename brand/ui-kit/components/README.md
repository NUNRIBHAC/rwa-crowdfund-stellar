# Blockallisto UI kit - components

Component library for the Blockallisto platform, built on the Fraction brand
identity (see `brand/README.md` and `brand/brand-tokens.css` for tokens).
All component text and docs are in English, like the rest of the repo.

## Structure

```
components/
  buttons/         Button states spec (default, hover, active, disabled)
    buttons-states.svg
  forms/           Form inputs spec (normal, focus, error, disabled)
    form-inputs.svg
  funding-grid/    Funding grid spec (3x3 summary, 10x10 detail, 1 tile = 1%)
    funding-grid-spec.svg
  layout/          Layout foundations spec (12-col/4-col grid, spacing, radii)
    layout-foundations.svg
  cards/
    AssetCard.tsx        Asset card (React + TypeScript) - funding progress
    AssetCard.css        renders the exact number of filled blocks computed
    funding-math.ts      from the on-chain raised/goal values (BigInt, exact)
    funding-math.test.ts regression tests (node:test, no dependencies)
    README.md
  feedback/
    StatusBadge.tsx      Small status labels (success / warning / danger)
    StatusBadge.css      always paired with Ink #14163A text (WCAG)
    README.md
```

The four SVG specs were previously flat files under `brand/ui-kit/components/`;
they are now grouped one folder per component family. The motion spec stays at
`brand/ui-kit/motion/token-fitting-spec.json`.

## Usage

The code components are React + TypeScript, styled with the `--bl-*` design
tokens from `brand/brand-tokens.css` (fallbacks are inlined, so they also
render without the token file). The live frontend wires the same grid through
`frontend/src/components/FundingGrid.tsx` (strip layout on campaign cards,
block layout on the campaign detail page) with the same math in
`frontend/src/funding-math.ts`.

## Data honesty

`raised` / `goal` accept `null` (or an invalid string) for a chain read that
has not landed or failed: the card then renders "Data unavailable" with an
empty grid and unknown progress - never a fabricated 0%. A verified `"0"` is
a real zero. The status badge only renders when an explicit `status` is
passed from the source. Regression tests for these cases live in
`cards/funding-math.test.ts` (`node --test`, also covered by `npm test`).

```tsx
import AssetCard from './components/cards/AssetCard';
import StatusBadge from './components/feedback/StatusBadge';

<AssetCard
  name="Lisbon Riverside Apartments - Series A"
  instrumentLabel="Participation right - senior"
  country="PT"
  interestRate="7.2%"
  term="36 months"
  minInvestment="100 USDC"
  raised="1554000000000"   // exact on-chain value, smallest unit (7 decimals)
  goal="2500000000000"     // exact on-chain goal, smallest unit
  deadlineLabel="23 days left"
  status="funding"
  grid="detail"            // 10x10: 1 tile = 1%
/>
```
