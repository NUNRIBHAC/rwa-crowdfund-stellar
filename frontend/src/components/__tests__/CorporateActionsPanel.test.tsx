import { test, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import CorporateActionsPanel from '../CorporateActionsPanel';
import { I18nProvider } from '../../i18n';

const A = 'GA'.padEnd(56, 'A');
const U = 'GU'.padEnd(56, 'U');
const table = (rows: unknown[], basis = { onChain: 0, journalIntended: 2, unknown: 0, mixed: false }) => ({
  campaignId: 'c1',
  knownBase: '100',
  holdersKnown: 2,
  holdersUnknown: 0,
  complete: true,
  basis,
  rows,
});

function stub(cap: unknown, prev: unknown) {
  vi.stubGlobal('fetch', async (input: RequestInfo | URL) => {
    const url = String(input);
    const body = url.includes('distribution-preview') ? prev : cap;
    return { ok: true, status: 200, json: async () => body } as Response;
  });
}
function setup() {
  render(
    <I18nProvider>
      <CorporateActionsPanel token="t" campaigns={[{ id: 'c1', name: 'Solar' }]} />
    </I18nProvider>,
  );
  fireEvent.change(screen.getByRole('combobox'), { target: { value: 'c1' } });
  fireEvent.click(screen.getByRole('button', { name: /load cap table/i }));
}
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

test('unknown holder shows UNKNOWN, never zero, and the preview is unavailable with no amounts', async () => {
  stub(
    table(
      [
        { publicKey: A, position: '60', positionSource: 'journal-intended', basisPoints: 10000 },
        { publicKey: U, position: 'UNKNOWN', positionSource: 'unknown', basisPoints: null },
      ],
      { onChain: 0, journalIntended: 1, unknown: 1, mixed: false },
    ),
    { status: 'unavailable', declarable: false, total: '10', excludedUnknownHolderCount: 1, rows: [], notice: '' },
  );
  setup();
  await waitFor(() => expect(screen.getByText('UNKNOWN')).toBeTruthy());
  fireEvent.change(screen.getByRole('textbox'), { target: { value: '10' } });
  fireEvent.click(screen.getByRole('button', { name: /preview distribution/i }));
  await waitFor(() => expect(screen.getByText(/Allocation unavailable/)).toBeTruthy());
  expect(screen.getByText(/1 unknown holder/)).toBeTruthy();
});

test('a complete single-basis table shows an illustration notice and exact amounts', async () => {
  stub(
    table(
      [
        { publicKey: A, position: '60', positionSource: 'on-chain', basisPoints: 6000 },
        { publicKey: U, position: '40', positionSource: 'on-chain', basisPoints: 4000 },
      ],
      { onChain: 2, journalIntended: 0, unknown: 0, mixed: false },
    ),
    {
      status: 'illustration',
      declarable: false,
      total: '10',
      excludedUnknownHolderCount: 0,
      rows: [
        { publicKey: A, position: '60', amount: '6' },
        { publicKey: U, position: '40', amount: '4' },
      ],
      notice: '',
    },
  );
  setup();
  await waitFor(() => expect(screen.getByText('60.00%')).toBeTruthy());
  fireEvent.change(screen.getByRole('textbox'), { target: { value: '10' } });
  fireEvent.click(screen.getByRole('button', { name: /preview distribution/i }));
  await waitFor(() => expect(screen.getByText(/Illustration only/)).toBeTruthy());
  expect(screen.getByText('6')).toBeTruthy();
});
