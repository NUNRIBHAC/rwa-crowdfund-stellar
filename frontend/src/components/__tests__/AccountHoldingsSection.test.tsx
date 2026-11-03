// Holdings section: UNKNOWN positions render as an unknown label, never as
// 0; source basis and incomplete-register notes are shown; a failed load
// shows an unavailable note, never a false empty state.
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '../../i18n';
import AccountHoldingsSection from '../AccountHoldingsSection';

const ACTOR = 'GABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRSTUVW';

function ok(v: unknown) {
  return new Response(JSON.stringify(v), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

function renderSection() {
  return render(
    <I18nProvider>
      <AccountHoldingsSection actor={ACTOR} />
    </I18nProvider>,
  );
}

describe('AccountHoldingsSection', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('renders positions with their source basis and never coerces UNKNOWN to 0', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        ok({
          holdings: [
            {
              campaignId: 'demo-solar',
              position: 'UNKNOWN',
              positionSource: 'unknown',
              basisPoints: null,
              registerComplete: false,
              basisMixed: true,
            },
            {
              campaignId: 'qa-wind',
              position: '25.5000000',
              positionSource: 'journal-intended',
              basisPoints: 1250,
              registerComplete: true,
              basisMixed: false,
            },
          ],
          unavailable: [],
          semantics: 's',
          network: 'testnet',
          productionEligible: false,
        }),
      ),
    );
    renderSection();
    expect(await screen.findByText('Unknown')).toBeTruthy();
    expect(screen.queryByText('0')).toBeNull();
    expect(screen.getByText('25.5000000')).toBeTruthy();
    expect(screen.getAllByText(/position could not be computed/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/recorded intended amount/).length).toBeGreaterThan(0);
    expect(screen.getByText(/12\.5%/)).toBeTruthy();
    expect(screen.getByText(/shares exclude them/)).toBeTruthy();
    expect(screen.getByText(/mix on-chain balances/)).toBeTruthy();
  });

  it('lists campaigns whose register is unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(ok({ holdings: [], unavailable: ['demo-solar'], semantics: 's' })));
    renderSection();
    expect(await screen.findByText(/Register temporarily unavailable for: demo-solar/)).toBeTruthy();
  });

  it('shows an empty state only when there are no holdings and none unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(ok({ holdings: [], unavailable: [], semantics: 's' })));
    renderSection();
    expect(await screen.findByText('No holdings found for this wallet.')).toBeTruthy();
  });

  it('shows an unavailable note on failure, never a false empty state', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('x', { status: 500 })));
    renderSection();
    expect(await screen.findByText(/could not be loaded/)).toBeTruthy();
    expect(screen.queryByText('No holdings found for this wallet.')).toBeNull();
  });
});
