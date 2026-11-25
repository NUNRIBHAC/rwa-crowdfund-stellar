import { afterEach, expect, test } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { I18nProvider, LOCALES } from '../i18n';
import TileWall from './TileWall';
afterEach(cleanup);
test.each(LOCALES.map((l) => l.id))('simulation opens full, tracks exact percentage, refunds and resets in %s', (locale) => {
  localStorage.setItem('blockallisto-language', locale);
  const view = render(
    <I18nProvider>
      <TileWall />
    </I18nProvider>,
  );
  const range = view.container.querySelector('input')!;
  const visible = () => view.container.querySelectorAll('.wall-tile:not(.is-unfunded)').length;
  expect(range.value).toBe('100');
  expect(visible()).toBe(240);
  for (const [value, count] of [
    ['0', 0],
    ['1', 2],
    ['33', 79],
    ['50', 120],
    ['99', 237],
    ['100', 240],
  ] as const) {
    fireEvent.change(range, { target: { value } });
    expect(visible()).toBe(count);
    expect(view.container.querySelector('output')?.textContent).toBe(value + '%');
  }
  const buttons = view.container.querySelectorAll('button');
  fireEvent.click(buttons[0]);
  expect(range.disabled).toBe(true);
  expect(view.container.querySelector('.is-refunding')).not.toBeNull();
  fireEvent.click(buttons[1]);
  expect(range.value).toBe('100');
  expect(range.disabled).toBe(false);
  expect(visible()).toBe(240);
  view.unmount();
  const fresh = render(
    <I18nProvider>
      <TileWall />
    </I18nProvider>,
  );
  expect(fresh.container.querySelector('input')?.value).toBe('100');
});
