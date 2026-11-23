import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { I18nProvider, LOCALES, useI18n } from '../../i18n';
import Account from '../Account';
import type { Market } from '../../market';

vi.mock('../../community/CommunityAuth', () => ({ useCommunityAuth: () => ({ account: null, restored: true }) }));

const actor = 'GDJF4GJDFTO3XA562HC4NRMLRAGJ6HQOJFG7US3LBIN5K44GEF2FNKCT';
const knownStatuses = ['BUILT', 'SIGNED', 'PENDING', 'SUCCESS', 'FAILED', 'NOT_FOUND', 'CANCELLED_UNSIGNED'];
const unknownStatuses = ['FUTURE_STATUS', '__proto__', 'constructor'];
const cases = LOCALES.flatMap(({ id }) =>
  [...knownStatuses, ...unknownStatuses].flatMap((status) => (['journal', 'saved'] as const).map((source) => ({ locale: id, status, source }))),
);
let activity: unknown[] = [];

beforeEach(() => {
  localStorage.clear();
  activity = [];
  vi.stubGlobal('fetch', (input: RequestInfo | URL) =>
    Promise.resolve({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve(
          String(input).startsWith('/api/account/activity')
            ? { activity }
            : {
                campaigns: [],
                news: [],
                holdings: [],
                payouts: [],
                activities: [],
                events: [],
                notifications: [],
                documents: [],
                tickets: [],
                applications: [],
                items: [],
                intents: [],
                unavailable: [],
              },
        ),
    } as Response),
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  localStorage.clear();
});

function ExpectedLabel({ status }: { status: string }) {
  const { m } = useI18n();
  return <output data-testid="expected-label">{knownStatuses.includes(status) ? m.intent.statusLabels[status] : m.account.savedTxUnknown}</output>;
}

test.each(cases)('$locale: Account $source localizes $status without raw-code fallback', async ({ locale, status, source }) => {
  const row = { actor, campaign: 'status-label-fixture', action: 'contribute', status, hash: 'a'.repeat(64), amount: null, createdAt: null };
  if (source === 'journal') activity = [row];
  else localStorage.setItem('rwa-soroban-intent', JSON.stringify(row));
  render(
    <I18nProvider initialLocale={locale}>
      <ExpectedLabel status={status} />
      <Account market={{ campaigns: [], actor, fixtureMode: false } as unknown as Market} />
    </I18nProvider>,
  );
  const campaign = await screen.findByText('status-label-fixture');
  const label = campaign.closest(source === 'journal' ? 'li' : 'p')?.querySelector('strong')?.textContent;
  expect(label).toBe(screen.getByTestId('expected-label').textContent);
  expect(label?.trim()).toBeTruthy();
  if (unknownStatuses.includes(status)) expect(label).not.toBe(status);
});
