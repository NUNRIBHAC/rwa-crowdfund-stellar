// Investor documents section: approved docs render with demo badge and an
// authorized (bearer) download; failure shows an unavailable note, never a
// false empty state; no token -> nothing rendered.
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '../../i18n';
import AccountInvestmentDocuments from '../AccountInvestmentDocuments';

function ok(v: unknown) {
  return new Response(JSON.stringify(v), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

function renderSection() {
  return render(
    <I18nProvider>
      <AccountInvestmentDocuments campaignId="qa-newsproof" />
    </I18nProvider>,
  );
}

describe('AccountInvestmentDocuments', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it('renders nothing without a community session token', () => {
    const { container } = renderSection();
    expect(container.innerHTML).toBe('');
  });

  it('lists approved documents with the demo badge', async () => {
    localStorage.setItem('blockallisto-community-token', 'tok');
    const fetchMock = vi.fn().mockResolvedValue(
      ok({
        documents: [
          {
            id: 'idoc_1',
            campaignId: 'qa-newsproof',
            title: '[SYNTHETIC] Sample terms',
            kind: 'terms',
            status: 'approved',
            demo: true,
            createdAt: 1,
            approvedAt: 2,
          },
        ],
        demo: true,
      }),
    );
    vi.stubGlobal('fetch', fetchMock);
    renderSection();
    expect(await screen.findByText(/\[SYNTHETIC\] Sample terms/)).toBeTruthy();
    expect(screen.getByText('DEMO')).toBeTruthy();
    // bearer token used, never a URL token
    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers.Authorization).toBe('Bearer tok');
  });

  it('load failure shows an unavailable note, not a false empty state', async () => {
    localStorage.setItem('blockallisto-community-token', 'tok');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('down')));
    renderSection();
    expect(await screen.findByText('Investment documents could not be loaded. That does not mean there are none - try again later.')).toBeTruthy();
  });

  it('honest empty state on a loaded zero-document feed', async () => {
    localStorage.setItem('blockallisto-community-token', 'tok');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(ok({ documents: [], demo: true })));
    renderSection();
    expect(await screen.findByText('No investment documents are available for this campaign yet.')).toBeTruthy();
  });
});
