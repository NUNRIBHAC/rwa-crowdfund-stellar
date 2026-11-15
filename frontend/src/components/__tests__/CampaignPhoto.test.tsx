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
    expect(screen.getByText(/Illustrative photo/).closest('figure')?.className).toBe(`${variant}-photo`);
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
  expect(screen.getByRole('img').getAttribute('src')).toBe('https://blockallisto-media.nunrib-df6.workers.dev/illustrative-covers/blocks-0.svg');
  expect(screen.getByText(/Illustrative cover/)).toBeTruthy();
  delete CAMPAIGN_PHOTOS['photo-failure-test'];
});

test('responsive formats keep the JPEG fallback and the original photo caption', () => {
  const { container } = render(
    <I18nProvider>
      <CampaignPhoto campaignId="qa-postclose" variant="campaign" />
    </I18nProvider>,
  );
  const img = screen.getByRole('img');
  expect(img.getAttribute('width')).toBe('1280');
  expect(img.getAttribute('height')).toBe('960');
  expect(img.getAttribute('src')).toBe(campaignPhoto('qa-postclose'));
  expect(img.getAttribute('fetchpriority')).toBe('high');
  expect(img.hasAttribute('loading')).toBe(false);
  const sources = [...container.querySelectorAll('source')];
  expect(sources.map((source) => source.type)).toEqual(['image/avif', 'image/webp']);
  for (const source of sources) {
    expect(source.srcset.split(',')).toHaveLength(3);
    for (const width of [480, 800, 1280]) expect(source.srcset).toContain(`${width}w`);
    expect(source.sizes).toContain('max-width: 900px');
  }
  expect(screen.getByText(/Illustrative photo/)).toBeTruthy();
  fireEvent.error(img);
  expect(container.querySelectorAll('source')).toHaveLength(0);
  expect(img.hasAttribute('width')).toBe(false);
  expect(screen.getByText(/Illustrative cover/)).toBeTruthy();
});

test('a future custom photo never inherits solar responsive sources', () => {
  CAMPAIGN_PHOTOS['custom-responsive-test'] = '/future-issuer.jpg';
  try {
    const { container } = render(
      <I18nProvider>
        <CampaignPhoto campaignId="custom-responsive-test" variant="card" />
      </I18nProvider>,
    );
    expect(container.querySelectorAll('source')).toHaveLength(0);
    expect(screen.getByRole('img').getAttribute('src')).toBe('/future-issuer.jpg');
    expect(screen.getByRole('img').getAttribute('loading')).toBe('lazy');
  } finally {
    delete CAMPAIGN_PHOTOS['custom-responsive-test'];
  }
});

test('only a first candidate within the viewport is promoted from lazy to eager/high', () => {
  const original = HTMLElement.prototype.getBoundingClientRect;
  HTMLElement.prototype.getBoundingClientRect = () => ({ top: 100, bottom: 400, left: 0, right: 300, width: 300, height: 300, x: 0, y: 100, toJSON() {} });
  try {
    render(
      <I18nProvider>
        <CampaignPhoto campaignId="staging-load" variant="card" firstVisible />
        <CampaignPhoto campaignId="qa-postclose" variant="card" />
      </I18nProvider>,
    );
    const images = screen.getAllByRole('img');
    expect(images[0].getAttribute('loading')).toBe('eager');
    expect(images[0].getAttribute('fetchpriority')).toBe('high');
    expect(images[1].getAttribute('loading')).toBe('lazy');
    expect(images[1].hasAttribute('fetchpriority')).toBe(false);
  } finally {
    HTMLElement.prototype.getBoundingClientRect = original;
  }
});
test('a first candidate below the viewport stays lazy', () => {
  const original = HTMLElement.prototype.getBoundingClientRect;
  HTMLElement.prototype.getBoundingClientRect = () => ({
    top: 10000,
    bottom: 10300,
    left: 0,
    right: 300,
    width: 300,
    height: 300,
    x: 0,
    y: 10000,
    toJSON() {},
  });
  try {
    render(
      <I18nProvider>
        <CampaignPhoto campaignId="staging-load" variant="card" firstVisible />
      </I18nProvider>,
    );
    expect(screen.getByRole('img').getAttribute('loading')).toBe('lazy');
    expect(screen.getByRole('img').hasAttribute('fetchpriority')).toBe(false);
  } finally {
    HTMLElement.prototype.getBoundingClientRect = original;
  }
});
