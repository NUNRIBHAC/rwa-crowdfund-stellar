// Regression: the podcast page is an honest demo shell - title, explicit
// "no episodes" empty state, planned formats and the demo note all render
// from the i18n catalog, and /podcast resolves as a real route (footer and
// sitemap link to it). Published episodes render with a native audio player
// and the platform-demo author label; nothing is ever invented.
import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '../../i18n';
import { PodcastPage } from '../ContentPages';
import { routeFromPath, routePath } from '../../router';

function ok(v: unknown) {
  return new Response(JSON.stringify(v), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

function renderPage() {
  return render(
    <I18nProvider>
      <PodcastPage />
    </I18nProvider>,
  );
}

describe('PodcastPage', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('renders the honest empty shell from the catalog', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(ok({ episodes: [] })));
    renderPage();
    expect(screen.getByRole('heading', { level: 1, name: /Podcast/ })).toBeTruthy();
    expect(await screen.findByText('No episodes published yet.')).toBeTruthy();
    expect(screen.getByText('Issuer interviews')).toBeTruthy();
    expect(screen.getByText('Investor education')).toBeTruthy();
    expect(screen.getByText('Platform updates')).toBeTruthy();
    expect(screen.getByText(/Nothing on this page is an offer or investment advice\./)).toBeTruthy();
  });

  it('renders published episodes with an audio player and the demo author label', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        ok({
          episodes: [
            {
              id: 'ep_1',
              campaignId: null,
              title: 'QA episode one',
              description: 'Synthetic QA episode, not real content.',
              audioUrl: 'https://audio.example.com/qa-episode-one.mp3',
              authorLabel: 'platform-demo',
              createdAt: 1730000000000,
            },
          ],
        }),
      ),
    );
    renderPage();
    expect(await screen.findByText('QA episode one')).toBeTruthy();
    expect(screen.getByText('Synthetic QA episode, not real content.')).toBeTruthy();
    // Honest empty state is gone once real (platform-published) episodes exist.
    expect(screen.queryByText('No episodes published yet.')).toBeNull();
    // Native audio player, no autoplay: preload="none" and the external URL.
    const audio = document.querySelector('audio');
    expect(audio).toBeTruthy();
    expect(audio?.getAttribute('src')).toBe('https://audio.example.com/qa-episode-one.mp3');
    expect(audio?.getAttribute('preload')).toBe('none');
    expect(audio?.hasAttribute('controls')).toBe(true);
    // Planned formats section stays.
    expect(screen.getByText('Issuer interviews')).toBeTruthy();
  });

  it('/podcast is a real route', () => {
    expect(routeFromPath('/podcast')).toEqual({ name: 'podcast' });
    expect(routePath({ name: 'podcast' })).toBe('/podcast');
  });
});
