// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import AccountDeletionSection from './AccountDeletionSection';
const fixtures = vi.hoisted(() => ({
  auth: { account: { authMethod: 'email', totpEnabled: false } as any, token: 'fixture-token', signOut: vi.fn(), disableSocialValidation: vi.fn() },
  deleteAccount: vi.fn(),
}));
vi.mock('../community/CommunityAuth', () => ({ useCommunityAuth: () => fixtures.auth }));
vi.mock('../community/api', () => ({ deleteOwnAccount: fixtures.deleteAccount }));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
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
test('cancel performs no request and unsupported social accounts expose no destructive button', () => {
  open();
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(fixtures.deleteAccount).not.toHaveBeenCalled();
  cleanup();
  fixtures.auth.account = { authMethod: 'social', totpEnabled: false };
  render(<AccountDeletionSection />);
  expect(screen.queryByRole('button')).toBeNull();
  expect(screen.getByText(/not supported yet/)).toBeTruthy();
});
test('2FA-enabled account requires its current code in addition to password', () => {
  fixtures.auth.account.totpEnabled = true;
  open();
  expect(screen.getByLabelText('Current authenticator code (if enabled)')).toBeTruthy();
});
