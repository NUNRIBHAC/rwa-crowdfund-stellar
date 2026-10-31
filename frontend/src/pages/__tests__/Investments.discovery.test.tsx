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
