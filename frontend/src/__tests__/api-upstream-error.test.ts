import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from '../api';

describe('api() upstream failure', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('bounds a stalled read with a localized failure code', async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_url, options) =>
          new Promise((_resolve, reject) => {
            options.signal.addEventListener('abort', () => reject(new Error('aborted')));
          }),
      ),
    );
    const pending = expect(api('/api/campaigns')).rejects.toMatchObject({ code: 'API_UNAVAILABLE' });
    await vi.advanceTimersByTimeAsync(20000);
    await pending;
  });

  it('keeps the stable code so the banner can localize it', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: 'campaign data is temporarily unavailable', code: 'API_UNAVAILABLE' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    );
    await expect(api('/api/campaigns')).rejects.toMatchObject({ code: 'API_UNAVAILABLE' });
  });
});
