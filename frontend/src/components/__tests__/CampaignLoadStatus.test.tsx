// Integration-like app read failure/retry test, without wallet or write calls.
import { test, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import App from '../../App';
import { I18nProvider } from '../../i18n';
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  window.history.replaceState(null, '', '/');
});
test('campaign load failure offers retry without empty/not-found claim; retry settles', async () => {
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
  const retry = await screen.findByRole('button', { name: 'Retry', exact: true });
  await screen.findByText('The service is temporarily unavailable. Please try again in a moment.');
  fireEvent.click(retry);
  await waitFor(() => expect(screen.queryByRole('button', { name: 'Retry', exact: true })).toBeNull());
  expect(campaignCalls).toBeGreaterThan(1);
});
