import { tpl } from '../format';
import { fundingState } from '../funding-math';
import { useI18n } from '../i18n';

/**
 * FundingGrid - the Fraction token grid as the funding progress indicator
 * (spec: brand/ui-kit/components/funding-grid/funding-grid-spec.svg).
 * The filled-tile count is computed EXACTLY from the on-chain integer strings
 * (BigInt, floor, never rounds up). Missing or invalid chain data renders an
 * empty grid with a "Progress unavailable" caption - never a fabricated 0%.
 *
 * All campaign surfaces now default to the same 100-tile block: one tile
 * is 1% of the goal. Legacy strip geometry remains an explicit option.
 * layout "strip": 2 rows x 10 tiles; fill left to right, top row first.
 * layout "block": 10x10 tiles inside the Ink frame (campaign detail page;
 *   fill bottom row first, left to right, then upward, per the spec).
 */
export default function FundingGrid({ raised, goal, layout = 'block' }: { raised?: string | null; goal?: string | null; layout?: 'strip' | 'block' }) {
  const { m } = useI18n();
  const cols = 10;
  const rows = layout === 'strip' ? 2 : 10;
  const count = cols * rows;
  const tile = layout === 'strip' ? 26 : 16;
  const state = fundingState(raised, goal, count);
  const gap = Math.round(tile / 4);
  const pad = layout === 'strip' ? 0 : Math.round(tile * 0.55);
  const block = pad * 2 + cols * tile + (cols - 1) * gap;
  const blockH = pad * 2 + rows * tile + (rows - 1) * gap;
  const viewW = Math.ceil(block + pad);
  const viewH = Math.ceil(blockH + pad);
  const offX = (viewW - block) / 2;
  const offY = (viewH - blockH) / 2;
  const tileRx = +(tile * 0.28).toFixed(2);
  const blockRx = +(Math.max(block, blockH) * 0.141).toFixed(2);

  const filled = state.kind === 'ready' ? state.filled : 0;
  const inProgress = state.kind === 'ready' ? state.inProgress : false;
  const partial = state.kind === 'ready' ? state.partial : 0;
  const ariaLabel = state.kind === 'ready' ? tpl(m.grid.ariaReady, { filled, count, percent: state.percent }) : m.grid.ariaUnavailable;

  const tiles = [];
  for (let i = 0; i < count; i++) {
    // strip: top row first, left to right; block: bottom row first, then upward
    const col = i % cols;
    const row = layout === 'strip' ? Math.floor(i / cols) : rows - 1 - Math.floor(i / cols);
    const x = offX + pad + col * (tile + gap);
    const y = offY + pad + row * (tile + gap);
    if (i === filled && inProgress) {
      // Next tile fills geometrically with the exact confirmed fraction.
      const w = Math.max(1, Math.round(tile * partial * 100) / 100);
      tiles.push(
        <g key={i}>
          <rect className="fund-grid-tile is-open" x={x} y={y} width={tile} height={tile} rx={tileRx} />
          <rect className="fund-grid-tile is-funded" x={x} y={y} width={w} height={tile} rx={Math.min(tileRx, w / 2)} />
        </g>,
      );
    } else {
      const s = i < filled ? 'funded' : 'open';
      tiles.push(<rect key={i} className={`fund-grid-tile is-${s}`} x={x} y={y} width={tile} height={tile} rx={tileRx} />);
    }
  }

  return (
    <div className={`fund-grid-wrap fund-grid-${layout}`}>
      <svg className="fund-grid" viewBox={`0 0 ${viewW} ${viewH}`} role="img" aria-label={ariaLabel} style={{ aspectRatio: `${viewW} / ${viewH}` }}>
        {layout === 'block' && <rect className="fund-grid-block" x={offX} y={offY} width={block} height={blockH} rx={blockRx} />}
        {tiles}
      </svg>
      {layout === 'block' && (
        <p className="fund-grid-caption">
          {state.kind === 'ready' ? (
            <>
              <strong>{state.percent}%</strong> {tpl(m.grid.fundedTail, { filled: state.filled, count })}
            </>
          ) : (
            m.grid.captionUnavailable
          )}
          <span className="fund-grid-unit">{m.grid.blockUnit}</span>
        </p>
      )}
    </div>
  );
}

export { fundingState };
