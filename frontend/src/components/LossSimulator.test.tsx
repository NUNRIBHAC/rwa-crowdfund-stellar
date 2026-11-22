import { afterEach, expect, test } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { I18nProvider, LOCALES } from '../i18n';
import LossSimulator from './LossSimulator';
afterEach(cleanup);
test.each(LOCALES.map((l) => l.id))('all three synthetic scenarios have translated output in %s', (locale) => {
  localStorage.setItem('blockallisto-language', locale);
  const { container } = render(
    <I18nProvider>
      <LossSimulator />
    </I18nProvider>,
  );
  const select = container.querySelector('select')!;
  expect(select.options).toHaveLength(3);
  for (const value of ['base', 'adverse', 'severe']) {
    fireEvent.change(select, { target: { value } });
    expect(select.value).toBe(value);
    expect(container.querySelectorAll('tbody tr')).toHaveLength(3);
    expect(container.querySelectorAll('details')).toHaveLength(3);
    expect(container.querySelector('.loss-summary')?.textContent?.trim()).toBeTruthy();
    expect(container.textContent).not.toMatch(/undefined|\[object Object\]|NaN/);
  }
  expect(container.querySelectorAll('input')).toHaveLength(0);
  expect(container.querySelectorAll('form')).toHaveLength(0);
  expect(container.querySelectorAll('bdi[dir="ltr"]')).toHaveLength(3);
  expect(container.querySelectorAll('a')).toHaveLength(0);
  expect(localStorage.getItem('loss-simulator')).toBeNull();
});
