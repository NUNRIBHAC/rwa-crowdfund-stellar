import { test, expect, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { I18nProvider } from '../../i18n';
import Hero from '../Hero';
afterEach(cleanup);
test('editorial hero keeps approved slogan and access to truthful 100-block explanation', () => {
  render(
    <I18nProvider>
      <Hero mode="live" />
    </I18nProvider>,
  );
  expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Real assets. Shared possibilities.');
  expect(document.querySelector('.editorial-cubes')?.getAttribute('aria-hidden')).toBe('true');
  const details = document.querySelector('details')!;
  expect(details.open).toBe(false);
  fireEvent.click(screen.getByText('How the contract works'));
  expect(screen.getByText('Each block is 1% of this illustrative goal.')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Goal missed' })).toBeTruthy();
});
