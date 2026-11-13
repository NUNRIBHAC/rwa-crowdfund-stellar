import { afterEach, describe, expect, it, vi } from 'vitest';
import { installMediaFallback, installFontTimeout, reserveMediaUrl } from './media-fallback';
const origin = 'https://blockallisto-media.nunrib-df6.workers.dev';
let stop: (() => void) | undefined;
afterEach(() => {
  stop?.();
  document.body.innerHTML = '';
  vi.useRealTimers();
});
const tick = () => new Promise<void>((resolve) => queueMicrotask(resolve));
async function image(key = 'logo/blockallisto-lockup-horizontal.svg') {
  const img = document.createElement('img');
  img.src = origin + '/' + key;
  document.body.append(img);
  await tick();
  return img;
}
describe('independent public media fallback', () => {
  it('keeps the path on a same-origin reserve and drops query strings', () => {
    expect(reserveMediaUrl(origin + '/social/x.svg?test=1')).toBe('/media/social/x.svg');
    expect(reserveMediaUrl('/media/social/x.svg')).toBeNull();
    expect(reserveMediaUrl('https://other.example/social/x.svg')).toBeNull();
    expect(reserveMediaUrl(origin + '/private%2Fsecret.svg')).toBeNull();
  });
  for (const failure of ['403/1027', '429', '500', 'network'])
    it(`retries an image once after ${failure}`, async () => {
      stop = installMediaFallback();
      const img = await image();
      img.dispatchEvent(new Event('error'));
      expect(img.getAttribute('src')).toBe('/media/logo/blockallisto-lockup-horizontal.svg');
      img.dispatchEvent(new Event('error'));
      expect(img.getAttribute('src')).toBe('/media/logo/blockallisto-lockup-horizontal.svg');
    });
  it('retries a stalled request after the bounded timeout', async () => {
    vi.useFakeTimers();
    stop = installMediaFallback(document, 80);
    const img = await image('campaigns/demo-solar-farm.jpg');
    await vi.advanceTimersByTimeAsync(79);
    expect(img.src).toContain(origin);
    await vi.advanceTimersByTimeAsync(1);
    expect(img.getAttribute('src')).toBe('/media/campaigns/demo-solar-farm.jpg');
  });
  it('does not switch a successfully loaded image later', async () => {
    vi.useFakeTimers();
    stop = installMediaFallback(document, 80);
    const img = await image();
    img.dispatchEvent(new Event('load'));
    await vi.advanceTimersByTimeAsync(100);
    expect(img.src).toContain(origin);
  });
  it('new theme sources on the same element can fall back independently', async () => {
    stop = installMediaFallback();
    const img = await image();
    img.dispatchEvent(new Event('error'));
    img.src = origin + '/logo/blockallisto-lockup-horizontal-reversed.svg';
    await tick();
    img.dispatchEvent(new Event('error'));
    expect(img.getAttribute('src')).toBe('/media/logo/blockallisto-lockup-horizontal-reversed.svg');
  });
  it('does not let the old same-Worker illustration handler defeat the reserve', async () => {
    stop = installMediaFallback();
    const img = await image();
    img.addEventListener('error', () => {
      img.src = origin + '/illustrative-covers/blocks-0.svg';
    });
    img.dispatchEvent(new Event('error'));
    expect(img.getAttribute('src')).toBe('/media/logo/blockallisto-lockup-horizontal.svg');
  });
});

describe('font primary timeout', () => {
  const originalFonts = Object.getOwnPropertyDescriptor(document, 'fonts');
  afterEach(() => {
    if (originalFonts) Object.defineProperty(document, 'fonts', originalFonts);
    else Reflect.deleteProperty(document, 'fonts');
    document.querySelectorAll('link[href="/media-reserve-fonts.css"]').forEach((x) => x.remove());
  });
  it('activates the same-origin reserve sheet only once after a stall', async () => {
    vi.useFakeTimers();
    const fonts = Object.assign(new EventTarget(), { status: 'loading' });
    Object.defineProperty(document, 'fonts', { configurable: true, value: fonts });
    stop = installFontTimeout(document, 80);
    await vi.advanceTimersByTimeAsync(80);
    expect(document.querySelectorAll('link[href="/media-reserve-fonts.css"]').length).toBe(1);
    fonts.dispatchEvent(new Event('loading'));
    await vi.advanceTimersByTimeAsync(80);
    expect(document.querySelectorAll('link[href="/media-reserve-fonts.css"]').length).toBe(1);
  });
  it('does not activate the reserve if primary fonts finish in time', async () => {
    vi.useFakeTimers();
    const fonts = Object.assign(new EventTarget(), { status: 'loading' });
    Object.defineProperty(document, 'fonts', { configurable: true, value: fonts });
    stop = installFontTimeout(document, 80);
    fonts.status = 'loaded';
    fonts.dispatchEvent(new Event('loadingdone'));
    await vi.advanceTimersByTimeAsync(80);
    expect(document.querySelector('link[href="/media-reserve-fonts.css"]')).toBeNull();
  });
});
