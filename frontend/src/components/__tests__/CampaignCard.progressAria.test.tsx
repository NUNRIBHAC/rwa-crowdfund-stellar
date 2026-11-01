import { test, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import CampaignCard from '../CampaignCard';
import { I18nProvider } from '../../i18n';
import { FIXTURE_CAMPAIGNS } from '../../fixtures';
import type { Campaign } from '../../types';

// Truthful progress semantics for the card progress track (QA 06:59 follow-up):
// funding-math.ts defines missing/invalid chain data as UNAVAILABLE - the card
// must never announce a fabricated 0% over a progressbar role. A verified real
// zero is data and still announces 0% truthfully.

afterEach(cleanup);

const base = FIXTURE_CAMPAIGNS[0];
const actor = 'G'.repeat(56);

function setup(campaign: Campaign) {
  return render(
    <I18nProvider>
      <CampaignCard campaign={campaign} actor={actor} busy={false} readOnly={false} amount="10" onAmount={() => {}} onPrepare={() => {}} />
    </I18nProvider>,
  );
}

test('unavailable raised renders no progressbar and no fabricated 0%', () => {
  // Empty string fails isValidUnits: funding data is unavailable, not zero.
  const { container } = setup({ ...base, id: 'fixture-noraised', raised: '' });
  expect(screen.queryByRole('progressbar')).toBeNull();
  const track = container.querySelector('.progress-track') as HTMLElement;
  expect(track.getAttribute('role')).toBe('img');
  expect(track.getAttribute('aria-label')).toBe('Funding progress unavailable: on-chain data not loaded');
  // Visible text AND the raised stat both state unavailability (no fabricated 0 anywhere).
  expect(screen.getAllByText('Progress unavailable - on-chain data not loaded').length).toBe(2);
  expect(container.querySelector('.progress-track .progress-fill')).toBeNull();
});

test('zero goal is unavailable, not 0%', () => {
  const { container } = setup({ ...base, id: 'fixture-zerogoal', config: { ...base.config, goal: '0' } });
  expect(screen.queryByRole('progressbar')).toBeNull();
  const track = container.querySelector('.progress-track') as HTMLElement;
  expect(track.getAttribute('role')).toBe('img');
  expect(track.getAttribute('aria-label')).toBe('Funding progress unavailable: on-chain data not loaded');
  expect(container.querySelector('.progress-track .progress-fill')).toBeNull();
});

test('malformed raised renders unavailable without throwing', () => {
  // Defense in depth: campaignStatus must not throw on a non-numeric
  // payload; the card falls back to the unavailable state.
  const { container } = setup({ ...base, id: 'fixture-malformed', raised: 'not-a-number' });
  expect(screen.queryByRole('progressbar')).toBeNull();
  const track = container.querySelector('.progress-track') as HTMLElement;
  expect(track.getAttribute('role')).toBe('img');
});

test('verified real zero raised still announces a truthful 0% progressbar', () => {
  setup({ ...base, id: 'fixture-realzero', raised: '0' });
  const bar = screen.getByRole('progressbar', { name: 'Funding progress: 0% of goal' });
  expect(bar.getAttribute('aria-valuenow')).toBe('0');
  expect(screen.queryByRole('img', { name: /unavailable/ })).toBeNull();
});

test('funded campaign announces the exact percent', () => {
  const half = String(BigInt(base.config.goal) / 2n);
  setup({ ...base, id: 'fixture-half', raised: half });
  const bar = screen.getByRole('progressbar', { name: 'Funding progress: 50% of goal' });
  expect(bar.getAttribute('aria-valuenow')).toBe('50');
});

test('overfunded campaign caps the progressbar value at aria-valuemax', () => {
  const double = String(BigInt(base.config.goal) * 2n);
  const { container } = setup({ ...base, id: 'fixture-over', raised: double });
  const bar = screen.getByRole('progressbar');
  expect(bar.getAttribute('aria-valuenow')).toBe('100');
  const fill = container.querySelector('.progress-track .progress-fill') as HTMLElement;
  expect(fill.style.width).toBe('100%');
});
