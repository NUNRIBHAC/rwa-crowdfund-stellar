import { afterEach, expect, test } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { I18nProvider } from '../../i18n';
import ContributionPreview from '../ContributionPreview';
afterEach(cleanup);
function Demo() {
  const [amount, onAmount] = useState('250');
  return (
    <I18nProvider>
      <ContributionPreview raised="660000000000" goal="1000000000000" amount={amount} onAmount={onAmount} />
    </I18nProvider>
  );
}
test('approved example is a preview, not a transaction, with patterned fractional addition', () => {
  render(<Demo />);
  expect(screen.getByText('0.25%')).toBeTruthy();
  expect(screen.getByText('66.25%')).toBeTruthy();
  expect(screen.getByText(/no signature, transaction or ownership/)).toBeTruthy();
  expect(document.querySelectorAll('.preview-scale span')).toHaveLength(100);
  expect(document.querySelector('.preview-addition i')?.getAttribute('style')).toContain('25%');
  expect(screen.queryByRole('button')).toBeNull();
});
test('invalid and over-goal amounts are explained rather than shown as funded', () => {
  render(<Demo />);
  fireEvent.change(screen.getByRole('textbox'), { target: { value: '-1' } });
  expect(screen.getByText(/positive USDC amount/)).toBeTruthy();
  fireEvent.change(screen.getByRole('textbox'), { target: { value: '40000' } });
  expect(screen.getByText(/exceeds the remaining/)).toBeTruthy();
  expect(screen.queryByText('106%')).toBeNull();
});
