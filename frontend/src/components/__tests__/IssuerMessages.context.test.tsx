import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import IssuerMessages from '../IssuerMessages';
import { I18nProvider } from '../../i18n';
const auth = vi.hoisted(() => ({ account: { publicKey: 'actor-a' } as { publicKey: string } | null, token: 'token-a', isOperator: false }));
const api = vi.hoisted(() => ({ read: vi.fn(), post: vi.fn() }));
vi.mock('../../community/CommunityAuth', () => ({ useCommunityAuth: () => auth }));
vi.mock('../../community/api', () => ({ COMMUNITY_LIMITS: { ticketBody: 4000 }, fetchIssuerMessages: api.read, postIssuerMessage: api.post }));
function deferred<T>() {
  let resolve!: (v: T) => void;
  let reject!: (e: Error) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
const message = (body: string) => ({ id: body, body, createdAt: 1, authorRole: 'investor' });
const panel = (campaignId = 'campaign-a') => (
  <I18nProvider>
    <IssuerMessages campaignId={campaignId} />
  </I18nProvider>
);
beforeEach(() => {
  auth.account = { publicKey: 'actor-a' };
  auth.token = 'token-a';
  auth.isOperator = false;
  api.read.mockReset().mockResolvedValue({ messages: [] });
  api.post.mockReset();
});
afterEach(cleanup);
for (const change of ['account', 'campaign', 'token', 'logout', 'operator'] as const) {
  it(`does not apply an old POST after ${change} changes`, async () => {
    const oldPost = deferred<ReturnType<typeof message>>();
    api.post.mockReturnValue(oldPost.promise);
    const view = render(panel());
    await screen.findByText('No messages yet. Start the conversation below.');
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'private old draft' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    await waitFor(() => expect(api.post).toHaveBeenCalled());
    if (change === 'account') {
      auth.account = { publicKey: 'actor-b' };
      auth.token = 'token-b';
    }
    if (change === 'token') auth.token = 'token-new';
    if (change === 'logout') {
      auth.account = null;
      auth.token = '';
    }
    if (change === 'operator') auth.isOperator = true;
    view.rerender(panel(change === 'campaign' ? 'campaign-b' : 'campaign-a'));
    if (change !== 'logout' && change !== 'operator') {
      await screen.findByText('No messages yet. Start the conversation below.');
      fireEvent.change(screen.getByRole('textbox'), { target: { value: 'new context draft' } });
    }
    await act(async () => oldPost.resolve(message('old private completion')));
    expect(screen.queryByText('old private completion')).toBeNull();
    if (change !== 'logout' && change !== 'operator') expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toBe('new context draft');
  });
}
it('ignores old POST errors without changing the new composer busy state', async () => {
  const oldPost = deferred<ReturnType<typeof message>>(),
    newPost = deferred<ReturnType<typeof message>>();
  api.post.mockReturnValueOnce(oldPost.promise).mockReturnValueOnce(newPost.promise);
  const view = render(panel());
  await screen.findByText('No messages yet. Start the conversation below.');
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'old' } });
  fireEvent.click(screen.getByRole('button', { name: 'Send' }));
  auth.token = 'token-b';
  auth.account = { publicKey: 'actor-b' };
  view.rerender(panel());
  await screen.findByText('No messages yet. Start the conversation below.');
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'new' } });
  fireEvent.click(screen.getByRole('button', { name: 'Send' }));
  await act(async () => oldPost.reject(new Error('private old error')));
  expect(screen.queryByText('private old error')).toBeNull();
  expect((screen.getByRole('button') as HTMLButtonElement).disabled).toBe(true);
  await act(async () => newPost.resolve(message('new success')));
  expect(await screen.findByText('new success')).toBeTruthy();
});
it('hides the prior thread immediately on context change and ignores late GET results', async () => {
  const oldRead = deferred<{ messages: ReturnType<typeof message>[] }>();
  api.read.mockReturnValueOnce(oldRead.promise).mockResolvedValue({ messages: [message('new thread')] });
  const view = render(panel());
  auth.account = { publicKey: 'actor-b' };
  auth.token = 'token-b';
  view.rerender(panel());
  expect(await screen.findByText('new thread')).toBeTruthy();
  await act(async () => oldRead.resolve({ messages: [message('old thread')] }));
  expect(screen.queryByText('old thread')).toBeNull();
});
