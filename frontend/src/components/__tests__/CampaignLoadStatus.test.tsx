// Integration-like app read failure/retry test, without wallet or write calls.
import { test, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import App from '../../App';
import { I18nProvider } from '../../i18n';

vi.mock('@stellar/freighter-api', () => ({
  isConnected: vi.fn(async () => ({ isConnected: false })),
  requestAccess: vi.fn(),
  signTransaction: vi.fn(),
}));
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  window.history.replaceState(null, '', '/');
});
test('campaign load failure offers retry without empty/not-found claim; retry settles', async () => {
  window.history.replaceState(null, '', '/campaigns/demo-solar');
  let campaignCalls = 0;
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input) => {
      const url = String(input);
      if (url.startsWith('/api/campaigns') && !url.includes('/metadata')) {
        campaignCalls++;
        if (campaignCalls === 1) return { ok: false, status: 503, json: async () => ({ code: 'API_UNAVAILABLE', error: 'upstream' }) };
        return { ok: true, json: async () => ({ campaigns: [] }) };
      }
      return { ok: true, json: async () => ({ enabled: false, comments: [], episodes: [], news: [] }) };
    }),
  );
  render(
    <I18nProvider>
      <App />
    </I18nProvider>,
  );
  const retry = await screen.findByRole('button', { name: 'Retry' });
  expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('The service is temporarily unavailable. Please try again in a moment.');
  expect(screen.queryByText('Loading campaign…')).toBeNull();
  expect(screen.queryByText('Campaign not found')).toBeNull();
  fireEvent.click(retry);
  await waitFor(() => expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull());
  expect(campaignCalls).toBeGreaterThan(1);
});

test('an in-flight first load explains loading without offering a duplicate retry or claiming empty data', async () => {
  let settle: (value: unknown) => void = () => {};
  vi.stubGlobal(
    'fetch',
    vi.fn((input) => {
      const url = String(input);
      if (url.startsWith('/api/campaigns') && !url.includes('/metadata'))
        return new Promise((resolve) => {
          settle = resolve;
        });
      return Promise.resolve({ ok: true, json: async () => ({ enabled: false, comments: [], episodes: [], news: [] }) });
    }),
  );
  render(
    <I18nProvider>
      <App />
    </I18nProvider>,
  );
  const status = await screen.findByRole('status');
  expect(status.closest('.home-introduction')).toBeTruthy();
  expect(screen.getByRole('heading', { level: 1 }).compareDocumentPosition(status) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull();
  expect(screen.queryByText('No deployed campaign configured')).toBeNull();
  settle({ ok: true, json: async () => ({ campaigns: [] }) });
  await waitFor(() => expect(screen.queryByRole('status')).toBeNull());
});

test('mount campaign-load failure stays off static content routes', async () => {
  window.history.replaceState(null, '', '/about');
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input) => {
      const url = String(input);
      if (url.startsWith('/api/campaigns') && !url.includes('/metadata'))
        return { ok: false, status: 503, json: async () => ({ code: 'API_UNAVAILABLE', error: 'upstream' }) };
      return { ok: true, json: async () => ({ enabled: false, comments: [], episodes: [], news: [] }) };
    }),
  );
  const { container } = render(
    <I18nProvider>
      <App />
    </I18nProvider>,
  );
  expect(await screen.findByRole('heading', { level: 1, name: 'About this project' })).toBeTruthy();
  await waitFor(() => expect(container.querySelector('.error-banner')).toBeNull());
  expect(screen.queryByRole('alert')).toBeNull();
  expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull();
});

test('mount campaign-load failure keeps an honest banner on the account consumer route', async () => {
  window.history.replaceState(null, '', '/account');
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input) => {
      const url = String(input);
      if (url.startsWith('/api/campaigns') && !url.includes('/metadata'))
        return { ok: false, status: 503, json: async () => ({ code: 'API_UNAVAILABLE', error: 'upstream' }) };
      return { ok: true, json: async () => ({ enabled: false, comments: [], episodes: [], news: [] }) };
    }),
  );
  const { container } = render(
    <I18nProvider>
      <App />
    </I18nProvider>,
  );
  // Account is a campaign-data consumer route (OperatorSection), so the
  // honest error surface is preserved here even though static routes
  // suppress it.
  await screen.findByRole('alert');
  expect(container.querySelector('.error-banner')?.textContent).toBe('The service is temporarily unavailable. Please try again in a moment.');
});

test('an action error during the first load keeps its own message, not the load slot', async () => {
  window.history.replaceState(null, '', '/');
  vi.stubGlobal(
    'fetch',
    vi.fn((input) => {
      const url = String(input);
      if (url.startsWith('/api/campaigns') && !url.includes('/metadata')) return new Promise(() => {});
      return Promise.resolve({ ok: true, json: async () => ({ enabled: false, comments: [], episodes: [], news: [] }) });
    }),
  );
  render(
    <I18nProvider>
      <App />
    </I18nProvider>,
  );
  // First load still in flight; a wallet-connect failure must surface with
  // its own localized message, not the load slot's unavailable text.
  fireEvent.click(await screen.findByRole('button', { name: 'Connect wallet' }));
  const banner = await screen.findByRole('alert');
  await waitFor(() => expect(banner.textContent).toBe('Freighter wallet extension not detected. Install Freighter, then retry Connect.'));
  expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull();
  const status = screen.getByRole('status');
  expect(status.textContent).toBe('Loading campaign…');
});
