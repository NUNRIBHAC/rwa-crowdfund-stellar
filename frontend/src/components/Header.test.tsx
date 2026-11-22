// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import Header from './Header';
import { en } from '../i18n/locales/en';
import type { RouteName } from '../router';
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
  rerender(<Header actor={'G' + 'A'.repeat(55)} busy={false} current="account" onConnect={connect} onDisconnect={disconnect} />);
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
test('connected Home hides wallet details without signing out or disconnecting', () => {
  const actor = 'G' + 'A'.repeat(55);
  const disconnect = vi.fn();
  auth.account = { publicKey: 'email-account' };
  const { container, rerender } = render(<Header actor={actor} busy={false} current="home" onConnect={vi.fn()} onDisconnect={disconnect} />);
  expect(container.querySelector('.wallet-chip')).toBeNull();
  expect(screen.queryByRole('button', { name: 'Disconnect' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Connect wallet' })).toBeNull();
  expect(screen.getByRole('button', { name: 'Sign out' })).toBeTruthy();
  expect(disconnect).not.toHaveBeenCalled();
  expect(auth.signOut).not.toHaveBeenCalled();
  rerender(<Header actor={actor} busy={false} current="account" onConnect={vi.fn()} onDisconnect={disconnect} />);
  expect(container.querySelector('.wallet-chip')?.getAttribute('title')).toBe(actor);
  expect(screen.getByRole('button', { name: 'Disconnect' })).toBeTruthy();
  rerender(<Header actor={actor} busy={false} current="home" onConnect={vi.fn()} onDisconnect={disconnect} />);
  fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));
  expect(auth.signOut).toHaveBeenCalledOnce();
  expect(disconnect).not.toHaveBeenCalled();
});

const nonHomeRoutes: RouteName[] = [
  'investments',
  'campaign',
  'how-it-works',
  'learn',
  'glossary',
  'risk-warnings',
  'faq',
  'financing',
  'about',
  'account',
  'terms-of-service',
  'privacy-policy',
  'risk-disclosure',
  'legal-notice',
  'conflicts-of-interest',
  'complaints-management',
  'business-continuity',
  'events',
  'blog',
  'press',
  'jobs',
  'podcast',
  'campaign-builder',
  'not-found',
];
test.each(nonHomeRoutes)('connected wallet remains usable on %s', (current) => {
  const actor = 'G' + 'A'.repeat(55);
  const disconnect = vi.fn();
  const { container } = render(<Header actor={actor} busy={false} current={current} onConnect={vi.fn()} onDisconnect={disconnect} />);
  expect(container.querySelector('.wallet-chip')?.getAttribute('title')).toBe(actor);
  fireEvent.click(screen.getByRole('button', { name: 'Disconnect' }));
  expect(auth.signOut).toHaveBeenCalledOnce();
  expect(disconnect).toHaveBeenCalledOnce();
});

test('no session sign out is shown while signed out', () => {
  render(<Header actor="" busy={false} current="home" onConnect={vi.fn()} onDisconnect={vi.fn()} />);
  expect(screen.queryByRole('button', { name: 'Sign out' })).toBeNull();
});

test('Investors replaces Learn in shared desktop/mobile navigation', () => {
  render(<Header actor="" busy={false} current="for-investors" onConnect={vi.fn()} onDisconnect={vi.fn()} />);
  const links = screen.getAllByRole('link', { name: en.nav.forInvestors });
  expect(links.length).toBeGreaterThan(0);
  for (const link of links) {
    expect(link.getAttribute('href')).toBe('/for-investors');
    expect(link.getAttribute('aria-current')).toBe('page');
  }
  expect(document.querySelector('header a[href="/learn"]')).toBeNull();
});
