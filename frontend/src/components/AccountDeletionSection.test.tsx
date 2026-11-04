// @vitest-environment jsdom
import { StrictMode } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import AccountDeletionSection from './AccountDeletionSection';
const fixtures = vi.hoisted(() => ({
  auth: { account: { authMethod: 'email', totpEnabled: false } as any, token: 'fixture-token', signOut: vi.fn(), disableSocialValidation: vi.fn() },
  deleteAccount: vi.fn(),
  fetchProviders: vi.fn().mockResolvedValue({ providers: [] }),
  startProvider: vi.fn(),
}));
vi.mock('../community/CommunityAuth', () => ({ useCommunityAuth: () => fixtures.auth }));
vi.mock('../community/api', () => ({
  deleteOwnAccount: fixtures.deleteAccount,
  fetchDeletionProviders: fixtures.fetchProviders,
  startDeletionProvider: fixtures.startProvider,
}));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  fixtures.fetchProviders.mockResolvedValue({ providers: [] });
  history.replaceState(null, '', '/account');
  fixtures.auth.account = { authMethod: 'email', totpEnabled: false };
});
function open() {
  render(<AccountDeletionSection />);
  fireEvent.click(screen.getByRole('button', { name: 'Delete account' }));
}
test('deletion requires explicit confirmation and fresh password then clears session on success', async () => {
  fixtures.deleteAccount.mockResolvedValue({ ok: true });
  open();
  const submit = screen.getByRole('button', { name: 'Permanently delete account' });
  expect(submit.hasAttribute('disabled')).toBe(true);
  fireEvent.change(screen.getByLabelText('Current password'), { target: { value: 'fixture-password' } });
  fireEvent.change(screen.getByLabelText('Type DELETE to confirm'), { target: { value: 'DELETE' } });
  fireEvent.click(submit);
  await waitFor(() => expect(fixtures.auth.signOut).toHaveBeenCalledOnce());
  expect(fixtures.deleteAccount).toHaveBeenCalledWith('fixture-token', { confirmation: 'DELETE', password: 'fixture-password', totpCode: '' });
  expect(fixtures.auth.disableSocialValidation).toHaveBeenCalledOnce();
});
test('failure does not sign out or claim deletion and clears typed secrets', async () => {
  fixtures.deleteAccount.mockRejectedValue(new Error('protected'));
  open();
  fireEvent.change(screen.getByLabelText('Current password'), { target: { value: 'fixture-password' } });
  fireEvent.change(screen.getByLabelText('Type DELETE to confirm'), { target: { value: 'DELETE' } });
  fireEvent.click(screen.getByRole('button', { name: 'Permanently delete account' }));
  await screen.findByRole('alert');
  expect(fixtures.auth.signOut).not.toHaveBeenCalled();
  expect((screen.getByLabelText('Current password') as HTMLInputElement).value).toBe('');
});
test('cancel performs no request and unsupported wallet accounts expose no destructive button', () => {
  open();
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(fixtures.deleteAccount).not.toHaveBeenCalled();
  cleanup();
  fixtures.auth.account = { authMethod: 'wallet', totpEnabled: false };
  render(<AccountDeletionSection />);
  expect(screen.queryByRole('button')).toBeNull();
  expect(screen.getByText(/Wallet accounts are not supported/)).toBeTruthy();
});
test('2FA-enabled account requires its current code in addition to password', () => {
  fixtures.auth.account.totpEnabled = true;
  open();
  expect(screen.getByLabelText('Current authenticator code (if enabled)')).toBeTruthy();
});

test('social callback proof opens a new empty confirmation, never deletes automatically', async () => {
  fixtures.auth.account = { authMethod: 'social', totpEnabled: false, publicKey: 'owner' };
  history.replaceState(null, '', '/account#deletion-proof=bld_' + 'a'.repeat(48));
  render(<AccountDeletionSection />);
  await screen.findByText(/Linked identity checked/);
  expect(fixtures.deleteAccount).not.toHaveBeenCalled();
  expect((screen.getByLabelText('Type DELETE to confirm') as HTMLInputElement).value).toBe('');
  expect(location.hash).toBe('');
  expect(screen.getByRole('button', { name: 'Permanently delete account' }).hasAttribute('disabled')).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(fixtures.deleteAccount).not.toHaveBeenCalled();
});
test('social identity proof requires first explicit DELETE and supported linked identity', async () => {
  fixtures.auth.account = { authMethod: 'social', totpEnabled: false, publicKey: 'owner' };
  fixtures.fetchProviders.mockResolvedValue({ providers: ['google'] });
  open();
  const button = await screen.findByRole('button', { name: 'Verify linked identity: Google' });
  expect(button.hasAttribute('disabled')).toBe(true);
  expect(fixtures.startProvider).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText('Type DELETE to confirm'), { target: { value: 'DELETE' } });
  expect(button.hasAttribute('disabled')).toBe(false);
  expect(screen.getByRole('button', { name: 'Permanently delete account' }).hasAttribute('disabled')).toBe(true);
});

test('social proof final confirmation sends only the proof and clears it on failure', async () => {
  fixtures.auth.account = { authMethod: 'social', totpEnabled: true, publicKey: 'owner' };
  const socialProof = 'bld_' + 'b'.repeat(48);
  history.replaceState(null, '', '/account#deletion-proof=' + socialProof);
  fixtures.deleteAccount.mockRejectedValue(new Error('expired'));
  render(<AccountDeletionSection />);
  await screen.findByText(/Linked identity checked/);
  fireEvent.change(screen.getByLabelText('Type DELETE to confirm'), { target: { value: 'DELETE' } });
  fireEvent.change(screen.getByLabelText('Current authenticator code (if enabled)'), { target: { value: '123456' } });
  fireEvent.click(screen.getByRole('button', { name: 'Permanently delete account' }));
  await screen.findByRole('alert');
  expect(fixtures.deleteAccount).toHaveBeenCalledWith('fixture-token', { confirmation: 'DELETE', socialProof, totpCode: '123456' });
  expect(fixtures.auth.signOut).not.toHaveBeenCalled();
  expect(screen.queryByText(/Linked identity checked/)).toBeNull();
  expect((screen.getByLabelText('Type DELETE to confirm') as HTMLInputElement).value).toBe('');
  expect((screen.getByLabelText('Current authenticator code (if enabled)') as HTMLInputElement).value).toBe('');
});

test('strict-mode effect replay keeps callback proof while stripping the fragment', async () => {
  fixtures.auth.account = { authMethod: 'social', totpEnabled: false, publicKey: 'owner' };
  history.replaceState(null, '', '/account#deletion-proof=bld_' + 'c'.repeat(48));
  render(
    <StrictMode>
      <AccountDeletionSection />
    </StrictMode>,
  );
  await screen.findByText(/Linked identity checked/);
  expect(location.hash).toBe('');
  expect(fixtures.deleteAccount).not.toHaveBeenCalled();
});
