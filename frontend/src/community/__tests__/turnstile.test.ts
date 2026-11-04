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

  it('does not manufacture a token when the deployment has no public site key', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ turnstileSiteKey: null })));
    const render = vi.fn();
    window.turnstile = { render, remove: vi.fn(), reset: vi.fn() };
    const { getTurnstileToken } = await loadModule();
    await expect(getTurnstileToken('pt')).resolves.toBeUndefined();
    expect(render).not.toHaveBeenCalled();
    expect(document.querySelector('.turnstile-widget')).toBeNull();
  });

  it('keeps vendor failure evidence distinct from the watchdog without exposing a token', async () => {
    const render = vi.fn().mockImplementation((_container, options) => {
      setTimeout(() => options['error-callback']('300030'), 10);
      return 'vendor-failure';
    });
    const remove = vi.fn();
    window.turnstile = { render, remove, reset: vi.fn() };
    const { getTurnstileToken } = await loadModule();
    const result = getTurnstileToken('pt');
    const assertion = expect(result).rejects.toMatchObject({ code: 'turnstile_failed', message: 'turnstile error: 300030' });
    await vi.advanceTimersByTimeAsync(20);
    await assertion;
    await vi.advanceTimersByTimeAsync(90_000);
    expect(remove).toHaveBeenCalledTimes(1);
  });

  it('ignores a late success callback after the watchdog has rejected', async () => {
    let callback: ((token: string) => void) | undefined;
    const render = vi.fn().mockImplementation((_container, options) => {
      callback = options.callback;
      return 'stalled';
    });
    const remove = vi.fn();
    window.turnstile = { render, remove, reset: vi.fn() };
    const { getTurnstileToken } = await loadModule();
    const result = getTurnstileToken('pt');
    const assertion = expect(result).rejects.toMatchObject({ code: 'turnstile_failed', message: 'turnstile error: timeout' });
    await vi.advanceTimersByTimeAsync(90_000);
    await assertion;
    callback?.('late-test-token');
    expect(remove).toHaveBeenCalledTimes(1);
  });

  it('resets an expired challenge without resolving tokenless or extending the watchdog', async () => {
    let expire: (() => void) | undefined;
    const render = vi.fn().mockImplementation((_container, options) => {
      expire = options['expired-callback'];
      return 'expired';
    });
    const reset = vi.fn();
    window.turnstile = { render, remove: vi.fn(), reset };
    const { getTurnstileToken } = await loadModule();
    const result = getTurnstileToken('pt');
    const assertion = expect(result).rejects.toMatchObject({ message: 'turnstile error: timeout' });
    await vi.advanceTimersByTimeAsync(10);
    expire?.();
    expect(reset).toHaveBeenCalledWith('expired');
    await vi.advanceTimersByTimeAsync(90_000);
    await assertion;
  });

  it('mounts beside the active sign-in form and brings an interactive challenge into view', async () => {
    document.body.innerHTML = '<section class="community-section"><button>Submit</button><div data-turnstile-mount></div></section><footer>Footer</footer>';
    document.querySelector('button')!.focus();
    const scroll = vi.fn();
    const original = HTMLElement.prototype.scrollIntoView;
    HTMLElement.prototype.scrollIntoView = scroll;
    let target: HTMLElement | undefined;
    window.turnstile = {
      render: vi.fn().mockImplementation((container, options) => {
        target = container;
        setTimeout(() => options.callback('local-only-token'), 10);
        return 'visible';
      }),
      remove: vi.fn(),
      reset: vi.fn(),
    };
    try {
      const { getTurnstileToken } = await loadModule();
      const result = getTurnstileToken('pt');
      await vi.advanceTimersByTimeAsync(20);
      await expect(result).resolves.toBe('local-only-token');
      expect(target?.parentElement?.hasAttribute('data-turnstile-mount')).toBe(true);
      expect(target?.closest('.community-section')).not.toBeNull();
      expect(scroll).toHaveBeenCalledWith({ block: 'center', behavior: 'smooth' });
    } finally {
      HTMLElement.prototype.scrollIntoView = original;
    }
  });

  it('uses a fresh connected mount after the previous sign-in panel unmounts', async () => {
    const first = document.createElement('div');
    first.setAttribute('data-turnstile-mount', '');
    document.body.appendChild(first);
    const targets: HTMLElement[] = [];
    window.turnstile = {
      render: vi.fn().mockImplementation((target, options) => {
        targets.push(target);
        setTimeout(() => options.callback('test-token'), 1);
        return 'mount-test';
      }),
      remove: vi.fn(),
      reset: vi.fn(),
    };
    const { getTurnstileToken } = await loadModule();
    const a = getTurnstileToken('en');
    await vi.advanceTimersByTimeAsync(10);
    await a;
    first.remove();
    const next = document.createElement('div');
    next.setAttribute('data-turnstile-mount', '');
    document.body.appendChild(next);
    const b = getTurnstileToken('en');
    await vi.advanceTimersByTimeAsync(10);
    await b;
    expect(targets[0]).not.toBe(targets[1]);
    expect(targets[1].parentElement).toBe(next);
    expect(targets[1].isConnected).toBe(true);
  });
});
