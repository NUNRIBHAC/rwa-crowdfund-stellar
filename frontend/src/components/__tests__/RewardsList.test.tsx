import { test, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';

vi.mock('../../community/api', async (importOriginal) => {
  const orig = await importOriginal<typeof import('../../community/api')>();
  return { ...orig, fetchCampaignMetadata: vi.fn() };
});

import RewardsList from '../RewardsList';
import { I18nProvider } from '../../i18n';
import { fetchCampaignMetadata } from '../../community/api';

afterEach(cleanup);

const mocked = vi.mocked(fetchCampaignMetadata);

test('renders issuer-authored tiers with the no-promise note and DEMO badge', async () => {
  mocked.mockResolvedValue({
    metadata: {
      campaignId: 'demo-solar',
      industry: 'energy-utilities',
      industryLabel: 'Energy and utilities',
      documents: [],
      rewards: [
        {
          id: 'r1',
          threshold: '[DEMO] fictional sample: from EUR 250',
          description: '[DEMO] Fictional sample reward tier - not a real offer, no reward exists',
          demo: true,
        },
      ],
    },
  });
  render(
    <I18nProvider>
      <RewardsList campaignId="demo-solar" />
    </I18nProvider>,
  );
  await waitFor(() => screen.getByText('Rewards'));
  expect(screen.getByText(/does not promise/)).toBeTruthy();
  expect(screen.getByText(/fictional sample: from EUR 250/)).toBeTruthy();
  expect(screen.getByText('DEMO')).toBeTruthy();
});

test('renders the honest absence note when no tiers are announced', async () => {
  mocked.mockResolvedValue({ metadata: { campaignId: 'x', industry: 'i', industryLabel: 'I', documents: [] } });
  render(
    <I18nProvider>
      <RewardsList campaignId="x" />
    </I18nProvider>,
  );
  await waitFor(() => screen.getByText('No rewards announced for this campaign.'));
  expect(screen.queryByText(/does not promise/)).toBeNull();
});
