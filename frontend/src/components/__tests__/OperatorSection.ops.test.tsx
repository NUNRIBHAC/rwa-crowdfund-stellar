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
    '/api/operator/issuer-applications': { applications: [] },
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
  expect(screen.getByText(/Journal rows in quarantine requiring operator review: 2/)).toBeTruthy();
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

test('podcast tab publishes an episode through the operator route as platform demo content', async () => {
  let posted: Record<string, unknown> | null = null;
  const routes: Record<string, unknown> = {
    '/api/auth/me': { account: { publicKey: ACTOR, displayName: null }, isOperator: true },
    '/api/operator/issuer-applications': { applications: [] },
    '/api/operator/comments': { comments: [] },
    '/api/operator/tickets': { tickets: [] },
    '/api/operator/reconciliation': RECON,
    '/api/operator/audit-log': { audit: AUDIT },
  };
  vi.stubGlobal('fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.includes('/api/operator/podcast/episodes') && init?.method === 'POST') {
      posted = JSON.parse(String(init.body)) as Record<string, unknown>;
      return {
        ok: true,
        status: 201,
        json: async () => ({ episode: { id: 'ep_new', ...posted, authorLabel: 'platform-demo', createdAt: 1 } }),
      } as Response;
    }
    for (const [k, v] of Object.entries(routes)) {
      if (url.includes(k)) return { ok: true, status: 200, json: async () => v } as Response;
    }
    return { ok: false, status: 404, json: async () => ({ error: 'not found' }) } as Response;
  });
  render(
    <I18nProvider>
      <CommunityAuthProvider messages={{ freighterMissing: 'x', walletNoSign: 'y' }}>
        <OperatorSection campaigns={[{ id: 'staging-load', name: 'Staging Load' }]} />
      </CommunityAuthProvider>
    </I18nProvider>,
  );
  fireEvent.click(await screen.findByRole('button', { name: 'Podcast' }));
  fireEvent.change(await screen.findByLabelText('Episode title'), { target: { value: 'QA episode two' } });
  fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Synthetic QA episode, not real content.' } });
  fireEvent.change(screen.getByLabelText('Audio URL (https)'), { target: { value: 'https://audio.example.com/ep-two.mp3' } });
  fireEvent.click(screen.getByRole('button', { name: 'Publish episode' }));
  await waitFor(() => expect(posted).toBeTruthy());
  expect(posted).toEqual({
    title: 'QA episode two',
    description: 'Synthetic QA episode, not real content.',
    audioUrl: 'https://audio.example.com/ep-two.mp3',
    campaignId: null,
  });
  expect(await screen.findByText('Episode published as platform demo content.')).toBeTruthy();
  await screen.findByText('Episode published as platform demo content.');
  fireEvent.click(screen.getByRole('button', { name: 'Tickets' }));
  expect(screen.queryByText('Episode published as platform demo content.')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Podcast' }));
  expect(screen.queryByText('Episode published as platform demo content.')).toBeNull();
});

test('podcast tab rejects a non-https audio URL without posting', async () => {
  let posts = 0;
  const routes: Record<string, unknown> = {
    '/api/auth/me': { account: { publicKey: ACTOR, displayName: null }, isOperator: true },
    '/api/operator/issuer-applications': { applications: [] },
    '/api/operator/comments': { comments: [] },
    '/api/operator/tickets': { tickets: [] },
    '/api/operator/reconciliation': RECON,
    '/api/operator/audit-log': { audit: AUDIT },
  };
  vi.stubGlobal('fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.includes('/api/operator/podcast/episodes') && init?.method === 'POST') {
      posts += 1;
      return { ok: true, status: 201, json: async () => ({ episode: {} }) } as Response;
    }
    for (const [k, v] of Object.entries(routes)) {
      if (url.includes(k)) return { ok: true, status: 200, json: async () => v } as Response;
    }
    return { ok: false, status: 404, json: async () => ({ error: 'not found' }) } as Response;
  });
  render(
    <I18nProvider>
      <CommunityAuthProvider messages={{ freighterMissing: 'x', walletNoSign: 'y' }}>
        <OperatorSection campaigns={[]} />
      </CommunityAuthProvider>
    </I18nProvider>,
  );
  fireEvent.click(await screen.findByRole('button', { name: 'Podcast' }));
  fireEvent.change(await screen.findByLabelText('Episode title'), { target: { value: 'Bad scheme' } });
  fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Must not be posted.' } });
  fireEvent.change(screen.getByLabelText('Audio URL (https)'), { target: { value: 'http://insecure.example.com/ep.mp3' } });
  fireEvent.click(screen.getByRole('button', { name: 'Publish episode' }));
  expect(await screen.findByText('Title, description and an https audio URL are required.')).toBeTruthy();
  expect(posts).toBe(0);
});

test('PT generated reconciliation notes are localized, while older free-text responses stay verbatim', async () => {
  localStorage.setItem('blockallisto-language', 'pt');
  stubFetch({
    '/api/operator/reconciliation': {
      ...RECON,
      campaigns: [{ ...RECON.campaigns[0], noteCodes: ['CHAIN_UNAVAILABLE'], noteParams: [{}], notes: ['on-chain read unavailable for this campaign'] }],
    },
  });
  setup();
  fireEvent.click(await screen.findByRole('button', { name: 'Reconciliação' }));
  expect(await screen.findByText('A leitura on-chain está indisponível.')).toBeTruthy();
  expect(screen.queryByText('on-chain read unavailable for this campaign')).toBeNull();
});

// Synthetic-only workflow matrix. Fetch is intercepted; no hosted record changes.
const APP_FIXTURE = {
  id: 'app_fixture',
  publicKey: ACTOR,
  projectName: 'Synthetic project',
  country: 'PT',
  instrumentType: 'test',
  targetAmount: '1',
  description: 'test',
  contactEmail: null,
  status: 'received',
  reviewedBy: null,
  reviewedAt: null,
  reviewNote: null,
  createdAt: 1,
};
const COMMENT_FIXTURE = {
  id: 'comment_fixture',
  publicKey: ACTOR,
  displayName: 'Synthetic author',
  campaignId: 'fixture',
  body: 'Synthetic comment',
  createdAt: 1,
  hiddenAt: null,
};
const TICKET_FIXTURE = {
  id: 'ticket_fixture',
  publicKey: ACTOR,
  kind: 'support',
  subject: 'Synthetic ticket',
  body: 'test',
  status: 'open',
  createdAt: 1,
  closedAt: null,
};
function workflowFetch(data: Record<string, unknown> = {}, fail = false) {
  const writes: { url: string; body: Record<string, unknown> }[] = [];
  const routes: Record<string, unknown> = {
    '/api/auth/me': { account: { publicKey: ACTOR, displayName: null }, isOperator: true },
    '/api/operator/issuer-applications': { applications: [APP_FIXTURE] },
    '/api/operator/comments': { comments: [COMMENT_FIXTURE] },
    '/api/operator/tickets': { tickets: [TICKET_FIXTURE] },
    '/api/operator/reconciliation': RECON,
    '/api/operator/audit-log': { audit: AUDIT },
    ...data,
  };
  vi.stubGlobal('fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (init?.method && init.method !== 'GET') {
      writes.push({ url, body: JSON.parse(String(init.body ?? '{}')) });
      return new Response(JSON.stringify(fail ? { error: 'Synthetic server refusal' } : {}), {
        status: fail ? 409 : 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const key = Object.keys(routes).find((k) => url.includes(k));
    return new Response(JSON.stringify(key ? routes[key] : {}), { status: key ? 200 : 404, headers: { 'Content-Type': 'application/json' } });
  });
  return writes;
}
for (const [label, status] of [
  ['Mark under review', 'under_review'],
  ['Approve', 'approved'],
  ['Close', 'closed'],
  ['Reopen', 'received'],
  ['Reject', 'rejected'],
]) {
  test(`synthetic application action ${label} sends the exact intended status`, async () => {
    const writes = workflowFetch({
      '/api/operator/issuer-applications': { applications: [{ ...APP_FIXTURE, status: label === 'Reopen' ? 'closed' : 'received' }] },
    });
    vi.spyOn(window, 'prompt').mockReturnValue('Synthetic rejection reason');
    setup();
    fireEvent.click(await screen.findByRole('button', { name: label }));
    await waitFor(() => expect(writes.length).toBe(1));
    expect(writes[0].body.status).toBe(status);
    if (label === 'Reject') expect(writes[0].body.note).toBe('Synthetic rejection reason');
    expect(await screen.findByText('Status updated.')).toBeTruthy();
    vi.restoreAllMocks();
  });
}
test('synthetic cancelled rejection sends nothing', async () => {
  const writes = workflowFetch();
  vi.spyOn(window, 'prompt').mockReturnValue(null);
  setup();
  fireEvent.click(await screen.findByRole('button', { name: 'Reject' }));
  expect(writes).toEqual([]);
  vi.restoreAllMocks();
});
test('synthetic moderation hide/cancel/unhide preserve intended action and reason', async () => {
  const writes = workflowFetch();
  setup();
  fireEvent.click(await screen.findByRole('button', { name: 'Comments' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Hide' }));
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(writes).toEqual([]);
  fireEvent.click(screen.getByRole('button', { name: 'Hide' }));
  fireEvent.change(screen.getByLabelText('Reason for hiding (optional, shown to the author)'), { target: { value: '  Synthetic reason  ' } });
  fireEvent.click(screen.getByRole('button', { name: 'Confirm hide' }));
  await waitFor(() => expect(writes.length).toBe(1));
  expect(writes[0].url).toContain('/comment_fixture/hide');
  expect(writes[0].body).toMatchObject({ reason: 'Synthetic reason' });
});
test('synthetic hidden comment can be unhidden', async () => {
  const writes = workflowFetch({ '/api/operator/comments': { comments: [{ ...COMMENT_FIXTURE, hiddenAt: 1 }] } });
  setup();
  fireEvent.click(await screen.findByRole('button', { name: 'Comments' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Unhide' }));
  await waitFor(() => expect(writes.length).toBe(1));
  expect(writes[0].url).toContain('/comment_fixture/unhide');
});
test('synthetic ticket closure uses the intended ticket route', async () => {
  const writes = workflowFetch();
  setup();
  fireEvent.click(await screen.findByRole('button', { name: 'Tickets' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Close ticket' }));
  await waitFor(() => expect(writes.length).toBe(1));
  expect(writes[0].url).toContain('ticket_fixture');
  expect(await screen.findByText('Status updated.')).toBeTruthy();
});
for (const tab of ['News', 'Reports'])
  test(`synthetic ${tab} submit and refusal show truthful outcomes`, async () => {
    const writes = workflowFetch({}, true);
    render(
      <I18nProvider>
        <CommunityAuthProvider messages={{ freighterMissing: 'x', walletNoSign: 'y' }}>
          <OperatorSection campaigns={[{ id: 'fixture', name: 'Synthetic campaign' }]} />
        </CommunityAuthProvider>
      </I18nProvider>,
    );
    fireEvent.click(await screen.findByRole('button', { name: tab }));
    const button = screen.getByRole('button', { name: tab === 'News' ? 'Publish news post' : 'Publish report' });
    expect((button as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(screen.getByLabelText('Campaign'), { target: { value: 'fixture' } });
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Synthetic title' } });
    fireEvent.change(screen.getByLabelText('Body'), { target: { value: 'Synthetic body' } });
    fireEvent.click(button);
    await waitFor(() => expect(writes.length).toBe(1));
    expect(writes[0].body).toMatchObject({ title: 'Synthetic title', body: 'Synthetic body' });
    expect((await screen.findByRole('alert')).textContent).toContain('Synthetic server refusal');
    expect(screen.queryByText(tab === 'News' ? 'News post published.' : 'Report published as platform demo content.')).toBeNull();
  });

for (const [tab, empty] of [
  ['Applications', 'No issuer applications yet.'],
  ['Comments', 'No comments yet.'],
  ['Tickets', 'No tickets yet.'],
  ['Reconciliation', 'No campaigns in the registry.'],
  ['Audit log', 'No admin actions recorded yet.'],
]) {
  test(`synthetic ${tab} empty state does not invent records`, async () => {
    workflowFetch({
      '/api/operator/issuer-applications': { applications: [] },
      '/api/operator/comments': { comments: [] },
      '/api/operator/tickets': { tickets: [] },
      '/api/operator/reconciliation': { ...RECON, campaigns: [] },
      '/api/operator/audit-log': { audit: [] },
    });
    setup();
    fireEvent.click(await screen.findByRole('button', { name: tab }));
    expect(await screen.findByText(empty)).toBeTruthy();
  });
}
test('synthetic loading state resolves and a failed independent read does not blank successful tabs', async () => {
  let release: ((v: Response) => void) | undefined;
  let attempts = 0;
  vi.stubGlobal('fetch', async (input: RequestInfo | URL) => {
    const u = String(input);
    if (u.includes('/auth/me')) return new Response(JSON.stringify({ account: { publicKey: ACTOR }, isOperator: true }));
    if (u.includes('/issuer-applications'))
      return new Promise<Response>((r) => {
        release = r;
      });
    if (u.includes('/comments')) {
      attempts++;
      return new Response(JSON.stringify(attempts === 1 ? { error: 'Synthetic comments unavailable' } : { comments: [] }), {
        status: attempts === 1 ? 503 : 200,
      });
    }
    return new Response(JSON.stringify(u.includes('/tickets') ? { tickets: [] } : u.includes('/reconciliation') ? RECON : { audit: [] }));
  });
  setup();
  await screen.findByRole('button', { name: 'Applications' });
  expect(document.querySelector('.community-loading')).toBeTruthy();
  await waitFor(() => expect(release).toBeTruthy());
  release!(new Response(JSON.stringify({ applications: [APP_FIXTURE] })));
  expect(await screen.findByText('Synthetic project')).toBeTruthy();
  expect((await screen.findByRole('alert')).textContent).toContain('Synthetic comments unavailable');
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
  await waitFor(() => expect(attempts).toBe(2));
  fireEvent.click(screen.getByRole('button', { name: 'Comments' }));
  expect(await screen.findByText('No comments yet.')).toBeTruthy();
  expect(screen.queryByRole('alert')).toBeNull();
});

for (const tab of ['News', 'Reports'])
  test(`synthetic ${tab} success sends campaign and expected body`, async () => {
    const writes = workflowFetch();
    render(
      <I18nProvider>
        <CommunityAuthProvider messages={{ freighterMissing: 'x', walletNoSign: 'y' }}>
          <OperatorSection campaigns={[{ id: 'fixture', name: 'Synthetic campaign' }]} />
        </CommunityAuthProvider>
      </I18nProvider>,
    );
    fireEvent.click(await screen.findByRole('button', { name: tab }));
    fireEvent.change(screen.getByLabelText('Campaign'), { target: { value: 'fixture' } });
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: ' Title ' } });
    fireEvent.change(screen.getByLabelText('Body'), { target: { value: ' Body ' } });
    fireEvent.click(screen.getByRole('button', { name: tab === 'News' ? 'Publish news post' : 'Publish report' }));
    await waitFor(() => expect(writes.length).toBe(1));
    expect(writes[0].body).toMatchObject({ title: 'Title', body: 'Body' });
    expect(writes[0].url).toContain('fixture');
    expect(await screen.findByText(tab === 'News' ? 'News post published.' : 'Report published as platform demo content.')).toBeTruthy();
  });
test('synthetic application refusal leaves truthful error and no success notice', async () => {
  workflowFetch({}, true);
  setup();
  fireEvent.click(await screen.findByRole('button', { name: 'Approve' }));
  expect((await screen.findByRole('alert')).textContent).toContain('Synthetic server refusal');
  expect(screen.queryByText('Status updated.')).toBeNull();
});

test('corporate tools distinguish campaign loading and unavailable from a true empty registry', async () => {
  stubFetch();
  const view = render(
    <I18nProvider>
      <CommunityAuthProvider messages={{ freighterMissing: 'x', walletNoSign: 'y' }}>
        <OperatorSection campaigns={[]} campaignsLoading />
      </CommunityAuthProvider>
    </I18nProvider>,
  );
  fireEvent.click(await screen.findByRole('button', { name: 'Corporate actions' }));
  expect(screen.getByRole('status').textContent).toContain('Loading');
  expect(screen.queryByText('No campaigns available.')).toBeNull();
  view.rerender(
    <I18nProvider>
      <CommunityAuthProvider messages={{ freighterMissing: 'x', walletNoSign: 'y' }}>
        <OperatorSection campaigns={[]} campaignsUnavailable />
      </CommunityAuthProvider>
    </I18nProvider>,
  );
  expect(screen.getByRole('status').textContent).toContain('temporarily unavailable');
  expect(screen.queryByText('No campaigns available.')).toBeNull();
});
