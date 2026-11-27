import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { I18nProvider, LOCALES } from '../i18n';
import { en } from '../i18n/locales/en';
import AssistantDocumentaryReview, { KIPSTER_SOURCES } from './AssistantDocumentaryReview';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

test.each(LOCALES.map(({ id }) => id))('assistant example is complete, read-only and separate from human review in %s', (locale) => {
  localStorage.setItem('blockallisto-language', locale);
  const fetch = vi.fn();
  vi.stubGlobal('fetch', fetch);
  const { container, getByRole } = render(
    <I18nProvider>
      <AssistantDocumentaryReview />
    </I18nProvider>,
  );
  expect(getByRole('region').getAttribute('aria-labelledby')).toBe(getByRole('heading', { level: 2 }).id);
  expect(container.querySelectorAll('ol > li')).toHaveLength(5);
  expect(container.querySelectorAll('a')).toHaveLength(6);
  expect(container.textContent).not.toMatch(/undefined|\[object Object\]|NaN/);
  expect(container.textContent).toContain('Instinct');
  expect(container.textContent).toContain('69940320');
  expect(container.textContent).toContain('83');
  expect(container.querySelector('button, input, form, [data-reviewed], .evidence-badge')).toBeNull();
  expect([...container.querySelectorAll('a')].map((a) => a.href)).toEqual(Object.values(KIPSTER_SOURCES));
  for (const a of container.querySelectorAll('a')) {
    expect(a.target).toBe('_blank');
    expect(a.rel).toBe('noopener noreferrer');
    expect(a.textContent!.length).toBeGreaterThan(15);
  }
  if (locale !== 'en') expect(container.textContent).not.toContain(en.assistantDocumentaryReview.notice);
  expect(fetch).not.toHaveBeenCalled();
});

test('English example preserves source attribution, historical terms and unresolved findings', () => {
  localStorage.setItem('blockallisto-language', 'en');
  const { container } = render(
    <I18nProvider>
      <AssistantDocumentaryReview />
    </I18nProvider>,
  );
  for (const text of Object.values(en.assistantDocumentaryReview)) expect(container.textContent).toContain(text);
  expect(container.textContent).toContain('Not an independent human review');
  expect(container.textContent).toContain('not an open offer here');
  expect(container.textContent).toContain('unknown');
  expect(container.textContent).toContain('not an audit');
  expect(container.textContent).toContain('not publication date');
});
