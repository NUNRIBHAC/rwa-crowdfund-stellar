import { afterEach, expect, test } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { I18nProvider } from '../i18n';
import YieldCalculator from './YieldCalculator';
import copy from './yield-calculator-copy.test.json';
afterEach(cleanup);
const mount = () =>
  render(
    <I18nProvider>
      <YieldCalculator copy={copy} />
    </I18nProvider>,
  );
test('isolated UI defaults to sample terms, with no account, wallet or persistence action', () => {
  const { container } = mount();
  expect((screen.getByLabelText(copy.rate) as HTMLInputElement).value).toBe('6.5');
  expect(container.querySelectorAll('#yield-campaign option')).toHaveLength(45);
  expect(container.querySelectorAll('form,button')).toHaveLength(0);
  expect(container.textContent).not.toMatch(/undefined|NaN|Infinity/);
  expect(localStorage.getItem('yield-calculator')).toBeNull();
});
test('all44sample selections keep unsupported coupons uncalculated', () => {
  const { container } = mount();
  const select = screen.getByLabelText(copy.campaign) as HTMLSelectElement;
  for (const option of Array.from(select.options).slice(1)) {
    fireEvent.change(select, { target: { value: option.value } });
    expect(container.textContent).not.toMatch(/undefined|NaN|Infinity/);
    expect(container.querySelector('.yield-results') !== null || screen.queryByText(copy.variableWarning) !== null).toBe(true);
  }
});
test('main negative scenario differs from separately selected reference floor', () => {
  const { container } = mount();
  fireEvent.change(screen.getByLabelText(copy.campaign), { target: { value: 'manual' } });
  fireEvent.change(screen.getByLabelText(copy.amount), { target: { value: '1000' } });
  fireEvent.change(screen.getByLabelText(copy.rate), { target: { value: '4' } });
  fireEvent.change(screen.getByLabelText(copy.months), { target: { value: '3' } });
  fireEvent.click(screen.getByLabelText(copy.stress));
  const before = container.querySelector('.yield-total')!.textContent;
  fireEvent.click(screen.getByLabelText(copy.reference));
  const after = container.querySelector('.yield-total')!.textContent;
  expect(before).not.toBe(after);
  expect(screen.getAllByText(copy.referenceWarning)).toHaveLength(2);
});
test.each(['', '0', '-1', '1.5', '1201'])('invalid month %s has translated validation and no stale result', (value) => {
  const { container } = mount();
  fireEvent.change(screen.getByLabelText(copy.months), { target: { value } });
  expect(screen.getByRole('alert').textContent).toBe(copy.invalid);
  expect(container.querySelector('.yield-results')).toBeNull();
});
test('strategy, inflation and custom assumptions update the table without storing data', () => {
  const { container } = mount();
  fireEvent.change(screen.getByLabelText(copy.strategy), { target: { value: 'withdraw' } });
  fireEvent.click(screen.getByLabelText(copy.realTerms));
  fireEvent.change(screen.getByLabelText(copy.taxRate), { target: { value: '30' } });
  expect(screen.getByText(copy.monthly)).toBeDefined();
  expect(container.querySelectorAll('tbody tr')).toHaveLength(24);
  expect(container.textContent).not.toMatch(/undefined|NaN|Infinity/);
});

test('main tax is mandatory and clearing it suppresses stale result', () => {
  const { container } = mount();
  expect((screen.getByLabelText(copy.taxRate) as HTMLInputElement).value).toBe('28');
  fireEvent.change(screen.getByLabelText(copy.taxRate), { target: { value: '' } });
  expect(screen.getByRole('alert')).toBeDefined();
  expect(container.querySelector('.yield-results')).toBeNull();
});
