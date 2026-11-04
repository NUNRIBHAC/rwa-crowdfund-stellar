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
