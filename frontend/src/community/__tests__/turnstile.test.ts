// Turnstile watchdog: a challenge that never settles (no callback, no
// error-callback) must reject with the localized turnstile_failed mapping
// and remove the widget so the form re-enables instead of hanging forever.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const SITEKEY = '1x00000000000000000000AA';

function stubAbuseConfig() {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ turnstileSiteKey: SITEKEY, socialProviders: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    ),
  );
}

async function loadModule() {
  vi.resetModules();
  return await import('../turnstile');
}

describe('getTurnstileToken', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    stubAbuseConfig();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    delete (window as unknown as { turnstile?: unknown }).turnstile;
    document.body.innerHTML = '';
  });

  it('rejects with turnstile_failed and removes the widget when the challenge never settles', async () => {
    const remove = vi.fn();
    const render = vi.fn().mockReturnValue('w1');
    (window as unknown as { turnstile: unknown }).turnstile = { render, remove, reset: vi.fn() };
    const { getTurnstileToken } = await loadModule();
    const pending = getTurnstileToken('pt');
    const assertion = expect(pending).rejects.toMatchObject({ code: 'turnstile_failed' });
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(90_000);
    await assertion;
    expect(remove).toHaveBeenCalledWith('w1');
  });

  it('resolves with the token and removes the widget on callback before the watchdog', async () => {
    const remove = vi.fn();
    const render = vi.fn().mockImplementation((_c: unknown, opts: { callback: (t: string) => void }) => {
      setTimeout(() => opts.callback('tok-123'), 1_000);
      return 'w1';
    });
    (window as unknown as { turnstile: unknown }).turnstile = { render, remove, reset: vi.fn() };
    const { getTurnstileToken } = await loadModule();
    const pending = getTurnstileToken('pt');
    await vi.advanceTimersByTimeAsync(1_500);
    await expect(pending).resolves.toBe('tok-123');
    expect(remove).toHaveBeenCalledWith('w1');
  });

  it('maps an error-callback to turnstile_failed with the vendor code in the message', async () => {
    const render = vi.fn().mockImplementation((_c: unknown, opts: { 'error-callback': (code?: string) => void }) => {
      setTimeout(() => opts['error-callback']('110200'), 1_000);
      return 'w1';
    });
    (window as unknown as { turnstile: unknown }).turnstile = { render, remove: vi.fn(), reset: vi.fn() };
    const { getTurnstileToken } = await loadModule();
    const pending = getTurnstileToken('pt');
    const assertion = expect(pending).rejects.toMatchObject({ code: 'turnstile_failed', message: 'turnstile error: 110200' });
    await vi.advanceTimersByTimeAsync(1_500);
    await assertion;
  });
});
