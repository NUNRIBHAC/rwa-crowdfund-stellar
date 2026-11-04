// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import Header from './Header';
import { en } from '../i18n/locales/en';
vi.mock('../i18n', () => ({
  LOCALES: [{ id: 'en', label: 'English', accessibleLabel: 'English' }],
  useI18n: () => ({ locale: 'en', setLocale: vi.fn(), m: en }),
}));
vi.mock('../theme', () => ({ useTheme: () => 'navy', lockupFor: () => '/logo.svg', setTheme: vi.fn() }));
const auth = vi.hoisted(() => ({ account: null as null | { publicKey: string }, busy: false, signOut: vi.fn() }));
vi.mock('../community/CommunityAuth', () => ({ useCommunityAuth: () => auth }));
afterEach(() => {
  cleanup();
  auth.account = null;
  auth.busy = false;
  vi.clearAllMocks();
});
test('More discloses About then FAQ, separate from account, and Escape closes it', () => {
  render(<Header actor="" busy={false} current="home" onConnect={vi.fn()} onDisconnect={vi.fn()} />);
  const more = screen.getByRole('button', { name: /More/ });
  expect(more.getAttribute('aria-expanded')).toBe('false');
  fireEvent.click(more);
  expect(more.getAttribute('aria-expanded')).toBe('true');
  const panel = document.getElementById('header-more-links')!;
  expect(Array.from(panel.querySelectorAll('a')).map((a) => a.getAttribute('href'))).toEqual(['/about', '/faq']);
  expect(panel.textContent).not.toContain('My account');
  fireEvent.keyDown(more, { key: 'Escape' });
  expect(more.getAttribute('aria-expanded')).toBe('false');
});
test('wallet wording preserves original connect and disconnect callbacks', () => {
  const connect = vi.fn();
  const disconnect = vi.fn();
  const { rerender } = render(<Header actor="" busy={false} current="home" onConnect={connect} onDisconnect={disconnect} />);
  fireEvent.click(screen.getByRole('button', { name: 'Connect wallet' }));
  expect(connect).toHaveBeenCalledOnce();
  rerender(<Header actor={'G' + 'A'.repeat(55)} busy={false} current="home" onConnect={connect} onDisconnect={disconnect} />);
  fireEvent.click(screen.getByRole('button', { name: 'Disconnect' }));
  expect(disconnect).toHaveBeenCalledOnce();
});

test('session sign out is available without a wallet and does not disconnect a wallet', () => {
  auth.account = { publicKey: 'email-account' };
  const disconnect = vi.fn();
  render(<Header actor="" busy={false} current="account" onConnect={vi.fn()} onDisconnect={disconnect} />);
  fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));
  expect(auth.signOut).toHaveBeenCalledOnce();
  expect(disconnect).not.toHaveBeenCalled();
  expect(screen.getByRole('button', { name: 'Connect wallet' })).toBeTruthy();
});
test('session and wallet controls remain separate with a connected wallet', () => {
  auth.account = { publicKey: 'email-account' };
  auth.busy = true;
  render(<Header actor={'G' + 'A'.repeat(55)} busy={false} current="account" onConnect={vi.fn()} onDisconnect={vi.fn()} />);
  expect(screen.getByRole('button', { name: 'Sign out' }).hasAttribute('disabled')).toBe(true);
  expect(screen.getByRole('button', { name: 'Disconnect' })).toBeTruthy();
});
test('no session sign out is shown while signed out', () => {
  render(<Header actor="" busy={false} current="home" onConnect={vi.fn()} onDisconnect={vi.fn()} />);
  expect(screen.queryByRole('button', { name: 'Sign out' })).toBeNull();
});
