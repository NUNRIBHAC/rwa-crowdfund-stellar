import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import ApplicationDocuments from '../ApplicationDocuments';
import { I18nProvider } from '../../i18n';
import { deleteApplicationDocument, emailResend, type IssuerApplication } from '../../community/api';

vi.mock('../../community/CommunityAuth', () => ({ useCommunityAuth: () => ({ token: 'synthetic-token' }) }));
vi.mock('../../community/upload-operation', () => ({ forgetUploadDocument: async () => {} }));
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  localStorage.clear();
});
const application = {
  id: 'app-test',
  publicKey: 'synthetic',
  projectName: 'Synthetic',
  status: 'draft',
  documents: [{ id: 'doc-test', filename: 'synthetic.txt', sha256: 'a'.repeat(64), uploadedAt: 1 }],
} as IssuerApplication;

test('real DELETE decoder accepts 204 and the component removes the document', async () => {
  const fetch = vi.fn(async () => new Response(null, { status: 204 }));
  vi.stubGlobal('fetch', fetch);
  const changed = vi.fn();
  render(
    <I18nProvider>
      <ApplicationDocuments application={application} onChange={changed} />
    </I18nProvider>,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Delete document: synthetic.txt' }));
  fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
  await waitFor(() => expect(changed).toHaveBeenCalledOnce());
  expect(screen.queryByText('View document: synthetic.txt')).toBeNull();
  expect(fetch).toHaveBeenCalledOnce();
  expect(fetch.mock.calls[0]).toEqual([
    '/api/issuer-applications/app-test/documents/doc-test',
    expect.objectContaining({ method: 'DELETE', headers: { Authorization: 'Bearer synthetic-token' } }),
  ]);
});
test('202 keeps the durable pending deletion status', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify({ status: 'deletion_pending' }), { status: 202 })),
  );
  await expect(deleteApplicationDocument('synthetic-token', 'app-test', 'doc-test')).resolves.toEqual({ status: 'deletion_pending' });
});
test.each([200, 202])('empty or malformed success %s is still unconfirmed', async (status) => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response('not json', { status })),
  );
  await expect(deleteApplicationDocument('synthetic-token', 'app-test', 'doc-test')).rejects.toMatchObject({ code: 'API_UNCONFIRMED' });
});
test('204 exception is not applied to ordinary JSON endpoints', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(null, { status: 204 })),
  );
  await expect(emailResend('a@example.invalid')).rejects.toMatchObject({ code: 'API_UNCONFIRMED' });
});
