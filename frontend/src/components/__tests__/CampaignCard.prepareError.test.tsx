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

test('surfaces a failed build at the card: localized lead-in plus server detail', () => {
  setup('trustline entry is missing for account');
  const alert = screen.getByRole('alert');
  expect(alert.textContent).toContain('API request failed');
  expect(alert.textContent).toContain('trustline entry is missing');
});

test('renders no build error when none occurred', () => {
  setup();
  expect(screen.queryByRole('alert')).toBeNull();
});
