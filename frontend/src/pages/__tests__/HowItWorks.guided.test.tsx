import { afterEach, expect, test } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { I18nProvider } from '../../i18n';
import HowItWorks from '../HowItWorks';
afterEach(cleanup);

test('one audience journey is shown at a time with demo actions separate from intended steps', () => {
  const { container } = render(
    <I18nProvider>
      <HowItWorks />
    </I18nProvider>,
  );
  expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('From discovering a campaign to following its outcome.');
  expect(screen.getByRole('tab', { name: 'For contributors' }).getAttribute('aria-selected')).toBe('true');
  expect(screen.getByRole('heading', { name: 'Contribution and payment' })).toBeTruthy();
  expect(screen.queryByRole('heading', { name: /^Payment$/ })).toBeNull();
  expect(container.querySelectorAll('.journey-list > li').length).toBe(8);
  expect(screen.getAllByText('Partial prototype').length).toBeGreaterThan(0);
  expect(screen.getAllByText('Planned - not built').length).toBeGreaterThan(0);
  expect(container.querySelectorAll('details').length).toBe(8);
  fireEvent.click(screen.getByRole('tab', { name: 'For businesses' }));
  expect(container.querySelectorAll('.journey-list > li').length).toBe(5);
  expect(screen.queryByRole('heading', { name: 'Contribution and payment' })).toBeNull();
  expect(screen.getAllByRole('link', { name: 'View application preview' }).length).toBe(2);
  expect(container.querySelector('.editorial-cubes')?.getAttribute('aria-hidden')).toBe('true');
  expect(container.querySelectorAll('.editorial-cube-motion').length).toBe(6);
});
