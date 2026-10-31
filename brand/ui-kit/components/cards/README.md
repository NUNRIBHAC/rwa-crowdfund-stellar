# AssetCard

The asset card (as in "Lisbon Riverside Apartments - Series A") componentized
in React + TypeScript.

## Funding progress from blockchain data

The card renders the Fraction token grid as the funding progress indicator
(spec: `../funding-grid/funding-grid-spec.svg`). The number of filled blocks
is computed EXACTLY from the on-chain values passed as props:

```
filledBlocks = floor(raised * tileCount / goal)     (BigInt integer math)
```

- `raised` / `goal`: integer strings in the token's smallest unit, exactly as
  returned by the Soroban contract (7 decimals on Stellar). No float rounding.
  The card displays them converted to display units with full precision
  (`formatTokenAmount`: "1554000000000" -> "155,400 USDC"); override the
  decimals with the `decimals` prop. All math uses the raw integer strings.
- `grid="detail"` (default): 10x10 = 100 tiles, 1 tile = 1% of the goal.
- `grid="summary"`: 3x3 = 9 tiles for compact contexts.
- A partially funded next tile renders in Indigo 400 ("in progress");
  unfunded tiles render in Indigo 200 ("open"). Geometry follows the spec:
  gap = tile / 4, inner padding = tile x 0.55, tile radius 22.5%, block
  radius 14.1%, fill order bottom row first, left to right, then upward.
- The grid exposes an accessible label: "N of 100 blocks filled, X% of the
  goal" (the percent is derived from the same integer values, 2 decimals).

## Props

| Prop | Type | Notes |
| --- | --- | --- |
| `name` | string | Asset name (required) |
| `href` | string? | Link to the asset page |
| `teaser` | string? | Short line under the title |
| `instrumentLabel` | string? | Instrument chip, e.g. "Participation right - senior" |
| `country` | string? | Country chip |
| `interestRate`, `term`, `minInvestment` | string? | Metric chips |
| `raised`, `goal` | string | Exact on-chain values, smallest unit (required) |
| `deadlineLabel` | string? | e.g. "23 days left" |
| `status` | "funding" \| "funded" \| "closed" | Maps to StatusBadge tones warning / success / danger |
| `currencyLabel` | string? | Defaults to "USDC (testnet)" |
| `decimals` | number? | Display decimals, defaults to 7 (Stellar) |
| `grid` | "detail" \| "summary" | Defaults to "detail" |

Depends on `../feedback/StatusBadge`. Styling: `AssetCard.css` with the
`--bl-*` tokens (inlined fallbacks).
