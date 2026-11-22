import { describe, test, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import IntentPanel from '../IntentPanel';
import type { Intent } from '../../types';
import { I18nProvider, LOCALES } from '../../i18n';

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

  test('SUCCESS is terminal: only the clear transaction action remains, with finality copy', () => {
    const props = setup({ ...base, status: 'SUCCESS', signedXdr: 'SIGNED' });
    expect(screen.queryByText('Retry identical transaction')).toBeNull();
    expect(screen.queryByText('Check ledger result')).toBeNull();
    expect(screen.getByText(/Confirmed on Stellar testnet/)).toBeTruthy();
    fireEvent.click(screen.getByText('Clear confirmed record'));
    expect(props.onClear).toHaveBeenCalledOnce();
  });

  test.each(LOCALES)('$id: confirmed contribution has a localized testnet proof link without transaction actions', ({ id }) => {
    const props = {
      intent: { ...base, status: 'SUCCESS', signedXdr: 'SIGNED' },
      busy: false,
      onSubmit: vi.fn(),
      onCheck: vi.fn(),
      onCancel: vi.fn(),
      onClear: vi.fn(),
    };
    const { container } = render(
      <I18nProvider initialLocale={id}>
        <IntentPanel {...props} />
      </I18nProvider>,
    );
    const link = screen.getByRole('link');
    expect(link.getAttribute('href')).toBe(`https://stellar.expert/explorer/testnet/tx/${base.hash}`);
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
    expect(link.textContent?.trim()).toBeTruthy();
    if (id === 'pt') expect(link.textContent).toBe('Ver prova na rede');
    expect(container.querySelectorAll('button')).toHaveLength(1);
    for (const callback of [props.onSubmit, props.onCheck, props.onCancel, props.onClear]) expect(callback).not.toHaveBeenCalled();
  });

  test.each(['BUILT', 'SIGNED', 'PENDING', 'NOT_FOUND', 'FAILED', 'CANCELLED_UNSIGNED'])('%s is not presented as confirmed network proof', (status) => {
    setup({ ...base, status });
    expect(screen.queryByRole('link')).toBeNull();
  });

  test.each(['refund', 'withdraw'])('does not widen the requested contribution link to %s', (action) => {
    setup({ ...base, action, status: 'SUCCESS' });
    expect(screen.queryByRole('link')).toBeNull();
  });

  test.each(['', 'bad-hash', 'g'.repeat(64)])('does not create a proof destination for malformed hash %s', (hash) => {
    setup({ ...base, hash, status: 'SUCCESS' });
    expect(screen.queryByRole('link')).toBeNull();
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
