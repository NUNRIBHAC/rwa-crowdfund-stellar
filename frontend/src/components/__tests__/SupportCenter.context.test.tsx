import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import SupportCenter from '../SupportCenter';
import { I18nProvider } from '../../i18n';
const auth = vi.hoisted(() => ({ account: { publicKey: 'actor-a' } as { publicKey: string } | null, token: 'token-a' }));
const api = vi.hoisted(() => ({ read: vi.fn(), create: vi.fn(), notify: vi.fn() }));
vi.mock('../../community/CommunityAuth', () => ({ useCommunityAuth: () => auth }));
vi.mock('../../community/api', () => ({ COMMUNITY_LIMITS: { ticketSubject: 120, ticketBody: 4000 }, fetchMyTickets: api.read, createTicket: api.create }));
vi.mock('../../community/events', () => ({ notifyCommunityActivityChanged: api.notify }));
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
const ticket = (subject: string) => ({ id: subject, subject, body: 'private body', kind: 'support', status: 'open', createdAt: 1 });
const panel = () => (
  <I18nProvider>
    <SupportCenter />
  </I18nProvider>
);
function fill(subject = 'draft') {
  fireEvent.change(screen.getByLabelText('Subject'), { target: { value: subject } });
  fireEvent.change(screen.getByLabelText('Message'), { target: { value: 'private draft body' } });
}
beforeEach(() => {
  auth.account = { publicKey: 'actor-a' };
  auth.token = 'token-a';
  api.read.mockReset().mockResolvedValue({ tickets: [] });
  api.create.mockReset();
  api.notify.mockReset();
});
afterEach(cleanup);
it('removes the old private list and draft immediately before the next account read completes', async () => {
  api.read.mockResolvedValueOnce({ tickets: [ticket('A private subject')] }).mockReturnValueOnce(new Promise(() => {}));
  const view = render(panel());
  await screen.findByText('A private subject');
  fill('A draft');
  auth.account = { publicKey: 'actor-b' };
  auth.token = 'token-b';
  view.rerender(panel());
  expect(screen.queryByText('A private subject')).toBeNull();
  expect((screen.getByLabelText('Subject') as HTMLInputElement).value).toBe('');
  expect(screen.queryByText('A draft')).toBeNull();
});
it('ignores late account A GET success after account B has loaded', async () => {
  const old = deferred<{ tickets: ReturnType<typeof ticket>[] }>();
  api.read.mockReturnValueOnce(old.promise).mockResolvedValueOnce({ tickets: [ticket('B ticket')] });
  const view = render(panel());
  auth.account = { publicKey: 'actor-b' };
  auth.token = 'token-b';
  view.rerender(panel());
  await screen.findByText('B ticket');
  await act(async () => old.resolve({ tickets: [ticket('late A ticket')] }));
  expect(screen.queryByText('late A ticket')).toBeNull();
  expect(screen.getByText('B ticket')).toBeTruthy();
});
it('ignores late account A GET error after token renewal', async () => {
  const old = deferred<{ tickets: ReturnType<typeof ticket>[] }>();
  api.read.mockReturnValueOnce(old.promise);
  const view = render(panel());
  auth.token = 'token-new';
  view.rerender(panel());
  await act(async () => old.reject(new Error('A private read error')));
  expect(screen.queryByText('A private read error')).toBeNull();
});
for (const change of ['account', 'token', 'logout'] as const) {
  it(`ignores an old ticket POST after ${change} changes`, async () => {
    const old = deferred<{ ticket: ReturnType<typeof ticket> }>();
    api.create.mockReturnValueOnce(old.promise);
    const view = render(panel());
    fill();
    fireEvent.submit(screen.getByLabelText('Subject').closest('form')!);
    if (change === 'account') {
      auth.account = { publicKey: 'actor-b' };
      auth.token = 'token-b';
    }
    if (change === 'token') auth.token = 'token-new';
    if (change === 'logout') {
      auth.account = null;
      auth.token = '';
    }
    view.rerender(panel());
    if (change !== 'logout') fill('new draft');
    await act(async () => old.resolve({ ticket: ticket('old POST private subject') }));
    expect(screen.queryByText('old POST private subject')).toBeNull();
    expect(api.notify).not.toHaveBeenCalled();
    if (change !== 'logout') expect((screen.getByLabelText('Subject') as HTMLInputElement).value).toBe('new draft');
  });
}
it('keeps the new POST busy after the old context rejects and then accepts only the new ticket', async () => {
  const old = deferred<{ ticket: ReturnType<typeof ticket> }>(),
    next = deferred<{ ticket: ReturnType<typeof ticket> }>();
  api.create.mockReturnValueOnce(old.promise).mockReturnValueOnce(next.promise);
  const view = render(panel());
  fill();
  fireEvent.submit(screen.getByLabelText('Subject').closest('form')!);
  auth.token = 'token-b';
  auth.account = { publicKey: 'actor-b' };
  view.rerender(panel());
  fill('B draft');
  fireEvent.submit(screen.getByLabelText('Subject').closest('form')!);
  await act(async () => old.reject(new Error('A private post error')));
  expect(screen.queryByText('A private post error')).toBeNull();
  expect((screen.getByRole('button') as HTMLButtonElement).disabled).toBe(true);
  await act(async () => next.resolve({ ticket: ticket('B new ticket') }));
  expect(await screen.findByText('B new ticket')).toBeTruthy();
  expect(api.notify).toHaveBeenCalledTimes(1);
});
