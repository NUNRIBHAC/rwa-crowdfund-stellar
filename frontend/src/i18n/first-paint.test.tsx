import { useLayoutEffect } from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';
import { I18nProvider } from './index';
afterEach(() => {
  cleanup();
  localStorage.clear();
  document.documentElement.classList.remove('rtl-text');
});
test('document locale and text direction are ready before the first animation frame', async () => {
  localStorage.setItem('blockallisto-language', 'ar');
  const frames: Array<{ lang: string; rtl: boolean }> = [];
  function Probe() {
    useLayoutEffect(() => {
      requestAnimationFrame(() => frames.push({ lang: document.documentElement.lang, rtl: document.documentElement.classList.contains('rtl-text') }));
    }, []);
    return null;
  }
  render(
    <I18nProvider>
      <Probe />
    </I18nProvider>,
  );
  await new Promise((done) => requestAnimationFrame(done));
  expect(frames).toEqual([{ lang: 'ar', rtl: true }]);
  expect(document.documentElement.dir).toBe('ltr');
});
