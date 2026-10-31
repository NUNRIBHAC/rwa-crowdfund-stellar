import { useEffect, useRef, useState } from 'react';

// Token slots of the Fraction mark, in funding order: the bottom row fills
// first, then the next rows. Geometry matches brand/logo/svg sources.
const TILES = [
  { x: 50, y: 150, fill: '#4B4FE2' },
  { x: 100, y: 150, fill: '#4B4FE2' },
  { x: 150, y: 150, fill: '#4B4FE2' },
  { x: 50, y: 100, fill: '#4B4FE2' },
  { x: 100, y: 100, fill: '#8B8EF0' },
  { x: 150, y: 100, fill: '#8B8EF0' },
  { x: 50, y: 50, fill: '#C7C8F9' },
  { x: 100, y: 50, fill: '#C7C8F9' },
];

// Timing follows brand/ui-kit/motion/token-fitting-spec.json: 200ms UI
// micro-transitions, a 700ms token dock on the shared easing curve.
const TILE_STAGGER_MS = 160;
const DOCK_DELAY_MS = TILES.length * TILE_STAGGER_MS + 150; // 1430ms
const SEQUENCE_MS = DOCK_DELAY_MS + 800;

// Short illustrative sequence: purple blocks slide into the asset, then stop.
// Hover, tap or keyboard focus replays it; reduced motion shows the final
// filled state with no animation. It explains the funding concept - it is not
// live funding activity and changes no campaign totals.
export default function FundingBlock() {
  const [run, setRun] = useState(0);
  const busy = useRef(true);

  useEffect(() => {
    busy.current = true;
    const t = window.setTimeout(() => {
      busy.current = false;
    }, SEQUENCE_MS);
    return () => window.clearTimeout(t);
  }, [run]);

  const replay = () => {
    if (!busy.current) setRun((r) => r + 1);
  };

  return (
    <figure
      className="funding-block"
      onMouseEnter={replay}
      onClick={replay}
      onFocus={replay}
      tabIndex={0}
      aria-labelledby="funding-block-title"
      aria-describedby="funding-block-note"
    >
      <figcaption id="funding-block-title" className="funding-block-title">
        How funding works
      </figcaption>
      <svg
        key={run}
        className="funding-block-svg"
        viewBox="0 0 240 240"
        role="img"
        aria-label="Illustration: small purple blocks slide in one by one and fill a shared asset outline, token by token"
      >
        <rect x="28" y="28" width="184" height="184" rx="26" fill="none" stroke="#14163A" strokeWidth="9" />
        {TILES.map((t, i) => (
          <rect key={i} className="funding-tile" style={{ '--i': i } as React.CSSProperties} x={t.x} y={t.y} width="40" height="40" rx="9" fill={t.fill} />
        ))}
        <rect
          className="funding-slot"
          x="150"
          y="50"
          width="40"
          height="40"
          rx="9"
          fill="none"
          stroke="#C7C8F9"
          strokeOpacity="0.9"
          strokeWidth="4"
          strokeDasharray="8 7"
        />
        <rect className="funding-token" x="150" y="50" width="40" height="40" rx="9" />
      </svg>
      <p id="funding-block-note" className="funding-block-note">
        Illustration - the block fills up as the crowd funds it. Not live funding activity. Hover or tap to replay.
      </p>
    </figure>
  );
}
