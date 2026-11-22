import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import App from '../../App';
import { I18nProvider } from '../../i18n';
import { FIXTURE_CAMPAIGNS } from '../../fixtures';
import { en } from '../../i18n/locales/en';
import { SAMPLE_CONCEPTS } from '../../data/sampleConcepts';

vi.mock('@stellar/freighter-api', () => ({
  isConnected: vi.fn(async () => ({ isConnected: false })),
  requestAccess: vi.fn(),
  signTransaction: vi.fn(),
}));
afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.unstubAllGlobals();
  window.history.replaceState(null, '', '/');
});
function start(url: string) {
  window.history.replaceState(null, '', url);
  const live = { ...FIXTURE_CAMPAIGNS[0], id: 'live-registry-example', name: 'Live registry example' };
  const fetchMock = vi.fn(async (input: unknown) => {
    const address = String(input);
    const data =
      address.startsWith('/api/campaigns') && !address.includes('/metadata') ? { campaigns: [live] } : { enabled: false, comments: [], episodes: [], news: [] };
    return { ok: true, json: async () => data };
  });
  vi.stubGlobal('fetch', fetchMock);
  return {
    ...render(
      <I18nProvider>
        <App />
      </I18nProvider>,
    ),
    fetchMock,
  };
}

for (const concept of SAMPLE_CONCEPTS) {
  test(`${concept.id}: an actual App boot moves an old campaign URL into Learn only`, async () => {
    const { container } = start(`/campaigns/${concept.id}?fixtures=1`);
    await waitFor(() => expect(container.querySelectorAll('[data-concept]')).toHaveLength(7));
    expect(window.location.pathname).toBe('/learn');
    expect(window.location.hash).toBe(`#learn-${concept.id}`);
    expect(window.location.search).toBe('');
    expect(container.querySelector(`#learn-${concept.id}`)).toBeTruthy();
    expect(container.querySelector('.campaign-page')).toBeNull();
    expect(container.querySelector('[data-testnet-contract]')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Contribute' })).toBeNull();
  });
}

test('default catalog shows 44 fictional campaigns, with educational concepts reserved for Learn', async () => {
  const { container } = start('/campaigns');
  await waitFor(() => expect(screen.getByRole('status').textContent).toBe('44 results shown'));
  expect(container.querySelectorAll('.card h3 a')).toHaveLength(44);
  expect(container.querySelectorAll('[data-concept]')).toHaveLength(0);
  expect(screen.getByRole('button', { name: en.emptyState.fixtureBack })).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Contribute' })).toBeNull();
});

test('switching the default catalog to the live registry uses only the live API records', async () => {
  const { container } = start('/campaigns');
  fireEvent.click(screen.getByRole('button', { name: en.emptyState.fixtureBack }));
  await waitFor(() => expect(screen.getByRole('status').textContent).toBe('1 result shown'));
  expect(container.querySelectorAll('.card h3 a')).toHaveLength(1);
  expect(container.querySelector('.card h3 a')?.textContent).toBe('Live registry example');
  expect(container.querySelectorAll('[data-concept]')).toHaveLength(0);
});

test('default presentation mode does not carry sample account restrictions into the account route', async () => {
  const { container } = start('/campaigns');
  fireEvent.click(screen.getByRole('link', { name: 'My account' }));
  await waitFor(() => expect(window.location.pathname).toBe('/account'));
  expect(screen.queryByText(en.account.fixtureNote)).toBeNull();
  expect(container.querySelector('.fixture-banner')).toBeNull();
});
