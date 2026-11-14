import { expect, it, vi } from 'vitest';
import { initialLocale } from './locale-bootstrap';

it('never requests country for a manual or supported browser preference', async () => {
  const request = vi.fn();
  expect(await initialLocale({ saved: () => 'ar', tags: ['en'], endpoint: 'https://unit.invalid/country', request })).toBe('ar');
  expect(await initialLocale({ saved: () => null, tags: ['tr', 'pt-BR'], endpoint: 'https://unit.invalid/country', request })).toBe('pt');
  expect(request).not.toHaveBeenCalled();
});
it('returns country default without storing country, IP or browser preferences', async () => {
  const request = vi.fn<typeof fetch>(async () => new Response(JSON.stringify({ country: 'PT' })));
  expect(await initialLocale({ saved: () => null, tags: ['tr'], endpoint: 'https://unit.invalid/country', request })).toBe('pt');
  expect(request).toHaveBeenCalledOnce();
  expect(request.mock.calls[0][1]).toMatchObject({ credentials: 'omit', cache: 'no-store', referrerPolicy: 'no-referrer' });
});
it('fails to English on quota, network, invalid JSON and invalid country', async () => {
  for (const request of [
    async () => new Response('', { status: 403 }),
    async () => Promise.reject(Error('network')),
    async () => new Response('bad'),
    async () => new Response('{"country":"XX"}'),
  ]) {
    expect(await initialLocale({ saved: () => null, tags: [], endpoint: 'https://unit.invalid/country', request })).toBe('en');
  }
});
it('never waits past timeout or changes the returned language on late country', async () => {
  let finish!: (value: Response) => void;
  const request = vi.fn(() => new Promise<Response>((resolve) => (finish = resolve)));
  expect(await initialLocale({ saved: () => null, tags: [], endpoint: 'https://unit.invalid/country', request, timeoutMs: 10 })).toBe('en');
  finish(new Response('{"country":"PT"}'));
  await Promise.resolve();
});
it('a newly saved manual choice beats an in-flight country reply', async () => {
  let value: unknown = null;
  const request = vi.fn(async () => {
    value = 'ko';
    return new Response('{"country":"PT"}');
  });
  expect(await initialLocale({ saved: () => value, tags: [], endpoint: 'https://unit.invalid/country', request })).toBe('ko');
});
