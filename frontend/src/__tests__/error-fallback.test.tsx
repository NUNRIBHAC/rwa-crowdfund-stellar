import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { I18nProvider, LOCALES, localizedApiError } from '../i18n';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { fetchNews, postComment } from '../community/api';

function Broken(): never {
  throw new Error('private synthetic render detail');
}
afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('safe errors across every shipped locale', () => {
  for (const { id } of LOCALES) {
    it(`${id}: unknown payloads and render failures always have localized text`, async () => {
      localStorage.setItem('blockallisto-language', id);
      const expected = localizedApiError('brand_new');
      expect(expected.trim().length).toBeGreaterThan(0);
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => new Response(JSON.stringify({ code: 'brand_new', error: 'private synthetic server detail' }), { status: 409 })),
      );
      await expect(fetchNews('demo')).rejects.toThrow(expected);
      vi.spyOn(console, 'error').mockImplementation(() => {});
      render(
        <I18nProvider>
          <ErrorBoundary>
            <Broken />
          </ErrorBoundary>
        </I18nProvider>,
      );
      expect(screen.getByRole('alert').textContent).toContain(expected);
      expect(screen.queryByText('private synthetic render detail')).toBeNull();
      expect(screen.getByRole('link').getAttribute('href')).toBe('/');
      expect(document.documentElement.dir).toBe('ltr');
      expect(document.documentElement.classList.contains('rtl-text')).toBe(id === 'ar');
    });
  }
  it('network failure and invalid successful JSON never become empty success or raw browser text', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('synthetic browser diagnostic')));
    await expect(fetchNews('demo')).rejects.toMatchObject({ code: 'API_UNAVAILABLE', message: localizedApiError('API_UNAVAILABLE') });
    for (const body of ['<html>not JSON</html>', 'null', '[]']) {
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => new Response(body, { status: 200 })),
      );
      await expect(fetchNews('demo')).rejects.toMatchObject({ code: 'API_UNAVAILABLE' });
    }
  });
  it('bounds stalled body decoding as well as connection setup on reads', async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, json: () => new Promise(() => {}) })),
    );
    const assertion = expect(fetchNews('demo')).rejects.toMatchObject({ code: 'API_UNAVAILABLE' });
    await vi.advanceTimersByTimeAsync(20000);
    await assertion;
  });
  it('does not abort or repeat mutations after 20 seconds; uncertain outcomes do not invite retry', async () => {
    vi.useFakeTimers();
    let finish!: (response: Response) => void;
    const fetchMock = vi.fn((_url, init: RequestInit) => {
      expect(init.signal).toBeUndefined();
      return new Promise<Response>((resolve) => {
        finish = resolve;
      });
    });
    vi.stubGlobal('fetch', fetchMock);
    const pending = postComment('synthetic-token', 'demo', 'synthetic');
    await vi.advanceTimersByTimeAsync(40000);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    finish(new Response(JSON.stringify({ comment: { id: 'one' } }), { status: 200 }));
    await pending;
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('diagnostic')));
    await expect(postComment('synthetic-token', 'demo', 'synthetic')).rejects.toMatchObject({
      code: 'API_UNCONFIRMED',
      message: localizedApiError('API_UNCONFIRMED'),
    });
  });
});
