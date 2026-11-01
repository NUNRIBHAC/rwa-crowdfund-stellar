// Status-state coverage for the investor-scoped reports section. The gating
// proof lives in the HTTP status mapping: 401, 403 and 503/404 must each
// render their own explicit state and must NEVER fall through to the
// "No reports published yet" empty state (which is reserved for a verified
// 200 with an empty list).
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ReportsList from './ReportsList';
import { CommunityAuthProvider } from '../community/CommunityAuth';

function resp(status: number, v: unknown) {
  return new Response(JSON.stringify(v), { status, headers: { 'Content-Type': 'application/json' } });
}

// The auth provider calls /api/auth/me on mount with the stored token; every
// scenario stubs fetch per-URL and returns a FRESH Response per call (a
// consumed body would poison the second reader).
const ME = { account: { publicKey: 'G' + 'A'.repeat(55), displayName: null, createdAt: 1 }, isOperator: false };
function stubScenario(reports: { status: number; body: unknown }) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation((url: string) => {
      if (String(url).includes('/api/auth/me')) return Promise.resolve(resp(200, ME));
      return Promise.resolve(resp(reports.status, reports.body));
    }),
  );
}

const EN = {
  signIn: 'Sign in with your community account to view investor reports.',
  investorsOnly: 'Investor reports are available to investors in this campaign.',
  unavailable: 'Investor reports are temporarily unavailable - your investment status could not be verified right now. Please try again later.',
  empty: 'No reports published yet.',
  authorDemo: 'posted by the platform (demo content - no verified issuer identity)',
  kindUse: 'Use of proceeds',
  useUnverified: 'The withdrawal is recorded on-chain; how the proceeds were used is stated by the operator and not verified by the platform.',
};

function renderList() {
  return render(
    <CommunityAuthProvider messages={{ freighterMissing: 'x', walletNoSign: 'y' }}>
      <ReportsList campaignId="demo-solar" />
    </CommunityAuthProvider>,
  );
}

describe('ReportsList status states', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it('no session token renders the sign-in state without any request', async () => {
    const f = vi.fn();
    vi.stubGlobal('fetch', f);
    renderList();
    expect(await screen.findByText(EN.signIn)).toBeTruthy();
    expect(f).not.toHaveBeenCalled();
    expect(screen.queryByText(EN.empty)).toBeNull();
  });

  it('401 renders the sign-in state, never the empty state', async () => {
    localStorage.setItem('blockallisto-community-token', 'expired-token');
    stubScenario({ status: 401, body: { error: 'invalid session' } });
    renderList();
    expect(await screen.findByText(EN.signIn)).toBeTruthy();
    expect(screen.queryByText(EN.empty)).toBeNull();
  });

  it('403 renders the investors-only state, never the empty state', async () => {
    localStorage.setItem('blockallisto-community-token', 'tok');
    stubScenario({ status: 403, body: { error: 'post-funding reports are available to investors in this campaign' } });
    renderList();
    expect(await screen.findByText(EN.investorsOnly)).toBeTruthy();
    expect(screen.queryByText(EN.empty)).toBeNull();
  });

  it('503 (entitlement unverifiable) renders temporary-unavailable, never investors-only or empty', async () => {
    localStorage.setItem('blockallisto-community-token', 'tok');
    stubScenario({ status: 503, body: { error: 'could not verify on-chain investor entitlement; refusing report access' } });
    renderList();
    expect(await screen.findByText(EN.unavailable)).toBeTruthy();
    expect(screen.queryByText(EN.investorsOnly)).toBeNull();
    expect(screen.queryByText(EN.empty)).toBeNull();
  });

  it('verified 200 with an empty list is the only path to the empty state', async () => {
    localStorage.setItem('blockallisto-community-token', 'tok');
    stubScenario({ status: 200, body: { reports: [] } });
    renderList();
    expect(await screen.findByText(EN.empty)).toBeTruthy();
  });

  it('use_of_proceeds reports carry the on-chain-verified / use-unverified note and demo label', async () => {
    localStorage.setItem('blockallisto-community-token', 'tok');
    const report = {
      id: 'report_1',
      campaignId: 'demo-solar',
      kind: 'use_of_proceeds',
      title: 'Proceeds report',
      body: 'Body text',
      authorLabel: 'platform-demo',
      createdAt: 1730000000000,
    };
    stubScenario({ status: 200, body: { reports: [report] } });
    renderList();
    expect(await screen.findByText('Proceeds report')).toBeTruthy();
    expect(screen.getByText(EN.useUnverified)).toBeTruthy();
    expect(screen.getByText(new RegExp(EN.kindUse))).toBeTruthy();
    expect(screen.getByText(new RegExp('posted by the platform'))).toBeTruthy();
  });
});
