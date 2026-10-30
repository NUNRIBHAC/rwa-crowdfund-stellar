import { describe, test, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import IntentPanel from '../IntentPanel';
import type { Intent } from '../../types';

afterEach(cleanup);

const base: Intent = {
  hash: 'a'.repeat(64),
  campaign: 'demo-solar',
  actor: 'G'.repeat(56),
  action: 'contribute',
  amount: '10',
  xdr: 'XDR',
  status: 'BUILT',
};

function setup(intent: Intent) {
  const props = { intent, busy: false, onSubmit: vi.fn(), onCheck: vi.fn(), onCancel: vi.fn(), onClear: vi.fn() };
  render(<IntentPanel {...props} />);
  return props;
}

describe('IntentPanel state transitions', () => {
  test('unsigned BUILT intent offers sign-and-submit and cancel, never check or clear', () => {
    const props = setup({ ...base, status: 'BUILT' });
    fireEvent.click(screen.getByText('Sign and submit'));
    expect(props.onSubmit).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByText('Cancel unsigned transaction'));
    expect(props.onCancel).toHaveBeenCalledOnce();
    expect(screen.queryByText('Check ledger result')).toBeNull();
    expect(screen.queryByText('Clear confirmed record')).toBeNull();
  });

  test('signed non-terminal intent offers identical retry and ledger check, never cancel or clear', () => {
    const props = setup({ ...base, status: 'NOT_FOUND', signedXdr: 'SIGNED' });
    fireEvent.click(screen.getByText('Retry identical transaction'));
    expect(props.onSubmit).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByText('Check ledger result'));
    expect(props.onCheck).toHaveBeenCalledOnce();
    expect(screen.queryByText('Cancel unsigned transaction')).toBeNull();
    expect(screen.queryByText('Clear confirmed record')).toBeNull();
    expect(screen.getByText(/Uncertain outcome retained/)).toBeTruthy();
  });

  test('SUCCESS is terminal: only the clear action remains, with finality copy', () => {
    const props = setup({ ...base, status: 'SUCCESS', signedXdr: 'SIGNED' });
    expect(screen.queryByText('Retry identical transaction')).toBeNull();
    expect(screen.queryByText('Check ledger result')).toBeNull();
    expect(screen.getByText(/Confirmed on Stellar testnet/)).toBeTruthy();
    fireEvent.click(screen.getByText('Clear confirmed record'));
    expect(props.onClear).toHaveBeenCalledOnce();
  });

  test('FAILED is terminal and clearable; busy disables every action', () => {
    const props = setup({ ...base, status: 'FAILED', signedXdr: 'SIGNED' });
    fireEvent.click(screen.getByText('Clear confirmed record'));
    expect(props.onClear).toHaveBeenCalledOnce();
    cleanup();
    render(
      <IntentPanel
        intent={{ ...base, status: 'BUILT' }}
        busy={true}
        onSubmit={props.onSubmit}
        onCheck={props.onCheck}
        onCancel={props.onCancel}
        onClear={props.onClear}
      />,
    );
    for (const b of screen.getAllByRole('button')) expect((b as HTMLButtonElement).disabled).toBe(true);
  });
});
