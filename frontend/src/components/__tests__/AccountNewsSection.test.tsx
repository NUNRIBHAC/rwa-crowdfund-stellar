// Regression: the account campaign-news feed shows only news for campaigns
// the wallet invested in (never other campaigns' news), newest first, with
// the campaign name linked, and an honest empty state when there is none.
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '../../i18n';
import AccountNewsSection from '../AccountNewsSection';

const FEED = {
  news: [
    { id: 'n1', campaignId: 'demo-solar', title: 'Older invested news', body: 'body 1', createdAt: 1730000000000 },
    { id: 'n2', campaignId: 'other-campaign', title: 'Unrelated campaign news', body: 'body 2', createdAt: 1730000200000 },
    { id: 'n3', campaignId: 'demo-solar', title: 'Newer invested news', body: 'body 3', createdAt: 1730000100000 },
  ],
};

function ok(v: unknown) {
  return new Response(JSON.stringify(v), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

function renderSection(campaigns: { id: string; name: string }[]) {
  return render(
    <I18nProvider>
      <AccountNewsSection campaigns={campaigns} />
    </I18nProvider>,
  );
}

describe('AccountNewsSection', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('shows only invested-campaign news, newest first, with campaign name', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(ok(FEED)));
    renderSection([{ id: 'demo-solar', name: 'Demo Solar' }]);
    expect(await screen.findByText('Newer invested news')).toBeTruthy();
    expect(screen.getByText('Older invested news')).toBeTruthy();
    expect(screen.queryByText('Unrelated campaign news')).toBeNull();
    const links = screen.getAllByRole('link', { name: 'Demo Solar' });
    expect(links.length).toBe(2);
    expect(links[0].getAttribute('href')).toBe('/campaigns/demo-solar');
    const titles = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
    expect(titles).toEqual(['Newer invested news', 'Older invested news']);
  });

  it('honest empty states', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(ok(FEED)));
    const { unmount } = renderSection([{ id: 'demo-solar', name: 'Demo Solar' }]);
    expect(await screen.findByText('Newer invested news')).toBeTruthy();
    unmount();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async () => ok({ news: [] })),
    );
    const empty = renderSection([{ id: 'demo-solar', name: 'Demo Solar' }]);
    expect(await screen.findByText('No news yet for the campaigns you invested in.')).toBeTruthy();
    empty.unmount();
    renderSection([]);
    expect(await screen.findByText('News from campaigns you invest in will appear here.')).toBeTruthy();
  });
});
