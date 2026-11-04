import { test, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import CampaignCard from '../CampaignCard';
import { I18nProvider } from '../../i18n';
import { FIXTURE_CAMPAIGNS } from '../../fixtures';
import type { Campaign } from '../../types';

afterEach(cleanup);

const openUnfunded = FIXTURE_CAMPAIGNS[0];
const endedFunded = FIXTURE_CAMPAIGNS[2];
const past = String(Math.floor(Date.now() / 1000) - 86400);
const actor = 'G'.repeat(56);

function setup(campaign: Campaign) {
  render(
    <I18nProvider>
      <CampaignCard campaign={campaign} actor={actor} busy={false} readOnly={false} amount="10" onAmount={() => {}} onPrepare={() => {}} />
    </I18nProvider>,
  );
}

const names = () => screen.queryAllByRole('button').map((b) => b.textContent);

test('open unfunded campaign offers contribute only', () => {
  setup(openUnfunded);
  expect(screen.getByRole('button', { name: 'Contribute' })).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Refund me' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Creator withdraw' })).toBeNull();
});

test('open fully subscribed campaign offers no actions and explains why', () => {
  setup({ ...openUnfunded, id: 'fixture-funded-open', raised: openUnfunded.config.goal });
  expect(names()).not.toContain('Contribute');
  expect(names()).not.toContain('Refund me');
  expect(names()).not.toContain('Creator withdraw');
  expect(screen.getByText(/fully subscribed/)).toBeTruthy();
});

test('ended underfunded campaign offers refund only', () => {
  setup({
    ...openUnfunded,
    id: 'fixture-ended-under',
    config: { ...openUnfunded.config, deadline: past },
  });
  expect(screen.getByRole('button', { name: 'Refund me' })).toBeTruthy();
  expect(names()).not.toContain('Contribute');
  expect(names()).not.toContain('Creator withdraw');
  expect(screen.getByText(/ended below its goal/)).toBeTruthy();
});

test('ended funded campaign offers creator withdraw only', () => {
  setup(endedFunded);
  expect(screen.getByRole('button', { name: 'Creator withdraw' })).toBeTruthy();
  expect(names()).not.toContain('Contribute');
  expect(names()).not.toContain('Refund me');
  expect(screen.getByText(/ended after reaching its goal\. Under/)).toBeTruthy();
});

test('ended funded withdrawn campaign offers nothing and says so', () => {
  setup({ ...endedFunded, id: 'fixture-withdrawn', withdrawn: true });
  expect(names()).not.toContain('Contribute');
  expect(names()).not.toContain('Refund me');
  expect(names()).not.toContain('Creator withdraw');
  expect(screen.getByText(/creator has withdrawn the raised funds/)).toBeTruthy();
});

test('canonical demo keeps its illustrative photo and caption', () => {
  setup({ ...openUnfunded, id: 'demo-solar' });
  expect(screen.getByAltText('Aerial photograph of a solar farm (illustrative)').getAttribute('src')).toBe('/demo-solar-farm.jpg');
  expect(screen.getByText('Illustrative photo - not the actual project.')).toBeTruthy();
});

test('new campaigns use a clearly labelled illustrative photo', () => {
  setup(openUnfunded);
  expect(screen.getByAltText('Aerial photograph of a solar farm (illustrative)').getAttribute('src')).toBe('/demo-solar-farm.jpg');
  expect(screen.getByText(/Illustrative photo/)).toBeTruthy();
});

test.each([
  [-1, 'ended'],
  [5, 'soon'],
  [57, 'open'],
])('deadline status has a distinct tone for %s days', (days, tone) => {
  const campaign = { ...openUnfunded, config: { ...openUnfunded.config, deadline: String(Math.floor(Date.now() / 1000) + Number(days) * 86400) } };
  setup(campaign);
  expect(document.querySelector(`.deadline-status-${tone}`)?.textContent).toBeTruthy();
});
