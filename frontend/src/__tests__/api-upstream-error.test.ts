import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from '../api';

describe('api() upstream failure', () => {
  afterEach(() => vi.unstubAllGlobals());

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
