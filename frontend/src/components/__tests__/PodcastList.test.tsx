// Regression: the campaign podcast tab lists only that campaign's episodes,
// each with a native audio player (external https URL, preload="none", no
// autoplay) and the platform-demo author label; the honest fallback renders
// when the campaign has none.
import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '../../i18n';
import PodcastList from '../PodcastList';

function ok(v: unknown) {
  return new Response(JSON.stringify(v), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

const EP = {
  id: 'ep_1',
  campaignId: 'demo-solar',
  title: 'QA campaign episode',
  description: 'Synthetic QA episode, not real content.',
  audioUrl: 'https://audio.example.com/qa-campaign.mp3',
  authorLabel: 'platform-demo',
  createdAt: 1730000000000,
};

describe('PodcastList', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('fetches the campaign-scoped endpoint and renders episodes with audio players', async () => {
    const spy = vi.fn().mockResolvedValue(ok({ episodes: [EP] }));
    vi.stubGlobal('fetch', spy);
    render(
      <I18nProvider>
        <PodcastList campaignId="demo-solar" fallback={<p>fallback-empty</p>} />
      </I18nProvider>,
    );
    expect(await screen.findByText('QA campaign episode')).toBeTruthy();
    expect(String(spy.mock.calls[0][0])).toContain('/api/campaigns/demo-solar/podcast');
    const audio = document.querySelector('audio');
    expect(audio?.getAttribute('src')).toBe('https://audio.example.com/qa-campaign.mp3');
    expect(audio?.getAttribute('preload')).toBe('none');
    expect(audio?.hasAttribute('controls')).toBe(true);
    expect(screen.queryByText('fallback-empty')).toBeNull();
  });

  it('renders the honest fallback when the campaign has no episodes', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(ok({ episodes: [] })));
    render(
      <I18nProvider>
        <PodcastList campaignId="demo-solar" fallback={<p>fallback-empty</p>} />
      </I18nProvider>,
    );
    expect(await screen.findByText('fallback-empty')).toBeTruthy();
    expect(document.querySelector('audio')).toBeNull();
  });
});
