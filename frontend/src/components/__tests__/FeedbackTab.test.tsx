import { test, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';

vi.mock('../../community/CommunityAuth', () => ({
  useCommunityAuth: vi.fn(),
}));

vi.mock('../../community/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../community/api')>();
  return { ...actual, createTicket: vi.fn().mockResolvedValue({ id: 'tkt_test' }) };
});

import { useCommunityAuth } from '../../community/CommunityAuth';
import FeedbackTab from '../FeedbackTab';
import { I18nProvider } from '../../i18n';

afterEach(cleanup);

const auth = vi.mocked(useCommunityAuth);
const actor = 'G'.repeat(56);

function authState(over: Record<string, unknown>) {
  auth.mockReturnValue({
    account: null,
    token: '',
    signIn: vi.fn(),
    busy: false,
    error: '',
    restored: true,
    signOut: vi.fn(),
    setDisplayName: vi.fn(),
    ...over,
  } as unknown as ReturnType<typeof useCommunityAuth>);
}

function openPanel(onConnect = vi.fn().mockResolvedValue(undefined)) {
  render(
    <I18nProvider>
      <FeedbackTab actor="" onConnect={onConnect} />
    </I18nProvider>,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Feedback' }));
  return onConnect;
}

test('signed-out visitor without a wallet gets a working connect button', async () => {
  authState({});
  const onConnect = openPanel();
  expect(screen.getByText('Sign in with your wallet to send feedback.')).toBeTruthy();
  const btn = screen.getByRole('button', { name: 'Connect Freighter' });
  fireEvent.click(btn);
  await waitFor(() => expect(onConnect).toHaveBeenCalledTimes(1));
});

test('connect failure surfaces inline in the panel', async () => {
  authState({});
  const onConnect = vi.fn().mockRejectedValue(new Error('Freighter extension not found.'));
  render(
    <I18nProvider>
      <FeedbackTab actor="" onConnect={onConnect} />
    </I18nProvider>,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Feedback' }));
  fireEvent.click(screen.getByRole('button', { name: 'Connect Freighter' }));
  await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('Freighter extension not found'));
});

test('connected but not signed in offers the challenge sign-in in place', () => {
  const signIn = vi.fn();
  authState({ signIn });
  render(
    <I18nProvider>
      <FeedbackTab actor={actor} onConnect={vi.fn()} />
    </I18nProvider>,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Feedback' }));
  const btn = screen.getByRole('button', { name: 'Sign in with wallet' });
  fireEvent.click(btn);
  expect(signIn).toHaveBeenCalledWith(actor);
});

test('closing after a successful send resets the panel: reopening shows a fresh empty form', () => {
  authState({ account: { publicKey: actor }, token: 'tok' });
  render(
    <I18nProvider>
      <FeedbackTab actor={actor} onConnect={vi.fn()} />
    </I18nProvider>,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Feedback' }));
  const subject = screen.getByText('Subject').parentElement!.querySelector('input')!;
  const body = screen.getByText('Message').parentElement!.querySelector('textarea')!;
  fireEvent.change(subject, { target: { value: 'First' } });
  fireEvent.change(body, { target: { value: 'First body' } });
  fireEvent.submit(subject.closest('form')!);
  return waitFor(() => screen.getByText('Thank you - your feedback was sent.')).then(() => {
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByText('Send feedback')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Feedback' }));
    const freshSubject = screen.getByText('Subject').parentElement!.querySelector('input')!;
    const freshBody = screen.getByText('Message').parentElement!.querySelector('textarea')!;
    expect(freshSubject.value).toBe('');
    expect(freshBody.value).toBe('');
    expect(screen.queryByText('Thank you - your feedback was sent.')).toBeNull();
  });
});

test('signed-in visitor sees the ticket form', () => {
  authState({ account: { publicKey: actor }, token: 'tok' });
  render(
    <I18nProvider>
      <FeedbackTab actor={actor} onConnect={vi.fn()} />
    </I18nProvider>,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Feedback' }));
  expect(screen.getByText('Subject')).toBeTruthy();
});
