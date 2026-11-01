// Regression: the podcast page is an honest demo shell - title, explicit
// "no episodes" empty state, planned formats and the demo note all render
// from the i18n catalog, and /podcast resolves as a real route (footer and
// sitemap link to it).
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { I18nProvider } from '../../i18n';
import { PodcastPage } from '../ContentPages';
import { routeFromPath, routePath } from '../../router';

describe('PodcastPage', () => {
  it('renders the honest empty shell from the catalog', () => {
    render(
      <I18nProvider>
        <PodcastPage />
      </I18nProvider>,
    );
    expect(screen.getByRole('heading', { level: 1, name: /Podcast/ })).toBeTruthy();
    expect(screen.getByText('No episodes published yet.')).toBeTruthy();
    expect(screen.getByText('Issuer interviews')).toBeTruthy();
    expect(screen.getByText('Investor education')).toBeTruthy();
    expect(screen.getByText('Platform updates')).toBeTruthy();
    expect(screen.getByText(/Nothing on this page is an offer or investment advice\./)).toBeTruthy();
  });

  it('/podcast is a real route', () => {
    expect(routeFromPath('/podcast')).toEqual({ name: 'podcast' });
    expect(routePath({ name: 'podcast' })).toBe('/podcast');
  });
});
