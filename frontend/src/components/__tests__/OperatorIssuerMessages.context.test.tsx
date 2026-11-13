import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import OperatorIssuerMessages from '../OperatorIssuerMessages';
import { I18nProvider } from '../../i18n';
const auth = vi.hoisted(() => ({ account: { publicKey: 'operator' } as { publicKey: string } | null, token: 'token' }));
const api = vi.hoisted(() => ({ read: vi.fn(), reply: vi.fn() }));
vi.mock('../../community/CommunityAuth', () => ({ useCommunityAuth: () => auth }));
vi.mock('../../community/api', () => ({
  COMMUNITY_LIMITS: { ticketSubject: 120, ticketBody: 4000 },
  fetchIssuerMessages: api.read,
  replyIssuerMessage: api.reply,
}));
function deferred() {
  let resolve!: (v: ReturnType<typeof msg>) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<ReturnType<typeof msg>>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { resolve, reject, promise };
}
const msg = (campaignId: string, body: string) => ({
  id: body,
  campaignId,
  investorKey: 'G' + 'C'.repeat(55),
  authorKey: 'operator',
  authorRole: 'operator',
  body,
  createdAt: 1,
});
const panel = () => (
  <I18nProvider>
    <OperatorIssuerMessages
      campaigns={[
        { id: 'A', name: 'Campaign A' },
        { id: 'B', name: 'Campaign B' },
      ]}
    />
  </I18nProvider>
);
async function openCampaign(id: string) {
  fireEvent.change(screen.getByRole('combobox'), { target: { value: id } });
  await screen.findByText(id + ' thread');
  fireEvent.click(screen.getByRole('button', { name: /Investor G/ }));
}
function draft(body: string) {
  fireEvent.change(screen.getByRole('textbox'), { target: { value: body } });
}
function submit() {
  fireEvent.submit(screen.getByRole('textbox').closest('form')!);
}
beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('blockallisto-language', 'en');
  auth.account = { publicKey: 'operator' };
  auth.token = 'token';
  api.read.mockReset();
  api.reply.mockReset();
  api.read.mockImplementation((_token: string, id: string) => Promise.resolve({ messages: [msg(id, id + ' thread')] }));
});
afterEach(cleanup);
for (const change of ['campaign', 'token', 'account', 'logout'] as const) {
  for (const outcome of ['success', 'error'] as const) {
    it(`ignores old POST ${outcome} after ${change} changes without clearing the new draft/busy state`, async () => {
      const old = deferred(),
        next = deferred();
      api.reply.mockReturnValueOnce(old.promise).mockReturnValueOnce(next.promise);
      const view = render(panel());
      await openCampaign('A');
      draft('A private draft');
      submit();
      if (change === 'campaign') await openCampaign('B');
      else {
        if (change === 'token') auth.token = 'new token';
        if (change === 'account') auth.account = { publicKey: 'other operator' };
        if (change === 'logout') {
          auth.token = '';
          auth.account = null;
        }
        view.rerender(panel());
        if (change !== 'logout') await openCampaign('B');
      }
      if (change !== 'logout') {
        draft('B new private draft');
        submit();
      }
      await act(async () => {
        if (outcome === 'success') old.resolve(msg('A', 'A SECRET LATE RESPONSE'));
        else old.reject(new Error('A private old error'));
      });
      expect(screen.queryAllByText('A SECRET LATE RESPONSE')).toHaveLength(0);
      expect(screen.queryByText('A private old error')).toBeNull();
      if (change !== 'logout') {
        expect((screen.getByRole('combobox') as HTMLSelectElement).value).toBe('B');
        expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toBe('B new private draft');
        expect((screen.getByRole('textbox').closest('form')!.querySelector('button') as HTMLButtonElement).disabled).toBe(true);
        await act(async () => next.resolve(msg('B', 'B verified current response')));
        expect(screen.getAllByText('B verified current response').length).toBeGreaterThan(0);
        expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toBe('');
      } else expect(screen.queryByRole('combobox')).toBeNull();
    });
  }
}
it('clears old campaign drafts and ignores delayed GET completions', async () => {
  let resolve!: (value: { messages: ReturnType<typeof msg>[] }) => void;
  api.read.mockReturnValueOnce(
    new Promise((yes) => {
      resolve = yes;
    }),
  );
  render(panel());
  fireEvent.change(screen.getByRole('combobox'), { target: { value: 'A' } });
  await openCampaign('B');
  draft('B new draft');
  await act(async () => resolve({ messages: [msg('A', 'A late private read')] }));
  expect(screen.queryByText('A late private read')).toBeNull();
  expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toBe('B new draft');
  await openCampaign('A');
  expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toBe('');
});
