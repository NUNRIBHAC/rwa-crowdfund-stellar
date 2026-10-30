import { shorten } from '../format';

type Props = {
  actor: string;
  busy: boolean;
  onConnect: () => void;
};

export default function Header({ actor, busy, onConnect }: Props) {
  return (
    <header className="site-header">
      <div className="header-inner">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            ◆
          </span>
          <span className="brand-name">RWA Crowdfund</span>
          <span className="badge badge-testnet">Stellar testnet</span>
        </div>
        <div className="header-actions">
          {actor ? (
            <span className="wallet-chip" title={actor}>
              Connected: {shorten(actor)}
            </span>
          ) : (
            <button className="btn btn-primary" disabled={busy} onClick={onConnect}>
              Connect Freighter
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
