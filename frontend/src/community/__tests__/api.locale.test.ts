// The UI locale must travel with the three mail-triggering calls so the
// backend can pick the mail template language the user is looking at.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { currentLocale } from '../../i18n';
import { emailRegister, emailResend, emailResetRequest } from '../api';

function mockFetchCapture() {
  const bodies: Record<string, unknown>[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (_url: string, init?: RequestInit) => {
      bodies.push(JSON.parse(String(init?.body)));
      return new Response(JSON.stringify({ status: 'verification-sent' }), { status: 200 });
    }),
  );
  return bodies;
}

describe('mail-triggering calls propagate the UI locale', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it('sends the stored UI locale on register, resend and reset-request', async () => {
    localStorage.setItem('blockallisto-language', 'ja');
    const bodies = mockFetchCapture();
    await emailRegister('a@b.c', 'correct horse battery');
    await emailResend('a@b.c');
    await emailResetRequest('a@b.c');
    expect(bodies).toHaveLength(3);
    for (const body of bodies) expect(body.locale).toBe('ja');
  });

  it('sends the detected UI locale even when there is no saved manual choice', async () => {
    const bodies = mockFetchCapture();
    await emailRegister('a@b.c', 'correct horse battery');
    await emailResend('a@b.c');
    await emailResetRequest('a@b.c');
    for (const body of bodies) expect(body.locale).toBe(currentLocale());
    expect(localStorage.getItem('blockallisto-language')).toBeNull();
  });
});

describe('HTTP failure without server text is localized', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });
  it('uses the stored UI language, not hardcoded English', async () => {
    localStorage.setItem('blockallisto-language', 'ar');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('bad gateway', { status: 502 })),
    );
    await expect(emailResend('a@b.c')).rejects.toThrow('فشل طلب الواجهة البرمجية');
    await expect(emailResend('a@b.c')).rejects.not.toThrow(/Request failed/);
  });
});

describe('backend error codes are localized at the API layer', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });
  it('maps a known code to the stored language and hides unknown server text', async () => {
    localStorage.setItem('blockallisto-language', 'pt');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ error: 'unknown campaign', code: 'campaign_not_found' }), { status: 404 })),
    );
    await expect(emailResend('a@b.c')).rejects.toThrow('Campanha desconhecida.');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ error: 'some new server text', code: 'brand_new' }), { status: 400 })),
    );
    await expect(emailResend('a@b.c')).rejects.toThrow('O pedido à API falhou');
  });
  it('shows the localized validation lead without raw English detail', async () => {
    localStorage.setItem('blockallisto-language', 'de');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ error: 'invalid input: amount required', code: 'invalid_input' }), { status: 400 })),
    );
    await expect(emailResend('a@b.c')).rejects.not.toThrow('amount required');
  });
});

describe('upload mode negotiation fails closed', () => {
  afterEach(() => vi.unstubAllGlobals());
  it('accepts only an explicitly supported server mode', async () => {
    const { fetchApplicationUploadMode } = await import('../api');
    for (const mode of ['legacy-inline', 'oracle-private']) {
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => new Response(JSON.stringify({ mode }))),
      );
      await expect(fetchApplicationUploadMode('synthetic-token')).resolves.toBe(mode);
    }
    for (const payload of [{}, { mode: 'unknown' }, { mode: null }]) {
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => new Response(JSON.stringify(payload))),
      );
      await expect(fetchApplicationUploadMode('synthetic-token')).rejects.toMatchObject({ code: 'API_UNAVAILABLE' });
    }
  });
});
