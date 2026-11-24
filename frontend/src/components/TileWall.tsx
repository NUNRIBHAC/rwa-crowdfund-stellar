import { useState } from 'react';
import { useI18n } from '../i18n';
import './TileWall.css';

// This local state is deliberately independent of campaigns, wallets and APIs.
// No contribution, contract call or refund is made by the visual controls.
export default function TileWall() {
  const { m } = useI18n();
  const copy = m.tileWall;
  const [progress, setProgress] = useState(40);
  const [refund, setRefund] = useState(false);
  return (
    <section className="tile-wall-demo" aria-labelledby="tile-wall-title">
      <h2 id="tile-wall-title">{copy.wallTitle}</h2>
      <p>{copy.wallNote}</p>
      <p className="tile-wall-note">{copy.demoNote}</p>
      <div
        className={`tile-wall-grid ${refund ? 'is-refunding' : 'is-growing'}`}
        style={{ '--tile-scale': String(0.65 + progress * 0.0035) } as React.CSSProperties}
      >
        {Array.from({ length: 48 }, (_, i) => (
          <span aria-hidden="true" key={i} className={`wall-tile tile-pattern-${i % 4}`} style={{ '--tile-index': i } as React.CSSProperties} />
        ))}
        {refund && <p className="tile-wall-refund-complete">{copy.refundComplete}</p>}
      </div>
      <div className="tile-wall-controls">
        <label htmlFor="tile-wall-progress">{copy.progressLabel}</label>
        <input
          id="tile-wall-progress"
          type="range"
          min="0"
          max="100"
          value={progress}
          disabled={refund}
          onChange={(e) => setProgress(Number(e.target.value))}
        />
        <output htmlFor="tile-wall-progress">{progress}%</output>
        <button type="button" className="btn btn-outline" disabled={refund} onClick={() => setRefund(true)}>
          {copy.refundButton}
        </button>
        <button
          type="button"
          className="btn btn-outline"
          onClick={() => {
            setRefund(false);
            setProgress(40);
          }}
        >
          {copy.resetButton}
        </button>
      </div>
      <p role="status">{refund ? copy.refundState : copy.campaignState}</p>
    </section>
  );
}
