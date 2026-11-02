// Account payout history: only completed money-back events are listed, with
// formatted amounts and a testnet tx link, and the empty state is honest
// (no fabricated payouts, no "returns").
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '../../i18n';
import AccountPayoutsSection from '../AccountPayoutsSection';

const ACTOR = 'GDJF4GJDFTO3XA562HC4NRMLRAGJ6HQOJFG7US3LBIN5K44GEF2FNKCT';

function ok(v: unknown) {
  return new Response(JSON.stringify(v), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

function renderSection() {
  return render(
    <I18nProvider>
      <AccountPayoutsSection actor={ACTOR} />
    </I18nProvider>,
  );
}

describe('AccountPayoutsSection', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('lists completed payouts with formatted amount and testnet tx link', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        ok({
          payouts: [
            {
              hash: 'a1b2',
              campaign: 'qa-backfill2',
              action: 'refund',
              amount: '10000000',
              status: 'SUCCESS',
              createdAt: '2026-10-30T10:00:00Z',
              updatedAt: '2026-10-30T10:05:00Z',
            },
          ],
        }),
      ),
    );
    renderSection();
    const item = await screen.findByText('qa-backfill2');
    expect(item).toBeTruthy();
    const li = item.closest('li')!;
    expect(li.textContent).toContain('1 USDC');
    const link = li.querySelector('a')!;
    expect(link.getAttribute('href')).toBe('https://stellar.expert/explorer/testnet/tx/a1b2');
  });

  it('honest empty state when no completed payouts exist', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(ok({ payouts: [] })));
    renderSection();
    expect(await screen.findByText('No payouts recorded yet. Completed refunds or withdrawals will appear here.')).toBeTruthy();
  });

  it('load failure shows an unavailable message, NOT a false empty state', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));
    renderSection();
    expect(await screen.findByText('Payout history could not be loaded. That does not mean there are no payouts - try again later.')).toBeTruthy();
    expect(screen.queryByText('No payouts recorded yet. Completed refunds or withdrawals will appear here.')).toBeNull();
  });
});
