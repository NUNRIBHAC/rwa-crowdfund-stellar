import { test, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import CampaignCard from '../CampaignCard';
import { I18nProvider } from '../../i18n';
import { FIXTURE_CAMPAIGNS } from '../../fixtures';

afterEach(cleanup);

const card = FIXTURE_CAMPAIGNS[0];

function setup(prepareError?: string) {
  render(
    <I18nProvider>
      <CampaignCard
        campaign={card}
        actor={'G'.repeat(56)}
        busy={false}
        readOnly={false}
        amount="10"
        prepareError={prepareError}
        onAmount={() => {}}
        onPrepare={() => {}}
      />
    </I18nProvider>,
  );
}

test('surfaces a failed build at the card as an alert with the composed message', () => {
  setup('This wallet is not set up for testnet USDC yet (missing trustline). Add a USDC trustline, then try again.');
  const alert = screen.getByRole('alert');
  expect(alert.textContent).toContain('missing trustline');
});

test('renders no build error when none occurred', () => {
  setup();
  expect(screen.queryByRole('alert')).toBeNull();
});
