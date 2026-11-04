import { test, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { I18nProvider } from '../../i18n';
import ApplicationDocuments from '../ApplicationDocuments';
import type { IssuerApplication } from '../../community/api';
const mocks = vi.hoisted(() => ({ uploadApplicationDocument: vi.fn(), readApplicationDocument: vi.fn(), linkApplicationCampaign: vi.fn() }));
vi.mock('../../community/CommunityAuth', () => ({ useCommunityAuth: () => ({ token: 'synthetic-token' }) }));
vi.mock('../../community/api', async (original) => ({ ...(await original<typeof import('../../community/api')>()), ...mocks }));
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
      <ApplicationDocuments application={{ ...application, documents: [] }} />
    </I18nProvider>,
  );
  const file = new File(['SYNTHETIC'], 'synthetic.txt', { type: 'text/plain' });
  Object.defineProperty(file, 'arrayBuffer', { value: async () => new TextEncoder().encode('SYNTHETIC').buffer });
  fireEvent.change(document.querySelector('input[type=file]')!, { target: { files: [file] } });
  fireEvent.click(screen.getByRole('button', { name: 'Save document' }));
  await waitFor(() => expect(mocks.uploadApplicationDocument).toHaveBeenCalledWith('synthetic-token', 'app-demo', 'synthetic.txt', 'SYNTHETIC'));
});
test('owner oversized file fails locally without upload request', async () => {
  render(
    <I18nProvider>
      <ApplicationDocuments application={{ ...application, documents: [] }} />
    </I18nProvider>,
  );
  fireEvent.change(document.querySelector('input[type=file]')!, { target: { files: [new File(['x'.repeat(16001)], 'oversized.txt')] } });
  fireEvent.click(screen.getByRole('button', { name: 'Save document' }));
  await screen.findByRole('alert');
  expect(mocks.uploadApplicationDocument).not.toHaveBeenCalled();
});
