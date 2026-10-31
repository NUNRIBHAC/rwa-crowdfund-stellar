import StatusBadge, { type StatusBadgeTone } from '../feedback/StatusBadge';
import './AssetCard.css';

/**
 * AssetCard - the asset card (as in "Lisbon Riverside Apartments - Series A"),
 * componentized for the Blockallisto UI kit.
 *
 * The funding progress renders as the Fraction token grid (see
 * brand/ui-kit/components/funding-grid/funding-grid-spec.svg) and the number
 * of filled blocks is computed EXACTLY from the on-chain values:
 *
 *   filledBlocks = floor(raised * tileCount / goal)     (integer math, BigInt)
 *
 * with `raised` and `goal` in the token's smallest unit, as returned by the
 * Soroban contract (7-decimal strings on Stellar, e.g. "1554000000000"). The
 * figures are displayed converted to display units (155,400 USDC); the math
 * always uses the raw integer strings.
 * One tile = one equal share of the goal: 1% per tile on the 10x10 detail
 * grid, 1/9 per tile on the 3x3 summary grid. A partially funded next tile
 * renders in the "in progress" tone (Indigo 400); unfunded tiles render in
 * the "open" tone (Indigo 200). Geometry follows the spec: gap = tile / 4,
 * inner padding = tile x 0.55, tile corner radius = 22.5% of tile, block
 * corner radius = 14.1% of block, fill order bottom row first, left to
 * right, then upward.
 */

export type AssetCardStatus = 'funding' | 'funded' | 'closed';

export type AssetCardProps = {
  /** Asset name, e.g. "Lisbon Riverside Apartments - Series A". */
  name: string;
  /** Link to the asset detail page. */
  href?: string;
  /** Short teaser line under the title. */
  teaser?: string;
  /** Instrument label chip, e.g. "Participation right - senior". */
  instrumentLabel?: string;
  /** Country chip, e.g. "PT". */
  country?: string;
  interestRate?: string;
  term?: string;
  minInvestment?: string;
  /** Exact on-chain raised amount, smallest token unit (integer string). */
  raised: string;
  /** Exact on-chain funding goal, smallest token unit (integer string). */
  goal: string;
  /** Human deadline line, e.g. "Ends 24 Nov 2026" or "23 days left". */
  deadlineLabel?: string;
  status?: AssetCardStatus;
  /** Unit label shown next to the figures, e.g. "USDC (testnet)". */
  currencyLabel?: string;
  /** Token decimals used to display the figures (Stellar: 7). Math always uses the raw strings. */
  decimals?: number;
  /** Grid density: "detail" = 10x10 (1 tile = 1%), "summary" = 3x3. */
  grid?: 'detail' | 'summary';
};

/** Exact filled-tile count from chain values; never rounds up. */
export function filledTiles(raised: string, goal: string, tileCount: number): { filled: number; inProgress: boolean; percent: number } {
  const r = BigInt(raised || '0');
  const g = BigInt(goal || '0');
  if (g <= 0n) return { filled: 0, inProgress: false, percent: 0 };
  const total = BigInt(tileCount);
  const scaled = r * total;
  let filled = Number(scaled / g);
  if (filled > tileCount) filled = tileCount;
  const remainder = scaled % g;
  const inProgress = remainder > 0n && filled < tileCount;
  const percent = Number((r * 10000n) / g) / 100; // 2-decimal percent for the figure
  return { filled, inProgress, percent };
}

/** Display-unit string from an exact smallest-unit integer string: grouped thousands, full precision, trailing zeros trimmed. */
export function formatTokenAmount(raw: string, decimals = 7): string {
  let v: bigint;
  try {
    v = BigInt(raw || '0');
  } catch {
    return '0';
  }
  const neg = v < 0n;
  if (neg) v = -v;
  const base = 10n ** BigInt(decimals);
  const whole = v / base;
  const frac = (v % base)
    .toString()
    .padStart(decimals, '0')
    .replace(/0+$/, '');
  const grouped = whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return (neg ? '-' : '') + grouped + (frac ? '.' + frac : '');
}

const STATUS_TONE: Record<AssetCardStatus, StatusBadgeTone> = {
  funded: 'success',
  funding: 'warning',
  closed: 'danger',
};
const STATUS_LABEL: Record<AssetCardStatus, string> = {
  funded: 'Funded',
  funding: 'Funding',
  closed: 'Closed',
};

type GridSpec = { n: number; tile: number };
const GRIDS: Record<'detail' | 'summary', GridSpec> = {
  detail: { n: 10, tile: 16 },
  summary: { n: 3, tile: 40 },
};

function FundingGrid({ raised, goal, density }: { raised: string; goal: string; density: 'detail' | 'summary' }) {
  const { n, tile } = GRIDS[density];
  const count = n * n;
  const { filled, inProgress, percent } = filledTiles(raised, goal, count);
  const gap = tile / 4;
  const pad = Math.round(tile * 0.55);
  const block = pad * 2 + n * tile + (n - 1) * gap;
  const view = Math.ceil(block + pad); // breathing room around the block
  const off = (view - block) / 2;
  const tileRx = +(tile * 0.225).toFixed(2);
  const blockRx = +(block * 0.141).toFixed(2);

  const tiles = [];
  for (let i = 0; i < count; i++) {
    // fill order: bottom row first, left to right, then upward
    const col = i % n;
    const rowFromBottom = Math.floor(i / n);
    const x = off + pad + col * (tile + gap);
    const y = off + pad + (n - 1 - rowFromBottom) * (tile + gap);
    const state = i < filled ? 'funded' : i === filled && inProgress ? 'progress' : 'open';
    tiles.push(<rect key={i} className={`bl-asset-grid-tile is-${state}`} x={x} y={y} width={tile} height={tile} rx={tileRx} />);
  }

  return (
    <svg
      className="bl-asset-grid"
      viewBox={`0 0 ${view} ${view}`}
      role="img"
      aria-label={`Funding progress: ${filled} of ${count} blocks filled, ${percent}% of the goal`}
    >
      <rect className="bl-asset-grid-block" x={off} y={off} width={block} height={block} rx={blockRx} />
      {tiles}
    </svg>
  );
}

export default function AssetCard({
  name,
  href,
  teaser,
  instrumentLabel,
  country,
  interestRate,
  term,
  minInvestment,
  raised,
  goal,
  deadlineLabel,
  status = 'funding',
  currencyLabel = 'USDC (testnet)',
  decimals = 7,
  grid = 'detail',
}: AssetCardProps) {
  const { filled, percent } = filledTiles(raised, goal, GRIDS[grid].n ** 2);
  return (
    <article className="bl-asset-card">
      <div className="bl-asset-card-main">
        <div className="bl-asset-card-top">
          <h3 className="bl-asset-card-title">{href ? <a href={href}>{name}</a> : name}</h3>
          <div className="bl-asset-card-tags">
            {instrumentLabel && <span className="bl-asset-chip">{instrumentLabel}</span>}
            {country && <span className="bl-asset-chip">{country}</span>}
            <StatusBadge tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</StatusBadge>
          </div>
        </div>
        {teaser && <p className="bl-asset-card-teaser">{teaser}</p>}
        {(interestRate || term || minInvestment) && (
          <dl className="bl-asset-metrics">
            {interestRate && (
              <div>
                <dt>Interest</dt>
                <dd>{interestRate}</dd>
              </div>
            )}
            {term && (
              <div>
                <dt>Term</dt>
                <dd>{term}</dd>
              </div>
            )}
            {minInvestment && (
              <div>
                <dt>Minimum</dt>
                <dd>{minInvestment}</dd>
              </div>
            )}
          </dl>
        )}
        <div className="bl-asset-figures">
          <div>
            <dt>Raised</dt>
            <dd className="bl-asset-figure">
              {formatTokenAmount(raised, decimals)} <span className="bl-asset-unit">{currencyLabel}</span>
            </dd>
          </div>
          <div>
            <dt>Goal</dt>
            <dd className="bl-asset-figure">
              {formatTokenAmount(goal, decimals)} <span className="bl-asset-unit">{currencyLabel}</span>
            </dd>
          </div>
          {deadlineLabel && (
            <div>
              <dt>Deadline</dt>
              <dd className="bl-asset-figure">{deadlineLabel}</dd>
            </div>
          )}
        </div>
      </div>
      <div className="bl-asset-card-grid">
        <FundingGrid raised={raised} goal={goal} density={grid} />
        <p className="bl-asset-grid-caption">
          <span className="bl-asset-figure">{percent}%</span> funded - {filled} of {GRIDS[grid].n ** 2} blocks
        </p>
      </div>
    </article>
  );
}
