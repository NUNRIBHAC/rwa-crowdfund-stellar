// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import AccountAutomaticRefunds from './AccountAutomaticRefunds';
import { I18nProvider } from '../i18n';
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
const campaign = 'C' + 'A'.repeat(55);
const fixture = (wallet = 'wallet', token = 'token') => (
  <I18nProvider initialLocale="en">
    <AccountAutomaticRefunds wallet={wallet} token={token} />
  </I18nProvider>
);
test('reads the authenticated route without an actor query, renders only safe state', async () => {
  const fetcher = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ network: 'testnet', productionEligible: false, refunds: [{ campaign, status: 'paid', amount: '10000000' }] }),
  });
  vi.stubGlobal('fetch', fetcher);
  render(fixture());
  await waitFor(() => expect(screen.getByRole('status')).toBeTruthy());
  expect(fetcher.mock.calls[0][0]).toBe('/api/auth/automatic-refunds');
  expect(fetcher.mock.calls[0][1].headers.Authorization).toBe('Bearer token');
  expect(screen.queryByRole('button')).toBeNull();
  expect(screen.getByText(/1 testnet XLM/)).toBeTruthy();
});
test('errors are localized and remote errors never appear', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, json: async () => ({ error: 'SECRET_XDR' }) }));
  render(fixture());
  await waitFor(() => expect(screen.getByRole('status')).toBeTruthy());
  expect(screen.queryByText(/SECRET_XDR/)).toBeNull();
});
test('switching sessions hides stale evidence immediately, cookie session emits no bearer', async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({ network: 'testnet', productionEligible: false, refunds: [{ campaign, status: 'paid', amount: '10000000' }] }),
    })
    .mockImplementation(() => new Promise(() => {}));
  vi.stubGlobal('fetch', fetcher);
  const { rerender } = render(fixture());
  await waitFor(() => expect(screen.getByRole('status')).toBeTruthy());
  rerender(fixture('other', 'cookie-session'));
  expect(screen.queryByRole('status')).toBeNull();
  await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2));
  expect(fetcher.mock.calls[1][1].headers).toEqual({});
});

for (const reason of ['not_configured', 'unsupported_network'])
  test(reason + ' is not displayed as a service failure', async () => {
    const f = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ enabled: false, reason }) });
    vi.stubGlobal('fetch', f);
    const { container } = render(fixture());
    await waitFor(() => expect(f).toHaveBeenCalled());
    await new Promise((r) => setTimeout(r, 10));
    expect(container.textContent).toBe('');
  });
test('configured 503 still shows unavailable rather than hiding', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503, json: async () => ({ code: 'API_UNAVAILABLE' }) }));
  render(fixture());
  await waitFor(() => expect(screen.getByRole('status')).toBeTruthy());
});

for (const locale of ['en', 'pt', 'es', 'fr', 'de', 'hi', 'ja', 'ko', 'ar', 'zh-CN', 'zh-TW'])
  test('amount asset comes from locale ' + locale, async () => {
    const catalog = await import('../i18n/locales/' + locale + '.ts');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ network: 'testnet', productionEligible: false, refunds: [{ campaign, status: 'paid', amount: '10000000' }] }),
      }),
    );
    render(
      <I18nProvider initialLocale={locale as any}>
        <AccountAutomaticRefunds wallet="wallet" token="token" />
      </I18nProvider>,
    );
    await waitFor(() => expect(screen.getByRole('status')).toBeTruthy());
    expect(
      screen.getByText(new RegExp((Object.values(catalog)[0] as { intent: { xlmTestnet: string } }).intent.xlmTestnet.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))),
    ).toBeTruthy();
  });
