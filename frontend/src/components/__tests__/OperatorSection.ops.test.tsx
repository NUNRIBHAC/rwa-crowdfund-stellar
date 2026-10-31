import { test, expect, afterEach, beforeEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import OperatorSection from '../OperatorSection';
import { I18nProvider } from '../../i18n';
import { CommunityAuthProvider } from '../../community/CommunityAuth';

const ACTOR = 'G'.repeat(56);

const RECON = {
  generatedAt: '2026-10-31T16:00:00.000Z',
  network: 'testnet',
  semantics: 's',
  quarantinedIntents: 2,
  campaigns: [
    {
      campaignId: 'staging-load',
      onChainRaised: '1470000000',
      journalCovered: '100000000',
      notJournalCovered: '1370000000',
      successContributes: 1,
      successRefunds: 0,
      successWithdraws: 0,
      openIntentHashes: [],
      failedIntents: 0,
      notes: ['on-chain volume exceeds this app journal: test note'],
    },
  ],
};
const AUDIT = [{ id: 'a1', at: 1793000000000, actor: 'admin-key', action: 'company.status', target: 'co_1', detail: 'approved' }];

function stubFetch(overrides: Record<string, unknown> = {}) {
  const routes: Record<string, unknown> = {
    '/api/auth/me': { account: { publicKey: ACTOR, displayName: null }, isOperator: true },
    '/api/operator/applications': { applications: [] },
    '/api/operator/comments': { comments: [] },
    '/api/operator/tickets': { tickets: [] },
    '/api/operator/reconciliation': RECON,
    '/api/operator/audit-log': { audit: AUDIT },
    ...overrides,
  };
  vi.stubGlobal('fetch', async (input: RequestInfo | URL) => {
    const url = String(input);
    for (const [k, v] of Object.entries(routes)) {
      if (url.includes(k)) return { ok: true, status: 200, json: async () => v } as Response;
    }
    return { ok: false, status: 404, json: async () => ({ error: 'not found' }) } as Response;
  });
}

function setup() {
  render(
    <I18nProvider>
      <CommunityAuthProvider messages={{ freighterMissing: 'x', walletNoSign: 'y' }}>
        <OperatorSection campaigns={[]} />
      </CommunityAuthProvider>
    </I18nProvider>,
  );
}

beforeEach(() => localStorage.setItem('blockallisto-community-token', 'tok'));
afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.unstubAllGlobals();
});

test('reconciliation tab renders the operational aid with honest framing and quarantine warning', async () => {
  stubFetch();
  setup();
  const chip = await screen.findByRole('button', { name: 'Reconciliation' });
  fireEvent.click(chip);
  await screen.findByText('staging-load');
  expect(screen.getByText(/not missing funds/)).toBeTruthy();
  expect(screen.getByText(/2 quarantined journal row/)).toBeTruthy();
  expect(screen.getByText(/test note/)).toBeTruthy();
});

test('audit tab renders recent-history framing and entries', async () => {
  stubFetch();
  setup();
  const chip = await screen.findByRole('button', { name: 'Audit log' });
  fireEvent.click(chip);
  await screen.findByText('company.status');
  expect(screen.getByText(/not an immutable audit trail/)).toBeTruthy();
  expect(screen.getByText('admin-key')).toBeTruthy();
  expect(screen.getByText('approved')).toBeTruthy();
});

test('audit tab shows the honest empty state', async () => {
  stubFetch({ '/api/operator/audit-log': { audit: [] } });
  setup();
  const chip = await screen.findByRole('button', { name: 'Audit log' });
  fireEvent.click(chip);
  await screen.findByText('No admin actions recorded yet.');
});

test('failing operator endpoints surface the error banner with retry, not fake data', async () => {
  vi.stubGlobal('fetch', async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes('/api/auth/me')) {
      return { ok: true, status: 200, json: async () => ({ account: { publicKey: ACTOR, displayName: null }, isOperator: true }) } as Response;
    }
    return { ok: false, status: 503, json: async () => ({ error: 'OPERATOR_WALLETS not configured; operator endpoints disabled' }) } as Response;
  });
  setup();
  await waitFor(() => expect(screen.queryByRole('alert')).toBeTruthy());
  expect(screen.getByRole('alert').textContent).toContain('operator endpoints disabled');
  expect(screen.queryByText('staging-load')).toBeNull();
});
