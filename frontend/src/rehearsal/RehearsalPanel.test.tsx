// Hoisting-neutral matcher registration: the /vitest entry imports 'vitest' from inside the
// (possibly root-hoisted) jest-dom package, which breaks under npm workspaces when vitest is
// not hoisted to the same level. Import matchers directly and extend the local expect instead.
import * as jestDomMatchers from '@testing-library/jest-dom/matchers';
import { fireEvent, render, screen, waitFor, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

expect.extend(jestDomMatchers);
import RehearsalPanel from './RehearsalPanel';
import { rehearsalRequest } from './api';
const draft = {
  id: 'fixture-1',
  campaignId: 'synthetic',
  mode: 'test_only',
  legalEffect: false,
  state: 'draft',
  total: '10',
  snapshotHash: 'snapshot-fixture',
  preparedBy: 'fixture-A',
  rows: [{ publicKey: 'holder', amount: '10' }],
  receipts: [],
  audit: [{ actor: 'fixture-A', at: 0, event: 'simulation.prepared' }],
};
const meeting = {
  id: 'meeting-1',
  campaignId: 'synthetic',
  title: 'Fixture title',
  resolution: 'Non-binding question',
  state: 'open',
  simulation: true,
  legalEffect: false,
  binding: false,
  participationBasis: 'one fixture account, one choice',
  participantCount: 2,
  castCount: 0,
  totals: null,
  ownChoice: null,
  canParticipate: true,
};
const props = { token: 'fixture-session-A', campaignId: 'synthetic', fixtureAccounts: ['fixture-A', 'fixture-B'] };
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
function respond(value: unknown) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(value)));
}
describe('isolated rehearsal interface', () => {
  it('sends authenticated fixed local route, creates only a fixture distribution and prevents same-click duplication', async () => {
    respond(draft);
    render(<RehearsalPanel {...props} />);
    fireEvent.change(screen.getByLabelText(/Idempotency key/), { target: { value: 'fixture-first' } });
    const button = screen.getByRole('button', { name: 'Prepare fixture distribution' });
    fireEvent.click(button);
    fireEvent.click(button);
    await screen.findByRole('heading', { name: 'Distribution: draft' });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      '/local-rehearsal/campaigns/synthetic/distributions',
      expect.objectContaining({
        headers: { authorization: 'Bearer fixture-session-A', 'content-type': 'application/json' },
        body: JSON.stringify({ total: '10', idempotencyKey: 'fixture-first' }),
        cache: 'no-store',
      }),
    );
    expect(screen.getByRole('button', { name: 'Run mock distribution' })).toBeDisabled();
  });
  it('unknown outcome does not expose retry and displays no-retry warning', async () => {
    respond({ ...draft, state: 'unknown' });
    render(<RehearsalPanel {...props} />);
    fireEvent.change(screen.getByLabelText('Distribution ID'), { target: { value: 'fixture-1' } });
    fireEvent.click(screen.getByText('Read distribution'));
    await screen.findByText(/Outcome unknown/);
    expect(screen.getByText('Run mock distribution')).toBeDisabled();
    expect(screen.getByText('Cancel undispatched fixture')).toBeDisabled();
  });
  it('account change clears prior data and ignores in-flight result', async () => {
    let finish!: (x: Response) => void;
    vi.stubGlobal(
      'fetch',
      vi.fn(
        () =>
          new Promise<Response>((r) => {
            finish = r;
          }),
      ),
    );
    const view = render(<RehearsalPanel {...props} />);
    fireEvent.change(screen.getByLabelText('Distribution ID'), { target: { value: 'fixture-1' } });
    fireEvent.click(screen.getByText('Read distribution'));
    view.rerender(<RehearsalPanel {...props} token="fixture-session-B" />);
    finish(Response.json(draft));
    await waitFor(() => expect(screen.getByLabelText('Distribution ID')).toHaveValue(''));
    expect(screen.queryByText('Distribution: draft')).not.toBeInTheDocument();
  });
  it('campaign and participant changes reset loaded state', async () => {
    respond(draft);
    const view = render(<RehearsalPanel {...props} />);
    fireEvent.change(screen.getByLabelText('Distribution ID'), { target: { value: 'fixture-1' } });
    fireEvent.click(screen.getByText('Read distribution'));
    await screen.findByText('Distribution: draft');
    view.rerender(<RehearsalPanel {...props} campaignId="other" />);
    await waitFor(() => expect(screen.queryByText('Distribution: draft')).not.toBeInTheDocument());
    expect(screen.getByLabelText('Distribution ID')).toHaveValue('');
  });
  it('participant view withholds totals and organizer actions; immutable choice comes from server', async () => {
    respond(meeting);
    render(<RehearsalPanel {...props} />);
    fireEvent.change(screen.getByLabelText('Meeting ID'), { target: { value: 'meeting-1' } });
    fireEvent.click(screen.getByText('Read meeting'));
    await screen.findByText('Totals withheld until close.');
    expect(screen.queryByText('Close fixture meeting')).not.toBeInTheDocument();
    respond({ ...meeting, ownChoice: 'abstain', canParticipate: false, castCount: 1 });
    fireEvent.click(screen.getByText('Record immutable fixture choice'));
    await waitFor(() => expect(screen.getByText('Record immutable fixture choice')).toBeDisabled());
    expect(screen.getByText(/Your choice: abstain/)).toBeInTheDocument();
  });
  it('closed totals are displayed without claiming legal quorum', async () => {
    respond({ ...meeting, state: 'closed', totals: { for: 1, against: 0, abstain: 1 }, canParticipate: false });
    render(<RehearsalPanel {...props} />);
    fireEvent.change(screen.getByLabelText('Meeting ID'), { target: { value: 'meeting-1' } });
    fireEvent.click(screen.getByText('Read meeting'));
    await screen.findByText('Totals: for 1, against 0, abstain 1.');
    expect(screen.getByText(/No legal quorum calculation/)).toBeInTheDocument();
  });
  it('refuses non-rehearsal responses and unauthenticated requests', async () => {
    respond({ ...draft, legalEffect: true });
    await expect(rehearsalRequest('fixture', '/distributions/fixture-1')).rejects.toThrow('Non-rehearsal');
    await expect(rehearsalRequest('', '/meetings/id')).rejects.toThrow('Authenticated');
    await expect(rehearsalRequest('fixture', 'https://outside.invalid')).rejects.toThrow('Authenticated');
  });
  it('does not expose backend errors or enable actions after rejection', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('private implementation detail', { status: 403 })));
    render(<RehearsalPanel {...props} />);
    fireEvent.change(screen.getByLabelText('Distribution ID'), { target: { value: 'fixture-1' } });
    fireEvent.click(screen.getByText('Read distribution'));
    expect(await screen.findByRole('alert')).toHaveTextContent('Rehearsal request rejected (403)');
    expect(screen.queryByText('private implementation detail')).not.toBeInTheDocument();
  });
  it('refuses hosted origins before sending any request', async () => {
    const send = vi.fn();
    vi.stubGlobal('fetch', send);
    vi.stubGlobal('window', { location: { hostname: 'blockallisto-demo.onrender.com' } });
    await expect(rehearsalRequest('fixture', '/meetings/id')).rejects.toThrow('loopback');
    expect(send).not.toHaveBeenCalled();
  });
  it('editing a lookup ID hides the old action context immediately', async () => {
    respond(draft);
    render(<RehearsalPanel {...props} />);
    fireEvent.change(screen.getByLabelText('Distribution ID'), { target: { value: 'fixture-1' } });
    fireEvent.click(screen.getByText('Read distribution'));
    await screen.findByText('Distribution: draft');
    fireEvent.change(screen.getByLabelText('Distribution ID'), { target: { value: 'different' } });
    expect(screen.queryByText('Review with distinct fixture account')).not.toBeInTheDocument();
  });
});
