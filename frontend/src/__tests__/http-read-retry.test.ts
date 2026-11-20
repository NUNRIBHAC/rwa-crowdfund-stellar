import { afterEach, expect, it, vi } from 'vitest';
import { responseCall } from '../http';
const decode = (r: Response) => r.json();
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
it('retries a network-failed read exactly once', async () => {
  const fetch = vi
    .fn()
    .mockRejectedValueOnce(new TypeError('offline'))
    .mockResolvedValueOnce(Response.json({ ok: true }));
  vi.stubGlobal('fetch', fetch);
  await expect(responseCall('/read', {}, decode)).resolves.toEqual({ ok: true });
  expect(fetch).toHaveBeenCalledTimes(2);
});
it.each([502, 503, 504])('retries transient HTTP %s once', async (status) => {
  const fetch = vi
    .fn()
    .mockResolvedValueOnce(Response.json({}, { status }))
    .mockResolvedValueOnce(Response.json({ ok: true }));
  vi.stubGlobal('fetch', fetch);
  await expect(responseCall('/read', {}, decode)).resolves.toEqual({ ok: true });
  expect(fetch).toHaveBeenCalledTimes(2);
});
it.each([401, 403, 404, 429])('never retries HTTP %s', async (status) => {
  const fetch = vi.fn().mockResolvedValue(Response.json({}, { status }));
  vi.stubGlobal('fetch', fetch);
  await expect(responseCall('/read', {}, decode)).rejects.toMatchObject({ status });
  expect(fetch).toHaveBeenCalledTimes(1);
});
it('does not loop when both attempts fail', async () => {
  const fetch = vi.fn().mockRejectedValue(new TypeError('offline'));
  vi.stubGlobal('fetch', fetch);
  await expect(responseCall('/read', {}, decode)).rejects.toMatchObject({ code: 'API_UNAVAILABLE' });
  expect(fetch).toHaveBeenCalledTimes(2);
});
it.each(['POST', 'PUT', 'PATCH', 'DELETE'])('never retries %s', async (method) => {
  const fetch = vi.fn().mockRejectedValue(new TypeError('offline'));
  vi.stubGlobal('fetch', fetch);
  await expect(responseCall('/write', { method }, decode)).rejects.toMatchObject({ code: 'API_UNCONFIRMED' });
  expect(fetch).toHaveBeenCalledTimes(1);
});
it('does not retry a read after cancellation', async () => {
  const controller = new AbortController();
  controller.abort();
  const fetch = vi.fn().mockRejectedValue(new DOMException('Aborted', 'AbortError'));
  vi.stubGlobal('fetch', fetch);
  await expect(responseCall('/read', { signal: controller.signal }, decode)).rejects.toMatchObject({ name: 'AbortError' });
  expect(fetch).toHaveBeenCalledTimes(1);
});
it('keeps the original 20-second overall deadline across retry', async () => {
  vi.useFakeTimers();
  const fetch = vi
    .fn()
    .mockRejectedValueOnce(new TypeError('offline'))
    .mockImplementation(() => new Promise(() => {}));
  vi.stubGlobal('fetch', fetch);
  const result = expect(responseCall('/read', {}, decode)).rejects.toMatchObject({ code: 'API_UNAVAILABLE' });
  await vi.advanceTimersByTimeAsync(20000);
  await result;
  expect(fetch).toHaveBeenCalledTimes(2);
});
it('does not wait for transport body cancellation before the one allowed retry', async () => {
  const first = { status: 503, ok: false, body: { cancel: () => new Promise<void>(() => {}) } };
  const fetch = vi
    .fn()
    .mockResolvedValueOnce(first)
    .mockResolvedValueOnce(Response.json({ ok: true }));
  vi.stubGlobal('fetch', fetch);
  await expect(responseCall('/read', {}, decode)).resolves.toEqual({ ok: true });
  expect(fetch).toHaveBeenCalledTimes(2);
});
