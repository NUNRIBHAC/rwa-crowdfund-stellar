import { afterEach, expect, test } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { I18nProvider, LOCALES, useI18n } from '../../i18n';
import type { Intent } from '../../types';
import TestnetPaymentPath from '../TestnetPaymentPath';

afterEach(cleanup);
const base: Intent = {
  hash: 'a'.repeat(64),
  campaign: 's1',
  actor: 'fixture',
  xdr: 'sensitive-envelope',
  action: 'contribute',
  status: 'BUILT',
  amount: '10.1234567',
  feeStroops: '10100',
};
function Expected() {
  const { m } = useI18n();
  return (
    <output data-testid="expected">
      {m.paymentPath.title}|{m.paymentPath.note}|{m.paymentPath.estimateNote}|{m.paymentPath.separateAssets}
    </output>
  );
}
test.each(LOCALES)('$id: localizes all explanatory text without controls or envelope disclosure', ({ id }) => {
  const { container } = render(
    <I18nProvider initialLocale={id}>
      <Expected />
      <TestnetPaymentPath intent={base} />
    </I18nProvider>,
  );
  for (const text of screen.getByTestId('expected').textContent!.split('|'))
    expect(container.querySelector('.testnet-payment-path')!.textContent).toContain(text);
  expect(container.querySelectorAll('button,input,a')).toHaveLength(0);
  expect(container.textContent).not.toContain('sensitive-envelope');
  expect(container.textContent).toContain('10.1234567');
});
test.each(['BUILT', 'SIGNED', 'PENDING', 'SUCCESS', 'FAILED', 'NOT_FOUND', 'UNKNOWN', 'CANCELLED_UNSIGNED'])(
  '%s never converts a prepared fee or amount into final-payment evidence',
  (status) => {
    render(<TestnetPaymentPath intent={{ ...base, status }} />);
    expect(screen.getAllByText('Not verified')).toHaveLength(2);
    expect(screen.getByText('10.1234567 USDC (testnet)')).toBeTruthy();
    expect(screen.getByText('0.00101 testnet XLM')).toBeTruthy();
  },
);
test('refund uses the returned prepared snapshot, not a contribution label', () => {
  render(<TestnetPaymentPath intent={{ ...base, action: 'refund' }} />);
  expect(screen.getByText('Prepared refund to wallet')).toBeTruthy();
  expect(screen.queryByText('Prepared contribution to escrow')).toBeNull();
});
test('missing or malformed figures stay unknown and never crash amount formatting', () => {
  render(<TestnetPaymentPath intent={{ ...base, amount: '1e7', feeStroops: 'invalid' }} />);
  expect(screen.getAllByText('Not verified')).toHaveLength(4);
});
