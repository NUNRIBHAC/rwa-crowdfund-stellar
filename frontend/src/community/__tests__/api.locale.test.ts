// The UI locale must travel with the three mail-triggering calls so the
// backend can pick the mail template language the user is looking at.
import { afterEach, describe, expect, it, vi } from 'vitest';
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
    localStorage.setItem('blockallisto-locale', 'ja');
    const bodies = mockFetchCapture();
    await emailRegister('a@b.c', 'correct horse battery');
    await emailResend('a@b.c');
    await emailResetRequest('a@b.c');
    expect(bodies).toHaveLength(3);
    for (const body of bodies) expect(body.locale).toBe('ja');
  });

  it('omits locale when the UI never stored one (backend falls back to English)', async () => {
    const bodies = mockFetchCapture();
    await emailRegister('a@b.c', 'correct horse battery');
    await emailResend('a@b.c');
    await emailResetRequest('a@b.c');
    for (const body of bodies) expect('locale' in body).toBe(false);
  });
});
