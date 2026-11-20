// Synthetic Freighter flow: prepare -> sign -> submit -> persist -> retry.
// A transient submit failure must never lose the signed transaction: the
// exact signed XDR stays in local storage and the retry resubmits THAT
// transaction without asking the wallet to sign again.
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import App from '../App';
import { FIXTURE_CAMPAIGNS } from '../fixtures';
import { signTransaction } from '@stellar/freighter-api';

vi.mock('@stellar/freighter-api', () => ({
  isConnected: vi.fn(async () => ({ isConnected: true })),
  requestAccess: vi.fn(async () => ({ address: 'G' + 'A'.repeat(55) })),
  signTransaction: vi.fn(async () => ({ signedTxXdr: 'SIGNED_XDR' })),
}));

const campaign = FIXTURE_CAMPAIGNS[0];
let submitCalls: { xdr: string }[] = [];
let submitFailures = 0;
vi.mock('../api', () => ({
  api: vi.fn(async (url: string, body?: any) => {
    if (url.startsWith('/api/campaigns') && !url.includes('/soroban/')) return { campaigns: [campaign] };
    if (url.endsWith('/soroban/build')) return { hash: 'ab'.repeat(32), xdr: 'BUILT_XDR', feeStroops: '100' };
    if (url.endsWith('/soroban/submit')) {
      submitCalls.push({ xdr: body?.xdr });
      if (submitFailures > 0) {
        submitFailures--;
        throw new Error('network down');
      }
      return { status: 'PENDING' };
    }
    return {};
  }),
}));

beforeEach(() => {
  window.history.replaceState(null, '', `/campaigns/${campaign.id}`);
  localStorage.clear();
  submitCalls = [];
  submitFailures = 0;
  vi.mocked(signTransaction).mockClear();
});

afterEach(() => {
  cleanup();
  window.history.replaceState(null, '', '/');
});

describe('intent lifecycle with a synthetic Freighter', () => {
  test('prepare -> sign -> submit -> retry resubmits the exact signed transaction', async () => {
    render(<App />);
    fireEvent.click(await screen.findByRole('button', { name: 'Connect wallet' }));
    const amount = await screen.findByPlaceholderText('250.00');
    fireEvent.change(amount, { target: { value: '10' } });
    fireEvent.click(screen.getByRole('button', { name: 'Contribute' }));
    // The prepared intent is persisted before any signature request.
    await screen.findByRole('button', { name: 'Sign and submit' });
    expect(JSON.parse(localStorage.getItem('rwa-soroban-intent') ?? '{}')).toMatchObject({ status: 'BUILT' });

    submitFailures = 1;
    fireEvent.click(screen.getByRole('button', { name: 'Sign and submit' }));
    // Transient failure: the signed transaction survives for an identical retry.
    await screen.findByRole('button', { name: 'Retry identical transaction' });
    expect(vi.mocked(signTransaction)).toHaveBeenCalledTimes(1);
    expect(JSON.parse(localStorage.getItem('rwa-soroban-intent') ?? '{}')).toMatchObject({ signedXdr: 'SIGNED_XDR' });

    fireEvent.click(screen.getByRole('button', { name: 'Retry identical transaction' }));
    await waitFor(() => expect(submitCalls).toHaveLength(2));
    expect(vi.mocked(signTransaction)).toHaveBeenCalledTimes(1);
    expect(submitCalls[0].xdr).toBe('SIGNED_XDR');
    expect(submitCalls[1].xdr).toBe('SIGNED_XDR');
    expect(JSON.parse(localStorage.getItem('rwa-soroban-intent') ?? '{}')).toMatchObject({ status: 'PENDING' });
  });
});
