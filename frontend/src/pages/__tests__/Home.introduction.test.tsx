import { afterEach, expect, test } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { I18nProvider } from '../../i18n';
import Home from '../Home';
import { FIXTURE_CAMPAIGNS } from '../../fixtures';
import type { Market } from '../../market';
afterEach(cleanup);
test('home introduces funding, preserves the slogan and sends contribution actions to detail', () => {
  localStorage.setItem('blockallisto-language', 'en');
  const market: Market = {
    campaigns: [FIXTURE_CAMPAIGNS[0]],
    loaded: true,
    fixtureMode: false,
    actor: '',
    busy: false,
    amounts: {},
    amountErrors: {},
    prepareErrors: {},
    onAmount: () => {},
    onPrepare: () => {},
    onRefresh: () => {},
    onToggleFixtures: () => {},
  };
  const { container } = render(
    <I18nProvider>
      <Home market={market} />
    </I18nProvider>,
  );
  expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Real assets. Shared possibilities.');
  expect(
    screen.getByText('Explore funding campaigns. Contribute toward a shared goal. After the deadline, the result decides what happens next.'),
  ).toBeTruthy();
  expect(container.querySelector('.card input')).toBeNull();
  expect(container.querySelector('.card details')).toBeNull();
  expect(screen.getByRole('link', { name: 'View campaign' }).getAttribute('href')).toBe('/campaigns/fixture-lisbon-riverside');
  const contract = container.querySelector('.home-contract') as HTMLDetailsElement;
  expect(contract.open).toBe(false);
  fireEvent.click(screen.getByText('How the contract works'));
  expect(contract.open).toBe(true);
  expect(container.querySelectorAll('.hero-cubes .editorial-cube-motion')).toHaveLength(6);
  expect(container.querySelectorAll('.hero-cubes .editorial-cube-grounded')).toHaveLength(0);
  expect(container.querySelector('.home-contract .funding-illustration')).toBeTruthy();
  expect(container.querySelectorAll('.home-funding-rules .instrument-card')).toHaveLength(7);
  expect(container.querySelectorAll('.home-funding-rules details')).toHaveLength(4);
  const missed = screen.getByRole('button', { name: 'Goal missed' });
  fireEvent.click(missed);
  expect(missed.getAttribute('aria-pressed')).toBe('true');
  expect(screen.getByRole('button', { name: 'Goal reached' }).getAttribute('aria-pressed')).toBe('false');
  const headings = Array.from(container.querySelectorAll('h2')).map((e) => e.textContent);
  expect(headings).toEqual(['Latest campaigns', 'How funding works', 'Funding rules and limitations']);
  expect(container.querySelectorAll('.funding-illustration .fund-grid-tile')).toHaveLength(100);
});
