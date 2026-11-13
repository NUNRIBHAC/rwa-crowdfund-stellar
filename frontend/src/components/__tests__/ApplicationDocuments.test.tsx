import { test, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { I18nProvider } from '../../i18n';
import ApplicationDocuments from '../ApplicationDocuments';
import type { IssuerApplication } from '../../community/api';
const mocks = vi.hoisted(() => ({
  uploadApplicationDocument: vi.fn(),
  fetchApplicationUploadMode: vi.fn(),
  readApplicationDocument: vi.fn(),
  linkApplicationCampaign: vi.fn(),
  deleteApplicationDocument: vi.fn(),
  submitIssuerApplicationDraft: vi.fn(),
  uploadOperation: vi.fn(),
  auth: { token: 'synthetic-token' },
}));
vi.mock('../../community/upload-operation', () => ({
  forgetUploadDocument: async () => {},
  uploadOperation: (...args: unknown[]) => mocks.uploadOperation(...args),
}));
vi.mock('../../community/CommunityAuth', () => ({ useCommunityAuth: () => mocks.auth }));
vi.mock('../../community/api', async (original) => ({ ...(await original<typeof import('../../community/api')>()), ...mocks }));
beforeEach(() => {
  mocks.auth.token = 'synthetic-token';
  mocks.fetchApplicationUploadMode.mockResolvedValue('oracle-private');
  mocks.uploadOperation.mockResolvedValue({ id: '00000000-0000-4000-8000-000000000001', complete: async () => {} });
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  localStorage.clear();
});
const application = {
  id: 'app-demo',
  projectName: 'Synthetic',
  status: 'received',
  documents: [{ id: 'doc-demo', filename: 'demo.txt', sha256: 'a'.repeat(64), uploadedAt: 1 }],
} as IssuerApplication;
test('private document content is rendered as text, never active HTML', async () => {
  mocks.readApplicationDocument.mockResolvedValue('<script>not executable</script>');
  render(
    <I18nProvider>
      <ApplicationDocuments application={application} />
    </I18nProvider>,
  );
  fireEvent.click(screen.getByRole('button', { name: 'View document: demo.txt' }));
  await screen.findByText('<script>not executable</script>');
  expect(document.querySelector('script')).toBeNull();
  expect(mocks.readApplicationDocument).toHaveBeenCalledWith('synthetic-token', 'app-demo', 'doc-demo', false);
});
test('operator cannot upload as owner; links only explicitly selected registered option', async () => {
  mocks.linkApplicationCampaign.mockResolvedValue({ ok: true });
  render(
    <I18nProvider>
      <ApplicationDocuments
        application={{ ...application, status: 'approved' }}
        operator
        campaigns={[{ id: 'registered-demo', name: 'Registered synthetic campaign' }]}
      />
    </I18nProvider>,
  );
  expect(document.querySelector('input[type=file]')).toBeNull();
  const button = screen.getByRole('button', { name: 'Link registered testnet campaign' });
  expect((button as HTMLButtonElement).disabled).toBe(true);
  fireEvent.change(screen.getByRole('combobox'), { target: { value: 'registered-demo' } });
  fireEvent.click(button);
  await waitFor(() => expect(mocks.linkApplicationCampaign).toHaveBeenCalledWith('synthetic-token', 'app-demo', 'registered-demo'));
});
test('closed submission has no upload and linked campaign is an ordinary detail link', () => {
  render(
    <I18nProvider>
      <ApplicationDocuments
        application={{
          ...application,
          status: 'closed',
          campaign: { id: 'registered-demo', contractId: 'C' + 'A'.repeat(55), linkedAt: 1, linkedBy: 'operator:synthetic' },
        }}
      />
    </I18nProvider>,
  );
  expect(document.querySelector('input[type=file]')).toBeNull();
  expect(screen.getByRole('link', { name: 'registered-demo' }).getAttribute('href')).toBe('/campaigns/registered-demo');
});

test('owner uploads only selected bounded synthetic UTF-8 text', async () => {
  mocks.uploadApplicationDocument.mockResolvedValue({ document: { id: 'new-doc' } });
  render(
    <I18nProvider>
      <ApplicationDocuments application={{ ...application, status: 'draft', documents: [] }} />
    </I18nProvider>,
  );
  const file = new File(['SYNTHETIC'], 'synthetic.txt', { type: 'text/plain' });
  Object.defineProperty(file, 'arrayBuffer', { value: async () => new TextEncoder().encode('SYNTHETIC').buffer });
  fireEvent.change(document.querySelector('input[type=file]')!, { target: { files: [file] } });
  fireEvent.click(screen.getByRole('button', { name: 'Save document' }));
  await waitFor(() =>
    expect(mocks.uploadApplicationDocument).toHaveBeenCalledWith(
      'synthetic-token',
      'app-demo',
      'synthetic.txt',
      'SYNTHETIC',
      '00000000-0000-4000-8000-000000000001',
    ),
  );
});
test('owner oversized file fails locally without upload request', async () => {
  render(
    <I18nProvider>
      <ApplicationDocuments application={{ ...application, status: 'draft', documents: [] }} />
    </I18nProvider>,
  );
  fireEvent.change(document.querySelector('input[type=file]')!, { target: { files: [new File(['x'.repeat(16001)], 'oversized.txt')] } });
  fireEvent.click(screen.getByRole('button', { name: 'Save document' }));
  await screen.findByRole('alert');
  expect(mocks.uploadApplicationDocument).not.toHaveBeenCalled();
});

test('only draft owner sees delete; confirmation and pending cloud cleanup are explicit', async () => {
  mocks.deleteApplicationDocument.mockResolvedValue({ status: 'deletion_pending' });
  render(
    <I18nProvider>
      <ApplicationDocuments application={{ ...application, status: 'draft' }} />
    </I18nProvider>,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Delete document: demo.txt' }));
  expect(mocks.deleteApplicationDocument).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
  await screen.findByRole('status');
  expect(screen.getByRole('status').textContent).toContain('cloud cleanup is still pending');
  expect(mocks.deleteApplicationDocument).toHaveBeenCalledWith('synthetic-token', 'app-demo', 'doc-demo');
  expect((screen.getByRole('button', { name: 'Submit application' }) as HTMLButtonElement).disabled).toBe(true);
});
test('submitted documents have no delete or final-submit controls', () => {
  render(
    <I18nProvider>
      <ApplicationDocuments application={application} />
    </I18nProvider>,
  );
  expect(screen.queryByRole('button', { name: 'Delete document: demo.txt' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Submit application' })).toBeNull();
});
test('draft final submit requires a separate explicit confirmation', async () => {
  mocks.submitIssuerApplicationDraft.mockResolvedValue({ application: { ...application, status: 'received' } });
  render(
    <I18nProvider>
      <ApplicationDocuments application={{ ...application, status: 'draft' }} />
    </I18nProvider>,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Submit application' }));
  expect(mocks.submitIssuerApplicationDraft).not.toHaveBeenCalled();
  expect(screen.getByText('After submission, you cannot add, replace or delete documents. Submit this application?')).not.toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
  await waitFor(() => expect(mocks.submitIssuerApplicationDraft).toHaveBeenCalledWith('synthetic-token', 'app-demo'));
});

for (const stage of ['file', 'idb'] as const)
  for (const change of ['unmount', 'token'] as const)
    test(`upload stops after delayed ${stage} when scope changes by ${change}`, async () => {
      let resolve!: (value: unknown) => void;
      const pending = new Promise((r) => (resolve = r));
      if (stage === 'idb') mocks.uploadOperation.mockReturnValue(pending);
      const file = new File(['SYNTHETIC'], 'synthetic.txt');
      Object.defineProperty(file, 'arrayBuffer', { value: () => (stage === 'file' ? pending : Promise.resolve(new TextEncoder().encode('SYNTHETIC').buffer)) });
      const view = render(
        <I18nProvider>
          <ApplicationDocuments application={{ ...application, status: 'draft', documents: [] }} />
        </I18nProvider>,
      );
      fireEvent.change(document.querySelector('input[type=file]')!, { target: { files: [file] } });
      fireEvent.click(screen.getByRole('button', { name: 'Save document' }));
      if (stage === 'idb') await waitFor(() => expect(mocks.uploadOperation).toHaveBeenCalled());
      if (change === 'unmount') view.unmount();
      else {
        mocks.auth.token = 'changed-token';
        view.rerender(
          <I18nProvider>
            <ApplicationDocuments application={{ ...application, status: 'draft', documents: [] }} />
          </I18nProvider>,
        );
      }
      resolve(stage === 'file' ? new TextEncoder().encode('SYNTHETIC').buffer : { id: '00000000-0000-4000-8000-000000000001', complete: async () => {} });
      await new Promise((r) => setTimeout(r, 20));
      expect(mocks.uploadApplicationDocument).not.toHaveBeenCalled();
    });

test('authoritative cleanup state survives mount and clears after server refetch', () => {
  const view = render(
    <I18nProvider>
      <ApplicationDocuments application={{ ...application, status: 'draft', documentCleanupPending: true }} />
    </I18nProvider>,
  );
  expect(screen.getByRole('status').textContent).toContain('cleanup');
  expect((screen.getByRole('button', { name: 'Submit application' }) as HTMLButtonElement).disabled).toBe(true);
  view.rerender(
    <I18nProvider>
      <ApplicationDocuments application={{ ...application, status: 'draft', documentCleanupPending: false }} />
    </I18nProvider>,
  );
  expect(screen.queryByRole('status')).toBeNull();
  expect((screen.getByRole('button', { name: 'Submit application' }) as HTMLButtonElement).disabled).toBe(false);
});
test('corrupt draft with submittedAt exposes neither upload nor delete', () => {
  render(
    <I18nProvider>
      <ApplicationDocuments application={{ ...application, status: 'draft', submittedAt: 1 }} />
    </I18nProvider>,
  );
  expect(document.querySelector('input[type=file]')).toBeNull();
  expect(screen.queryByRole('button', { name: 'Delete document: demo.txt' })).toBeNull();
});

test('default legacy mode uploads without a private operation or browser-storage dependency', async () => {
  mocks.fetchApplicationUploadMode.mockResolvedValue('legacy-inline');
  mocks.uploadOperation.mockRejectedValue(new Error('storage unavailable'));
  mocks.uploadApplicationDocument.mockResolvedValue({ document: { id: 'legacy-doc' } });
  render(
    <I18nProvider>
      <ApplicationDocuments application={{ ...application, status: 'draft', documents: [] }} />
    </I18nProvider>,
  );
  const file = new File(['SYNTHETIC'], 'legacy.txt', { type: 'text/plain' });
  Object.defineProperty(file, 'arrayBuffer', { value: async () => new TextEncoder().encode('SYNTHETIC').buffer });
  fireEvent.change(document.querySelector('input[type=file]')!, { target: { files: [file] } });
  fireEvent.click(screen.getByRole('button', { name: 'Save document' }));
  await waitFor(() => expect(mocks.uploadApplicationDocument).toHaveBeenCalledWith('synthetic-token', 'app-demo', 'legacy.txt', 'SYNTHETIC'));
  expect(mocks.uploadOperation).not.toHaveBeenCalled();
});
test('mode lookup failure never silently falls back to inline', async () => {
  mocks.fetchApplicationUploadMode.mockRejectedValue(new Error('unavailable'));
  render(
    <I18nProvider>
      <ApplicationDocuments application={{ ...application, status: 'draft', documents: [] }} />
    </I18nProvider>,
  );
  const file = new File(['SYNTHETIC'], 'mode.txt', { type: 'text/plain' });
  Object.defineProperty(file, 'arrayBuffer', { value: async () => new TextEncoder().encode('SYNTHETIC').buffer });
  fireEvent.change(document.querySelector('input[type=file]')!, { target: { files: [file] } });
  fireEvent.click(screen.getByRole('button', { name: 'Save document' }));
  await screen.findByText('unavailable');
  expect(mocks.uploadApplicationDocument).not.toHaveBeenCalled();
  expect(mocks.uploadOperation).not.toHaveBeenCalled();
});
