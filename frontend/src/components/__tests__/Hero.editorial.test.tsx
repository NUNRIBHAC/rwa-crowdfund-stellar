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
  expect(document.querySelectorAll('.funding-illustration .fund-grid-tile')).toHaveLength(100);
  fireEvent.click(screen.getByRole('button', { name: 'Goal missed' }));
  expect(screen.getByText('Each block is 1% of this illustrative goal.')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Goal missed' })).toBeTruthy();
});
