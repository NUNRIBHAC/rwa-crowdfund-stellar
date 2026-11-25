import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { I18nProvider, LOCALES } from '../i18n';
import { en } from '../i18n/locales/en';
import InvestorInformationGuide from './InvestorInformationGuide';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
const mount = () =>
  render(
    <I18nProvider>
      <InvestorInformationGuide />
    </I18nProvider>,
  );
test.each(LOCALES.map(({ id }) => id))('localized factual guide has no raw output or transaction actions in %s', (locale) => {
  localStorage.setItem('blockallisto-language', locale);
  const fetch = vi.fn();
  vi.stubGlobal('fetch', fetch);
  const { container } = mount();
  const guide = container.querySelector('.investor-information-guide')!;
  expect(guide.textContent).not.toMatch(/undefined|\[object Object\]|NaN/);
  expect(guide.querySelectorAll('details').length).toBeGreaterThan(10);
  expect(guide.querySelectorAll('input')).toHaveLength(1);
  expect(guide.querySelector('input')?.type).toBe('search');
  expect(guide.querySelector('form')).toBeNull();
  expect(guide.querySelectorAll('button:not([type="button"])')).toHaveLength(0);
  expect(guide.querySelector('a[href="/risk-warnings"]')).not.toBeNull();
  expect(guide.querySelector('a[href="/risk-disclosure"]')).not.toBeNull();
  expect(guide.querySelector('a[href="#yield-title"]')).not.toBeNull();
  expect(fetch).not.toHaveBeenCalled();
});
test('objective filters and free-text search do not rank or recommend', () => {
  localStorage.setItem('blockallisto-language', 'en');
  const { container, getByRole, getByText } = mount();
  const initial = container.querySelectorAll('details').length;
  fireEvent.click(getByRole('button', { name: en.yieldCalculator.feeAmount }));
  expect(container.querySelectorAll('details')).toHaveLength(1);
  expect(getByText(en.contributionTerms.fees)).toBeTruthy();
  fireEvent.change(getByRole('searchbox'), { target: { value: 'zzz-no-match-synthetic' } });
  expect(getByRole('status').textContent).toBe(en.informationGuide.noMatches);
  fireEvent.click(getByRole('button', { name: en.informationGuide.all }));
  expect(container.querySelectorAll('details')).toHaveLength(0);
  fireEvent.change(getByRole('searchbox'), { target: { value: '   ' } });
  expect(container.querySelectorAll('details')).toHaveLength(initial);
  expect(container.textContent).toContain(en.yieldCalculator.notice);
  expect(container.textContent).not.toContain(en.learn.suitableLabel);
});

test('guide explains the main monthly model without lifting reference-only assumptions out of context', () => {
  localStorage.setItem('blockallisto-language', 'en');
  const { container, getByRole } = mount();
  fireEvent.click(getByRole('button', { name: en.yieldCalculator.assumptions }));
  expect(container.textContent).toContain(en.yieldCalculator.advancedNote);
  expect(container.textContent).toContain(en.yieldCalculator.waterfallNote);
  expect(container.textContent).toContain(en.yieldCalculator.chartNote);
  expect(container.textContent).not.toContain(en.yieldCalculator.assumptionsNote);
  expect(container.textContent).not.toContain(en.yieldCalculator.formula);
  expect(new Set([...container.querySelectorAll('summary')].map((node) => node.textContent)).size).toBe(2);
});
