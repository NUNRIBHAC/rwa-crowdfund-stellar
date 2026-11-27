// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';
import AutomaticRefundStatus, { type AutomaticRefundMessages } from './AutomaticRefundStatus';
afterEach(cleanup);
const messages: AutomaticRefundMessages = {
  title: 'Refund status',
  testnetOnly: 'Testnet only, no real money.',
  pending: 'Pending',
  submitted: 'Submitted, not yet paid',
  paid: 'Refund confirmed',
  blocked: 'Refund needs review',
  manualFallback: 'Open manual refund',
  unavailable: 'Status unavailable',
};
const formatAmount = (raw: string) => `formatted:${raw}`;
test('submission is never labelled paid and the component cannot trigger a refund', () => {
  render(<AutomaticRefundStatus messages={messages} formatAmount={formatAmount} view={{ status: 'submitted' }} manualRefundHref="/campaign/test" />);
  expect(screen.getByRole('status').textContent).toBe(messages.submitted);
  expect(screen.queryByRole('button')).toBeNull();
  expect(screen.queryByText(messages.paid)).toBeNull();
  expect(screen.getByRole('link').getAttribute('href')).toBe('/campaign/test');
});
test('only a valid positive confirmed amount is displayed with paid state', () => {
  const { rerender } = render(
    <AutomaticRefundStatus messages={messages} formatAmount={formatAmount} view={{ status: 'paid', amount: '100' }} manualRefundHref="/campaign/test" />,
  );
  expect(screen.getByText('formatted:100')).toBeTruthy();
  expect(screen.queryByRole('link')).toBeNull();
  rerender(<AutomaticRefundStatus messages={messages} formatAmount={formatAmount} view={{ status: 'paid', amount: '0' }} />);
  expect(screen.getByRole('status').textContent).toBe(messages.blocked);
  expect(screen.queryByText('formatted:0')).toBeNull();
});
test('missing state has its own message and no synthetic paid evidence', () => {
  render(<AutomaticRefundStatus messages={messages} formatAmount={formatAmount} />);
  expect(screen.getByRole('status').textContent).toBe(messages.unavailable);
});
test('does not allow arbitrary, protocol-relative or backslash manual links', () => {
  for (const manualRefundHref of ['https://untrusted.invalid', '//untrusted.invalid', '/campaign/\\evil', '/campaign/test\n']) {
    const { unmount } = render(
      <AutomaticRefundStatus messages={messages} formatAmount={formatAmount} view={{ status: 'blocked' }} manualRefundHref={manualRefundHref} />,
    );
    expect(screen.queryByRole('link')).toBeNull();
    unmount();
  }
});
test('all visible words come from the supplied translated messages', () => {
  const translated = Object.fromEntries(Object.keys(messages).map((key) => [key, `localized-${key}`])) as AutomaticRefundMessages;
  render(<AutomaticRefundStatus messages={translated} formatAmount={formatAmount} view={{ status: 'pending' }} />);
  expect(screen.getByRole('status').textContent).toBe('localized-pending');
  expect(screen.queryByText('Pending')).toBeNull();
});
