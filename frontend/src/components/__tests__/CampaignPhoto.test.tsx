import { afterEach, expect, test } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import CampaignPhoto from '../CampaignPhoto';
import { I18nProvider } from '../../i18n';
import { CAMPAIGN_PHOTOS, campaignPhoto } from '../../data/campaignPhotos';

afterEach(cleanup);

for (const variant of ['card', 'campaign'] as const) {
  test(`${variant}: every future campaign has a visible, honest photo`, () => {
    render(
      <I18nProvider>
        <CampaignPhoto campaignId="future-unlisted-project" variant={variant} />
      </I18nProvider>,
    );
    expect(screen.getByRole('img').getAttribute('src')).toBe(campaignPhoto('future-unlisted-project'));
    expect(screen.getByText(/Illustrative cover/).closest('figure')?.className).toBe(`${variant}-photo`);
  });
}

test('a failed campaign-specific photo falls back without removing the honesty caption', () => {
  CAMPAIGN_PHOTOS['photo-failure-test'] = '/missing-test-photo.jpg';
  render(
    <I18nProvider>
      <CampaignPhoto campaignId="photo-failure-test" variant="card" />
    </I18nProvider>,
  );
  fireEvent.error(screen.getByRole('img'));
  expect(screen.getByRole('img').getAttribute('src')).toBe(campaignPhoto(''));
  expect(screen.getByText(/Illustrative cover/)).toBeTruthy();
  delete CAMPAIGN_PHOTOS['photo-failure-test'];
});
