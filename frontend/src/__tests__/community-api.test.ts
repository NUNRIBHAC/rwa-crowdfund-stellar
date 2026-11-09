// Community API client tests: fetch is mocked; verifies URLs, methods,
// headers (incl. bearer token), JSON bodies and error surfacing.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  fetchComments,
  fetchMe,
  fetchMyTickets,
  loadCommunityToken,
  postComment,
  requestChallenge,
  saveCommunityToken,
  submitIssuerApplication,
  updateDisplayName,
  verifyChallenge,
  createTicket,
  fetchNews,
  downloadInvestmentDocument,
} from '../community/api';

const ok = (v: unknown) => ({ ok: true, status: 200, json: () => Promise.resolve(v) }) as Response;
const fail = (status: number, error: string) => ({ ok: false, status, json: () => Promise.resolve({ error }) }) as Response;

describe('community api client', () => {
  beforeEach(() => {
    localStorage.clear();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('stores and loads the session token', () => {
    expect(loadCommunityToken()).toBe('');
    saveCommunityToken('bls_abc');
    expect(loadCommunityToken()).toBe('bls_abc');
    saveCommunityToken('');
    expect(loadCommunityToken()).toBe('');
  });

  it('posts challenge and verify with JSON bodies', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(ok({ message: 'm', expiresAt: 1 }))
      .mockResolvedValueOnce(ok({ token: 'bls_t', expiresAt: 2, account: { publicKey: 'G' } }));
    vi.stubGlobal('fetch', fetchMock);
    await requestChallenge('GABC');
    await verifyChallenge('GABC', 'c2ln');
    expect(fetchMock).toHaveBeenNthCalledWith(1, '/api/auth/challenge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ publicKey: 'GABC' }),
    });
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/auth/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ publicKey: 'GABC', signature: 'c2ln' }),
    });
  });

  it('sends the bearer token on authenticated reads and writes', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(ok({ account: { publicKey: 'G' } }))
      .mockResolvedValueOnce(ok({ account: { publicKey: 'G', displayName: 'N' } }))
      .mockResolvedValueOnce(ok({ comment: { id: 'c1' } }))
      .mockResolvedValueOnce(ok({ tickets: [] }));
    vi.stubGlobal('fetch', fetchMock);
    await fetchMe('bls_t');
    await updateDisplayName('bls_t', 'N');
    await postComment('bls_t', 'demo-solar', 'hello');
    await fetchMyTickets('bls_t');
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer bls_t');
    expect(fetchMock.mock.calls[1][0]).toBe('/api/auth/me');
    expect(fetchMock.mock.calls[1][1].method).toBe('PUT');
    expect(fetchMock.mock.calls[2][0]).toBe('/api/campaigns/demo-solar/comments');
    expect(fetchMock.mock.calls[2][1].body).toBe(JSON.stringify({ body: 'hello' }));
    expect(fetchMock.mock.calls[3][1].headers.Authorization).toBe('Bearer bls_t');
  });

  it('reads comments without a token and encodes campaign ids', async () => {
    const fetchMock = vi.fn().mockResolvedValue(ok({ comments: [] }));
    vi.stubGlobal('fetch', fetchMock);
    await fetchComments('a b');
    expect(fetchMock.mock.calls[0][0]).toBe('/api/campaigns/a%20b/comments');
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBeUndefined();
  });

  it('sends ticket and application payloads to the right endpoints', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(ok({ ticket: { id: 't1' } }))
      .mockResolvedValueOnce(ok({ application: { id: 'a1' } }));
    vi.stubGlobal('fetch', fetchMock);
    await createTicket('bls_t', { kind: 'feedback', subject: 's', body: 'b' });
    await submitIssuerApplication('bls_t', {
      projectName: 'p',
      country: 'PT',
      instrumentType: 'bond',
      targetAmount: '1000',
      description: 'd',
      contactEmail: '',
    });
    expect(fetchMock.mock.calls[0][0]).toBe('/api/support/tickets');
    expect(fetchMock.mock.calls[0][1].body).toBe(JSON.stringify({ kind: 'feedback', subject: 's', body: 'b' }));
    expect(fetchMock.mock.calls[1][0]).toBe('/api/issuer-applications');
  });

  it('maps the news endpoint from the actual backend shape { news: [...] }', async () => {
    const fetchMock = vi.fn().mockResolvedValue(ok({ news: [{ id: 'n1', authorLabel: 'platform-demo' }] }));
    vi.stubGlobal('fetch', fetchMock);
    const v = await fetchNews('demo-solar');
    expect(fetchMock.mock.calls[0][0]).toBe('/api/campaigns/demo-solar/news');
    expect(v.news).toHaveLength(1);
    expect(v.news[0].authorLabel).toBe('platform-demo');
  });

  it('surfaces server error messages', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(fail(401, 'invalid or expired session')));
    await expect(fetchMe('bls_bad')).rejects.toThrow('invalid or expired session');
  });

  it('passes the download AbortSignal with bearer auth, never in the URL', async () => {
    const controller = new AbortController();
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response('synthetic', { status: 200, headers: { 'content-disposition': 'attachment; filename="terms.txt"' } }));
    vi.stubGlobal('fetch', fetchMock);
    const { filename } = await downloadInvestmentDocument('private-token', 'doc/one', controller.signal);
    expect(filename).toBe('terms.txt');
    expect(fetchMock).toHaveBeenCalledWith('/api/investment-documents/doc%2Fone/download', {
      headers: { Authorization: 'Bearer private-token' },
      signal: controller.signal,
    });
  });

  it('propagates an aborted download without returning a blob', async () => {
    const controller = new AbortController();
    controller.abort();
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new DOMException('aborted', 'AbortError')));
    await expect(downloadInvestmentDocument('private-token', 'doc', controller.signal)).rejects.toHaveProperty('name', 'AbortError');
  });
});
