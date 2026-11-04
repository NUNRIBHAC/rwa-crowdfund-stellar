import { test, expect, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent, within } from '@testing-library/react';
import Investments from '../Investments';
import { I18nProvider } from '../../i18n';
import { FIXTURE_CAMPAIGNS } from '../../fixtures';
import type { Market } from '../../market';
import type { Campaign } from '../../types';

afterEach(cleanup);

const past = String(Math.floor(Date.now() / 1000) - 86400);

const openCampaign: Campaign = {
  ...FIXTURE_CAMPAIGNS[0],
  id: 'qa-open-alpha',
  name: 'QA Open Alpha',
};

const endedCampaign: Campaign = {
  ...FIXTURE_CAMPAIGNS[0],
  id: 'qa-ended-zulu',
  name: 'QA Ended Zulu',
  config: { ...FIXTURE_CAMPAIGNS[0].config, deadline: past },
};

function marketFor(campaigns: Campaign[]): Market {
  return {
    campaigns,
    loaded: true,
    fixtureMode: true,
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
}

function setup(campaigns: Campaign[]) {
  render(
    <I18nProvider>
      <Investments market={marketFor(campaigns)} />
    </I18nProvider>,
  );
}

test('ended campaigns render in a separate completed section, open ones outside it', () => {
  setup([openCampaign, endedCampaign]);
  const completed = screen.getByRole('region', { name: /completed investments/i });
  expect(within(completed).getByText('QA Ended Zulu')).toBeTruthy();
  expect(within(completed).queryByText('QA Open Alpha')).toBeNull();
});

test('no completed section renders when every campaign is open', () => {
  setup([openCampaign]);
  expect(screen.queryByRole('region', { name: /completed investments/i })).toBeNull();
  expect(screen.getByText('QA Open Alpha')).toBeTruthy();
});

test('search narrows campaigns by name', () => {
  setup([openCampaign, endedCampaign]);
  const box = screen.getByRole('textbox', { name: /search campaigns/i });
  fireEvent.change(box, { target: { value: 'zulu' } });
  expect(screen.getByText('QA Ended Zulu')).toBeTruthy();
  expect(screen.queryByText('QA Open Alpha')).toBeNull();
});

test('registry search has a fitting placeholder and a complete accessible label', () => {
  setup([openCampaign]);
  const box = screen.getByRole('textbox', { name: 'Search campaigns' });
  expect(box.getAttribute('placeholder')).toBe('Search campaigns');
  expect(box.getAttribute('title')).toBe('Search campaigns by name or contract');
});

test('status filter and list view preserve campaign separation', () => {
  setup([openCampaign, endedCampaign]);
  fireEvent.click(screen.getByRole('button', { name: 'Open' }));
  expect(screen.getByText('QA Open Alpha')).toBeTruthy();
  expect(screen.queryByText('QA Ended Zulu')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'List' }));
  expect(screen.getByRole('button', { name: 'List' }).getAttribute('aria-pressed')).toBe('true');
  expect(screen.getByText('QA Open Alpha')).toBeTruthy();
});

test('discovery cards have no transaction controls and closed history stays expandable', () => {
  const { container } = render(
    <I18nProvider>
      <Investments market={marketFor([openCampaign, endedCampaign])} />
    </I18nProvider>,
  );
  expect(container.querySelector('.card input')).toBeNull();
  expect(container.querySelector('.card details')).toBeNull();
  const archive = container.querySelector('details.registry-closed') as HTMLDetailsElement;
  expect(archive.open).toBe(false);
  expect(archive.textContent).toContain('Goal missed');
  expect(screen.getAllByRole('link', { name: 'View campaign' }).length).toBe(2);
  const filters = screen.getByRole('button', { name: 'Filters' });
  fireEvent.click(filters);
  expect(filters.getAttribute('aria-expanded')).toBe('true');
});

test('known staging fixture is grouped for testing without guessing from campaign names', () => {
  setup([openCampaign, { ...openCampaign, id: 'staging-load', name: 'Staging Load' }]);
  const testing = screen.getByRole('region', { name: 'Testing campaigns' });
  expect(within(testing).getByText('Staging Load')).toBeTruthy();
  expect(within(testing).queryByText('QA Open Alpha')).toBeNull();
  expect(within(screen.getByRole('region', { name: 'Open campaigns' })).getByText('QA Open Alpha')).toBeTruthy();
});
