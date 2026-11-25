import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import OperatorEvidenceEditor from './OperatorEvidenceEditor';
import { useCommunityAuth } from '../community/CommunityAuth';
import { appendOperatorEvidence, fetchOperatorEvidence } from '../community/api';
import { en } from '../i18n/locales/en';
vi.mock('../community/CommunityAuth', () => ({ useCommunityAuth: vi.fn() }));
vi.mock('../community/api', () => ({ appendOperatorEvidence: vi.fn(), fetchOperatorEvidence: vi.fn() }));
const copy = {
  addSource: 'Add public source',
  sourceTitle: 'Source title',
  sourceUrl: 'Source URL',
  sourcePublisher: 'Publisher',
  sourceRetrieved: 'Retrieved today',
  sourcePublicOnly: 'Public URLs only',
  title: 'Evidence editor',
  note: 'Public notes only',
  campaign: 'Campaign',
  claim: 'Claim',
  action: 'Action',
  correction: 'Correction',
  review: 'Review',
  reviewText: 'Replacement',
  reviewNote: 'Public note',
  sources: 'Sources',
  humanReviewed: 'Personally checked',
  preview: 'Preview',
  publish: 'Publish',
  back: 'Back',
  saved: 'Saved',
  failed: 'Reload before retry',
  reload: 'Reload',
};
const dossier = {
  campaignId: 'synthetic',
  state: 'available',
  revisedOn: '2026-11-25',
  revision: 'a'.repeat(64),
  sources: [{ id: 'source', title: 'Synthetic public source', url: 'https://example.org/fact', publisher: 'independent', retrievedOn: '2026-11-25' }],
  claims: [
    {
      id: 'claim',
      area: 'issuer',
      text: 'Synthetic fact',
      status: 'checked_fact',
      sourceIds: ['source'],
      review: { checkedOn: '2026-11-25', note: 'Synthetic test only' },
    },
  ],
  corrections: [],
  unknownAreas: [],
};
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});
function setup(operator = true) {
  vi.mocked(useCommunityAuth).mockReturnValue({ account: { publicKey: 'synthetic' }, token: 'session', isOperator: operator } as never);
  vi.mocked(fetchOperatorEvidence).mockResolvedValue({ evidence: dossier } as never);
  vi.mocked(appendOperatorEvidence).mockResolvedValue({ revision: 'b'.repeat(64) });
  return render(<OperatorEvidenceEditor campaigns={[{ id: 'synthetic', name: 'Synthetic campaign' }]} copy={copy} evidenceCopy={en.issuerEvidence} />);
}
test('hidden for non-operators and makes no reads or writes', () => {
  const { container } = setup(false);
  expect(container.innerHTML).toBe('');
  expect(fetchOperatorEvidence).not.toHaveBeenCalled();
});
test('correction requires selection, note, sources, preview and explicit publication', async () => {
  setup();
  fireEvent.change(screen.getByLabelText('Campaign'), { target: { value: 'synthetic' } });
  await screen.findByLabelText('Claim');
  fireEvent.change(screen.getByLabelText('Claim'), { target: { value: 'claim' } });
  fireEvent.change(screen.getByLabelText('Public note'), { target: { value: 'Synthetic correction only' } });
  expect(screen.getByRole('button', { name: 'Preview' }).hasAttribute('disabled')).toBe(true);
  fireEvent.click(screen.getByLabelText('Synthetic public source'));
  fireEvent.click(screen.getByText('Preview'));
  expect(appendOperatorEvidence).not.toHaveBeenCalled();
  fireEvent.click(screen.getByText('Publish'));
  await waitFor(() => expect(appendOperatorEvidence).toHaveBeenCalledTimes(1));
  expect(vi.mocked(appendOperatorEvidence).mock.calls[0][2]).toMatchObject({
    revision: dossier.revision,
    action: 'correction',
    claimId: 'claim',
    sourceIds: ['source'],
    note: 'Synthetic correction only',
  });
  await screen.findByText('Saved');
});
test('network and conflict details never surface raw server text', async () => {
  setup();
  vi.mocked(fetchOperatorEvidence).mockRejectedValue(new Error('SECRET RAW FAILURE'));
  fireEvent.change(screen.getByLabelText('Campaign'), { target: { value: 'synthetic' } });
  await screen.findByRole('alert');
  expect(screen.queryByText('SECRET RAW FAILURE')).toBeNull();
});

test('reviewed replacement needs explicit human assertion and preserves original until publication', async () => {
  setup();
  vi.mocked(fetchOperatorEvidence).mockResolvedValue({
    evidence: {
      ...dossier,
      corrections: [{ id: 'fix', claimId: 'claim', note: 'Synthetic withdrawn review', correctedOn: '2026-11-25', sourceIds: ['source'] }],
    },
  } as never);
  fireEvent.change(screen.getByLabelText('Campaign'), { target: { value: 'synthetic' } });
  await screen.findByLabelText('Claim');
  fireEvent.change(screen.getByLabelText('Claim'), { target: { value: 'claim' } });
  fireEvent.change(screen.getByLabelText('Action'), { target: { value: 'review' } });
  fireEvent.change(screen.getByLabelText('Replacement'), { target: { value: 'Synthetic replacement fact' } });
  fireEvent.change(screen.getByLabelText('Public note'), { target: { value: 'Synthetic actual reviewer test' } });
  fireEvent.click(screen.getByLabelText('Synthetic public source'));
  expect(screen.getByRole('button', { name: 'Preview' }).hasAttribute('disabled')).toBe(true);
  fireEvent.click(screen.getByLabelText('Personally checked'));
  fireEvent.click(screen.getByText('Preview'));
  expect(appendOperatorEvidence).not.toHaveBeenCalled();
  fireEvent.click(screen.getByText('Publish'));
  await waitFor(() => expect(appendOperatorEvidence).toHaveBeenCalledTimes(1));
  expect(vi.mocked(appendOperatorEvidence).mock.calls[0][2]).toMatchObject({ humanReviewed: true, text: 'Synthetic replacement fact', action: 'review' });
});

test('old campaign read cannot populate a new campaign editor', async () => {
  vi.mocked(useCommunityAuth).mockReturnValue({ account: { publicKey: 'synthetic' }, token: 'session', isOperator: true } as never);
  let finish: (value: unknown) => void = () => {};
  vi.mocked(fetchOperatorEvidence).mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve as never;
      }),
  );
  render(
    <OperatorEvidenceEditor
      campaigns={[
        { id: 'synthetic', name: 'First' },
        { id: 'second', name: 'Second' },
      ]}
      copy={copy}
      evidenceCopy={en.issuerEvidence}
    />,
  );
  fireEvent.change(screen.getByLabelText('Campaign'), { target: { value: 'synthetic' } });
  vi.mocked(fetchOperatorEvidence).mockResolvedValue({ evidence: { ...dossier, campaignId: 'second', claims: [] } } as never);
  fireEvent.change(screen.getByLabelText('Campaign'), { target: { value: 'second' } });
  await waitFor(() => expect(fetchOperatorEvidence).toHaveBeenCalledWith('second'));
  finish({ evidence: dossier });
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(screen.queryByText('Synthetic fact')).toBeNull();
});

test('a response for a different campaign fails closed', async () => {
  setup();
  vi.mocked(fetchOperatorEvidence).mockResolvedValue({ evidence: { ...dossier, campaignId: 'wrong' } } as never);
  fireEvent.change(screen.getByLabelText('Campaign'), { target: { value: 'synthetic' } });
  await screen.findByRole('alert');
  expect(screen.queryByLabelText('Claim')).toBeNull();
});

test('completion after losing operator session cannot show saved state or refresh', async () => {
  const view = setup();
  let finish: (value: { revision: string }) => void = () => {};
  vi.mocked(appendOperatorEvidence).mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  fireEvent.change(screen.getByLabelText('Campaign'), { target: { value: 'synthetic' } });
  await screen.findByLabelText('Claim');
  fireEvent.change(screen.getByLabelText('Claim'), { target: { value: 'claim' } });
  fireEvent.change(screen.getByLabelText('Public note'), { target: { value: 'Synthetic pending correction' } });
  fireEvent.click(screen.getByLabelText('Synthetic public source'));
  fireEvent.click(screen.getByText('Preview'));
  fireEvent.click(screen.getByText('Publish'));
  await waitFor(() => expect(appendOperatorEvidence).toHaveBeenCalledTimes(1));
  vi.mocked(useCommunityAuth).mockReturnValue({ account: null, token: '', isOperator: false } as never);
  view.rerender(<OperatorEvidenceEditor campaigns={[{ id: 'synthetic', name: 'Synthetic campaign' }]} copy={copy} evidenceCopy={en.issuerEvidence} />);
  finish({ revision: 'b'.repeat(64) });
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(screen.queryByText('Saved')).toBeNull();
  expect(fetchOperatorEvidence).toHaveBeenCalledTimes(1);
});

test('an ambiguous mutation failure retains the same request ID for an unchanged retry', async () => {
  setup();
  vi.mocked(appendOperatorEvidence)
    .mockRejectedValueOnce(new Error('Synthetic unknown result'))
    .mockResolvedValueOnce({ revision: 'b'.repeat(64) });
  fireEvent.change(screen.getByLabelText('Campaign'), { target: { value: 'synthetic' } });
  await screen.findByLabelText('Claim');
  fireEvent.change(screen.getByLabelText('Claim'), { target: { value: 'claim' } });
  fireEvent.change(screen.getByLabelText('Public note'), { target: { value: 'Synthetic retry correction' } });
  fireEvent.click(screen.getByLabelText('Synthetic public source'));
  fireEvent.click(screen.getByText('Preview'));
  fireEvent.click(screen.getByText('Publish'));
  await screen.findByRole('alert');
  const first = vi.mocked(appendOperatorEvidence).mock.calls[0][2];
  fireEvent.click(screen.getByText('Publish'));
  await waitFor(() => expect(appendOperatorEvidence).toHaveBeenCalledTimes(2));
  expect(vi.mocked(appendOperatorEvidence).mock.calls[1][2]).toEqual(first);
});

test('new source is public-only previewed and included in the same publication', async () => {
  setup();
  fireEvent.change(screen.getByLabelText('Campaign'), { target: { value: 'synthetic' } });
  await screen.findByLabelText('Claim');
  fireEvent.change(screen.getByLabelText('Claim'), { target: { value: 'claim' } });
  fireEvent.change(screen.getByLabelText('Public note'), { target: { value: 'Synthetic corrected source' } });
  fireEvent.click(screen.getByLabelText('Add public source'));
  fireEvent.change(screen.getByLabelText('Source title'), { target: { value: 'Synthetic replacement registry' } });
  fireEvent.change(screen.getByLabelText('Source URL'), { target: { value: 'https://example.org/new?token=private' } });
  expect(screen.getByRole('button', { name: 'Preview' }).hasAttribute('disabled')).toBe(true);
  fireEvent.change(screen.getByLabelText('Source URL'), { target: { value: 'https://example.org/new' } });
  fireEvent.click(screen.getByText('Preview'));
  expect(appendOperatorEvidence).not.toHaveBeenCalled();
  fireEvent.click(screen.getByText('Publish'));
  await waitFor(() => expect(appendOperatorEvidence).toHaveBeenCalledTimes(1));
  const value = vi.mocked(appendOperatorEvidence).mock.calls[0][2];
  expect(value.newSource).toMatchObject({ title: 'Synthetic replacement registry', url: 'https://example.org/new', publisher: 'independent' });
  expect(value.sourceIds).toEqual([value.newSource!.id]);
});
