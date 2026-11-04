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
  await waitFor(() => expect(screen.getAllByText('UNKNOWN')[0]).toBeTruthy());
  fireEvent.change(screen.getByRole('textbox'), { target: { value: '10' } });
  fireEvent.click(screen.getByRole('button', { name: /preview distribution/i }));
  await waitFor(() => expect(screen.getByText(/Allocation unavailable/)).toBeTruthy());
  expect(screen.getByText(/Unknown holders: 1/)).toBeTruthy();
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

test('synthetic no-campaign state has no actionable load or preview controls', () => {
  render(
    <I18nProvider>
      <CorporateActionsPanel token="t" campaigns={[]} />
    </I18nProvider>,
  );
  expect(screen.getByText('No campaigns available.')).toBeTruthy();
  expect(screen.queryByRole('button')).toBeNull();
});
test('synthetic read failure exposes error without inventing a cap table', async () => {
  vi.stubGlobal('fetch', async () => new Response(JSON.stringify({ error: 'Synthetic cap table unavailable' }), { status: 503 }));
  setup();
  expect((await screen.findByRole('alert')).textContent).toContain('Synthetic cap table unavailable');
  expect(screen.queryByRole('table')).toBeNull();
});
test('synthetic loading disables duplicate load and blank preview remains disabled', async () => {
  let release: ((r: Response) => void) | undefined;
  vi.stubGlobal(
    'fetch',
    () =>
      new Promise<Response>((r) => {
        release = r;
      }),
  );
  setup();
  expect((screen.getByRole('button', { name: /load cap table/i }) as HTMLButtonElement).disabled).toBe(true);
  await waitFor(() => expect(release).toBeTruthy());
  release!(new Response(JSON.stringify(table([]))));
  await screen.findByRole('table');
  expect((screen.getByRole('button', { name: /preview distribution/i }) as HTMLButtonElement).disabled).toBe(true);
});
test('synthetic mixed-basis table discloses its limitation and rejects unavailable allocation', async () => {
  stub(table([{ publicKey: A, position: '60', positionSource: 'on-chain', basisPoints: null }], { onChain: 1, journalIntended: 1, unknown: 0, mixed: true }), {
    status: 'unavailable',
    declarable: false,
    total: '10',
    excludedUnknownHolderCount: 0,
    rows: [],
  });
  setup();
  expect(await screen.findByText(/Mixed bases/)).toBeTruthy();
  fireEvent.change(screen.getByRole('textbox'), { target: { value: '10' } });
  fireEvent.click(screen.getByRole('button', { name: /preview distribution/i }));
  expect(await screen.findByText(/Allocation unavailable/)).toBeTruthy();
  expect(screen.queryByText(/Illustration only/)).toBeNull();
});
test('synthetic preview refusal never shows a successful allocation', async () => {
  vi.stubGlobal('fetch', async (input: RequestInfo | URL) =>
    String(input).includes('distribution-preview')
      ? new Response(JSON.stringify({ error: 'Synthetic preview refused' }), { status: 409 })
      : new Response(JSON.stringify(table([]))),
  );
  setup();
  await screen.findByRole('table');
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'bad' } });
  fireEvent.click(screen.getByRole('button', { name: /preview distribution/i }));
  expect((await screen.findByRole('alert')).textContent).toContain('Synthetic preview refused');
  expect(screen.queryByRole('status')).toBeNull();
});

test('reconciled cashflow remains separate from an unknown holding', async () => {
  stub(
    table(
      [
        {
          publicKey: U,
          position: 'UNKNOWN',
          positionSource: 'unknown',
          basisPoints: null,
          confirmedCashflow: { contributed: '1', refunded: '1', net: '0', missing: 0 },
        },
      ],
      { onChain: 0, journalIntended: 0, unknown: 1, mixed: false },
    ),
    {},
  );
  setup();
  expect(await screen.findByText('1 / 1 / 0')).toBeTruthy();
  expect(screen.getByText('Historical transfers only, not current holdings or rights. Excluded from allocations.')).toBeTruthy();
  expect(screen.getAllByText('UNKNOWN').length).toBeGreaterThan(0);
});

test('changing campaign clears the previous table, allocation, amount and error context', async () => {
  stub(table([{ publicKey: A, position: '60', positionSource: 'on-chain', basisPoints: 6000 }]), {
    status: 'illustration',
    rows: [{ publicKey: A, amount: '6' }],
    excludedUnknownHolderCount: 0,
  });
  render(
    <I18nProvider>
      <CorporateActionsPanel
        token="t"
        campaigns={[
          { id: 'c1', name: 'Solar' },
          { id: 'c2', name: 'Wind' },
        ]}
      />
    </I18nProvider>,
  );
  fireEvent.change(screen.getByRole('combobox'), { target: { value: 'c1' } });
  fireEvent.click(screen.getByRole('button', { name: /load cap table/i }));
  await screen.findByRole('table');
  fireEvent.change(screen.getByRole('textbox'), { target: { value: '10' } });
  fireEvent.click(screen.getByRole('button', { name: /preview distribution/i }));
  await screen.findByText(/Illustration only/);
  fireEvent.change(screen.getByRole('combobox'), { target: { value: 'c2' } });
  expect(screen.queryByRole('table')).toBeNull();
  expect(screen.queryByRole('textbox')).toBeNull();
  expect(screen.queryByRole('status')).toBeNull();
});

test('a late response from the previous campaign never appears under the new selection', async () => {
  let release!: (value: Response) => void;
  vi.stubGlobal(
    'fetch',
    () =>
      new Promise<Response>((r) => {
        release = r;
      }),
  );
  render(
    <I18nProvider>
      <CorporateActionsPanel
        token="t"
        campaigns={[
          { id: 'c1', name: 'Solar' },
          { id: 'c2', name: 'Wind' },
        ]}
      />
    </I18nProvider>,
  );
  fireEvent.change(screen.getByRole('combobox'), { target: { value: 'c1' } });
  fireEvent.click(screen.getByRole('button', { name: /load cap table/i }));
  await waitFor(() => expect(release).toBeTruthy());
  fireEvent.change(screen.getByRole('combobox'), { target: { value: 'c2' } });
  release(new Response(JSON.stringify(table([{ publicKey: A, position: '60', positionSource: 'on-chain', basisPoints: 6000 }]))));
  await new Promise((r) => setTimeout(r, 0));
  expect(screen.queryByRole('table')).toBeNull();
  expect((screen.getByRole('button', { name: /load cap table/i }) as HTMLButtonElement).disabled).toBe(false);
});

test('removing a selected campaign clears loaded records and controls', async () => {
  stub(table([]), {});
  const renderPanel = (campaigns: { id: string; name: string }[]) => (
    <I18nProvider>
      <CorporateActionsPanel token="t" campaigns={campaigns} />
    </I18nProvider>
  );
  const view = render(renderPanel([{ id: 'c1', name: 'Solar' }]));
  fireEvent.change(screen.getByRole('combobox'), { target: { value: 'c1' } });
  fireEvent.click(screen.getByRole('button', { name: /load cap table/i }));
  await screen.findByRole('table');
  view.rerender(renderPanel([]));
  await waitFor(() => expect(screen.queryByRole('table')).toBeNull());
  expect(screen.queryByRole('textbox')).toBeNull();
});

test('changing authenticated actor clears loaded register and pending request context', async () => {
  stub(table([]), {});
  const panel = (token: string) => (
    <I18nProvider>
      <CorporateActionsPanel token={token} campaigns={[{ id: 'c1', name: 'Solar' }]} />
    </I18nProvider>
  );
  const view = render(panel('first-actor'));
  fireEvent.change(screen.getByRole('combobox'), { target: { value: 'c1' } });
  fireEvent.click(screen.getByRole('button', { name: /load cap table/i }));
  await screen.findByRole('table');
  view.rerender(panel('second-actor'));
  await waitFor(() => expect(screen.queryByRole('table')).toBeNull());
  expect((screen.getByRole('combobox') as HTMLSelectElement).value).toBe('');
});
