import { cleanup, render } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';
import { I18nProvider, LOCALES } from '../i18n';
import ForInvestors from './ForInvestors';
import Footer from '../components/Footer';

afterEach(cleanup);
test.each(LOCALES.map(({ id }) => id))('investor resources and footer order in %s', (locale) => {
  localStorage.setItem('blockallisto-language', locale);
  const { container } = render(
    <I18nProvider>
      <ForInvestors />
      <Footer />
    </I18nProvider>,
  );
  const page = container.querySelector('.investors-page')!;
  expect(page.querySelector('h1')?.textContent?.trim()).toBeTruthy();
  expect(page.textContent).not.toMatch(/undefined|\[object Object\]/);
  expect(Array.from(page.querySelectorAll('.investors-resources a')).map((a) => a.getAttribute('href'))).toEqual([
    '/campaigns',
    '/account#investor-holdings',
    '/account#investor-documents',
    '/account#investor-assessment',
  ]);
  expect(page.querySelector('a[href="/learn"]')).toBeNull();
  const glossary = container.querySelector('footer a[href="/glossary"]')!.closest('li')!;
  expect(glossary.nextElementSibling?.querySelector('a')?.getAttribute('href')).toBe('/learn');
  expect(container.querySelectorAll('footer a[href="/learn"]')).toHaveLength(1);
});
