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
    README.md            from the on-chain raised/goal values
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
render without the token file). They are library components: not yet wired
into the live frontend, which keeps its own `frontend/src/components/`.

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
