import type { Intent } from '../types';
import { isTerminal } from '../types';
import { formatAmount, shorten } from '../format';

type Props = {
  intent: Intent;
  busy: boolean;
  onSubmit: () => void;
  onCheck: () => void;
  onCancel: () => void;
  onClear: () => void;
};

function stepClass(intent: Intent, step: number): string {
  const status = intent.status;
  if (status === 'SUCCESS') return 'step step-done';
  const order = ['BUILT', 'SIGNED', 'PENDING', 'SUCCESS'];
  let idx = order.indexOf(status);
  if (status === 'FAILED') idx = 3;
  if (status === 'NOT_FOUND') idx = 2;
  if (idx < 0) idx = 0;
  if (step < idx) return 'step step-done';
  if (step === idx) return `step step-current${status === 'FAILED' ? ' step-failed' : ''}`;
  return 'step';
}

export default function IntentPanel({ intent, busy, onSubmit, onCheck, onCancel, onClear }: Props) {
  const terminal = isTerminal(intent.status);
  const steps = ['Prepared', 'Signed', 'Submitted', 'Confirmed'];
  return (
    <section className="intent-panel" aria-live="polite">
      <div className="intent-head">
        <h2>Saved transaction</h2>
        <span className={`status-chip ${intent.status === 'SUCCESS' ? 'status-funded' : intent.status === 'FAILED' ? 'status-ended' : 'status-pending'}`}>
          {intent.status}
        </span>
      </div>

      <div className="step-track">
        {steps.map((s, i) => <span key={s} className={stepClass(intent, i)}>{s}</span>)}
      </div>

      <dl className="intent-facts">
        <div><dt>Action</dt><dd>{intent.action}{intent.amount ? ` ${intent.amount} USDC (testnet)` : ''}</dd></div>
        <div><dt>Campaign</dt><dd>{intent.campaign}</dd></div>
        {intent.contractId && <div><dt>Contract</dt><dd><code title={intent.contractId}>{shorten(intent.contractId, 10, 6)}</code></dd></div>}
        <div><dt>Max fee</dt><dd>{intent.feeStroops ? `${formatAmount(intent.feeStroops)} testnet XLM` : 'check wallet'}</dd></div>
        <div className="intent-hash"><dt>Hash</dt><dd><code title={intent.hash}>{shorten(intent.hash, 12, 8)}</code></dd></div>
      </dl>

      {!terminal && (
        <p className="intent-warning">
          Submission is not confirmation. A missing result does not mean failure. Check the
          status or retry this exact signed transaction; never create a replacement while
          uncertain.
        </p>
      )}
      {intent.status === 'SUCCESS' && (
        <p className="intent-warning intent-confirmed">
          Confirmed on Stellar testnet. This exact transaction is final; the hash above is its permanent proof.
        </p>
      )}
      {intent.status === 'NOT_FOUND' && (
        <p className="intent-warning intent-notfound">
          Uncertain outcome retained. The RPC may have limited history. Do not clear or
          replace it based on expiry.
        </p>
      )}

      <div className="btn-row">
        {!terminal && (
          <button className="btn btn-primary" disabled={busy} onClick={onSubmit}>
            {intent.signedXdr ? 'Retry identical transaction' : 'Sign and submit'}
          </button>
        )}
        {intent.signedXdr && !terminal && (
          <button className="btn" disabled={busy} onClick={onCheck}>Check ledger result</button>
        )}
        {!intent.signedXdr && intent.status === 'BUILT' && (
          <button className="btn btn-ghost" disabled={busy} onClick={onCancel}>Cancel unsigned transaction</button>
        )}
        {terminal && (
          <button className="btn btn-ghost" disabled={busy} onClick={onClear}>Clear confirmed record</button>
        )}
      </div>
    </section>
  );
}
