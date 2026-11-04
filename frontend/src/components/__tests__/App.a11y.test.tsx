import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import App from '../../App';
import { FIXTURE_CAMPAIGNS } from '../../fixtures';

vi.mock('@stellar/freighter-api', () => ({
  isConnected: vi.fn(async () => false),
  requestAccess: vi.fn(async () => ({ address: 'G' + 'A'.repeat(55) })),
  signTransaction: vi.fn(),
}));
vi.mock('../../api', () => ({
  api: vi.fn(async () => ({ campaigns: [FIXTURE_CAMPAIGNS[0]] })),
}));

beforeEach(() => {
  window.history.replaceState(null, '', '/investments');
});

afterEach(() => {
  cleanup();
  window.history.replaceState(null, '', '/');
});

describe('site chrome accessibility semantics', () => {
  test('skip link targets main content landmark', async () => {
    render(<App />);
    const skip = screen.getByRole('link', { name: 'Skip to main content' });
    expect(skip.getAttribute('href')).toBe('#main');
    await screen.findByRole('button', { name: 'All' });
    expect(document.getElementById('main')?.tagName).toBe('MAIN');
  });

  test('risk banner is present on every page as a note', async () => {
    render(<App />);
    const banner = screen.getByRole('note', { name: '' });
    expect(banner.textContent).toMatch(/risk of total loss/);
  });

  test('main navigation exposes current page', async () => {
    render(<App />);
    await screen.findByRole('button', { name: 'All' });
    const nav = screen.getByRole('navigation', { name: 'Main' });
    const invest = nav.querySelector('a[aria-current="page"]');
    expect(invest?.textContent).toBe('Campaigns');
  });
});

describe('discovery accessibility semantics', () => {
  test('filter chips expose pressed state and keep it mutually exclusive', async () => {
    render(<App />);
    const all = await screen.findByRole('button', { name: 'All' });
    const funded = screen.getByRole('button', { name: 'Funded' });
    expect(all.getAttribute('aria-pressed')).toBe('true');
    expect(funded.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(funded);
    expect(funded.getAttribute('aria-pressed')).toBe('true');
    expect(all.getAttribute('aria-pressed')).toBe('false');
  });

  test('empty search result is a polite status region', async () => {
    render(<App />);
    const search = await screen.findByRole('textbox', { name: 'Search campaigns' });
    fireEvent.change(search, { target: { value: 'zzz-no-match' } });
    await waitFor(() => {
      const status = screen.getByRole('status');
      expect(status.textContent).toMatch(/No campaigns match/);
    });
  });
});
