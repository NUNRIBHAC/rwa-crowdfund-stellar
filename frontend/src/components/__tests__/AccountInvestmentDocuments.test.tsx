import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '../../i18n';
import AccountInvestmentDocuments from '../AccountInvestmentDocuments';

const api = vi.hoisted(() => ({ list: vi.fn(), download: vi.fn() }));
vi.mock('../../community/api', () => ({ fetchInvestmentDocuments: api.list, downloadInvestmentDocument: api.download }));
const doc = { id: 'doc1', campaignId: 'first', title: '[SYNTHETIC] Terms', demo: true, kind: 'terms', status: 'approved', createdAt: 1, approvedAt: 2 };
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((a, b) => {
    resolve = a;
    reject = b;
  });
  return { promise, resolve, reject };
}
function view(token = 'token-a', campaignId = 'first') {
  return (
    <I18nProvider>
      <AccountInvestmentDocuments token={token} campaignId={campaignId} />
    </I18nProvider>
  );
}
let click: ReturnType<typeof vi.spyOn>;
let create: ReturnType<typeof vi.fn>;
let revoke: ReturnType<typeof vi.fn>;
beforeEach(() => {
  api.list.mockReset();
  api.download.mockReset();
  create = vi.fn(() => 'blob:synthetic');
  revoke = vi.fn();
  vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: create, revokeObjectURL: revoke }));
  click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('AccountInvestmentDocuments request scope', () => {
  it('renders nothing and makes no request without a token', () => {
    const { container } = render(view(''));
    expect(container.innerHTML).toBe('');
    expect(api.list).not.toHaveBeenCalled();
  });
  it('shows loading, never false empty, while the list is pending', () => {
    api.list.mockReturnValue(new Promise(() => undefined));
    render(view());
    expect(screen.getByRole('status')).toBeTruthy();
    expect(screen.queryByText('No investment documents are available for this campaign yet.')).toBeNull();
  });
  it('shows approved demo documents after loading', async () => {
    api.list.mockResolvedValue({ documents: [doc] });
    render(view());
    expect(await screen.findByRole('button', { name: /SYNTHETIC/ })).toBeTruthy();
    expect(screen.getByText('DEMO')).toBeTruthy();
    expect(api.list).toHaveBeenCalledWith('token-a', 'first');
  });
  it('shows empty only after an empty result', async () => {
    api.list.mockResolvedValue({ documents: [] });
    render(view());
    expect(await screen.findByText('No investment documents are available for this campaign yet.')).toBeTruthy();
  });
  it('shows unavailable on a failed list, not empty', async () => {
    api.list.mockRejectedValue(new Error('down'));
    render(view());
    expect(await screen.findByText('Investment documents could not be loaded. That does not mean there are none - try again later.')).toBeTruthy();
  });
  it('removes old documents immediately on campaign change and ignores late old responses', async () => {
    const old = deferred<{ documents: (typeof doc)[] }>();
    api.list.mockReturnValueOnce(old.promise).mockResolvedValueOnce({ documents: [] });
    const { rerender } = render(view());
    rerender(view('token-a', 'second'));
    old.resolve({ documents: [doc] });
    expect(await screen.findByText('No investment documents are available for this campaign yet.')).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
  });
  it('does not retain failure or old documents across session changes', async () => {
    api.list.mockRejectedValueOnce(new Error('old')).mockResolvedValueOnce({ documents: [doc] });
    const { rerender } = render(view());
    await screen.findByText('Investment documents could not be loaded. That does not mean there are none - try again later.');
    rerender(view('token-b'));
    expect(await screen.findByRole('button')).toBeTruthy();
    expect(screen.queryByText('Investment documents could not be loaded. That does not mean there are none - try again later.')).toBeNull();
  });
  it('catches download failure, shows feedback and permits retry without losing the list', async () => {
    api.list.mockResolvedValue({ documents: [doc] });
    api.download.mockRejectedValueOnce(new Error('403'));
    render(view());
    fireEvent.click(await screen.findByRole('button'));
    await waitFor(() => expect(api.download).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByRole('status')).toBeTruthy());
    expect(screen.getByRole('button').hasAttribute('disabled')).toBe(false);
    expect(click).not.toHaveBeenCalled();
    api.download.mockResolvedValueOnce({ blob: new Blob(['test']), filename: 'terms.txt' });
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(click).toHaveBeenCalledTimes(1));
    expect(create).toHaveBeenCalledTimes(1);
    expect(revoke).toHaveBeenCalledWith('blob:synthetic');
    expect(screen.queryByRole('status')).toBeNull();
  });
  for (const change of ['session', 'campaign', 'logout', 'unmount']) {
    it(`aborts and suppresses a pending download after ${change}`, async () => {
      const download = deferred<{ blob: Blob; filename: string }>();
      api.list.mockResolvedValue({ documents: [doc] });
      api.download.mockReturnValue(download.promise);
      const { rerender, unmount } = render(view());
      fireEvent.click(await screen.findByRole('button'));
      const signal = api.download.mock.calls[0][2] as AbortSignal;
      expect(signal.aborted).toBe(false);
      if (change === 'unmount') unmount();
      else rerender(view(change === 'logout' ? '' : change === 'session' ? 'token-b' : 'token-a', change === 'campaign' ? 'second' : 'first'));
      expect(signal.aborted).toBe(true);
      download.resolve({ blob: new Blob(['old']), filename: 'old.txt' });
      await new Promise((r) => setTimeout(r, 0));
      expect(click).not.toHaveBeenCalled();
      expect(create).not.toHaveBeenCalled();
    });
  }
  it('prevents duplicate pending downloads', async () => {
    api.list.mockResolvedValue({ documents: [doc] });
    api.download.mockReturnValue(new Promise(() => undefined));
    render(view());
    const button = await screen.findByRole('button');
    fireEvent.click(button);
    fireEvent.click(button);
    expect(api.download).toHaveBeenCalledTimes(1);
    expect(button.hasAttribute('disabled')).toBe(true);
  });
});
