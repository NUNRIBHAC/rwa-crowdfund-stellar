import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';
import FoundingCampaign from './FoundingCampaign';
import { I18nProvider, LOCALES } from '../i18n';
import { routeFromPath, routePath } from '../router';
import Footer from '../components/Footer';
import approved from '../data/founding-campaign-approved-pt.json';
afterEach(cleanup);
function setup(locale = 'pt') {
  localStorage.setItem('blockallisto-language', locale);
  return render(
    <I18nProvider>
      <FoundingCampaign />
      <Footer />
    </I18nProvider>,
  );
}
test('keeps all 11 Portuguese paragraphs verbatim and in order', () => {
  const { container } = setup();
  expect(Array.from(container.querySelectorAll('[data-approved-paragraph]'), (p) => p.textContent)).toEqual(approved);
  expect(approved).toHaveLength(11);
});
test.each(LOCALES.map((l) => l.id))('all campaign copy, tile controls and footer in %s', (locale) => {
  const { container } = setup(locale);
  expect(container.querySelectorAll('[data-approved-paragraph]')).toHaveLength(11);
  expect(container.querySelectorAll('.founding-campaign>section:not(.tile-wall-demo)')).toHaveLength(8);
  expect(container.querySelectorAll('.wall-tile')).toHaveLength(48);
  const future = container.querySelectorAll('.founding-future');
  expect(future).toHaveLength(1);
  expect(future[0].previousElementSibling?.hasAttribute('data-approved-paragraph')).toBe(true);
  expect(future[0].parentElement?.getAttribute('aria-labelledby')).toBe('founding-azulejo');
  expect(future[0].parentElement?.tagName).toBe('SECTION');
  expect(container.querySelector('footer a[href="/tile-wall"]')?.textContent?.trim()).toBeTruthy();
  expect(container.textContent).not.toMatch(/undefined|\[object Object\]/);
  const buttons = container.querySelectorAll<HTMLButtonElement>('.tile-wall-controls button');
  fireEvent.click(buttons[0]);
  expect(container.querySelector('.is-refunding')).not.toBeNull();
  expect(container.querySelector('.tile-wall-refund-complete')?.textContent?.trim()).toBeTruthy();
  expect(buttons[0].disabled).toBe(true);
  fireEvent.click(buttons[1]);
  expect(container.querySelector('.is-growing')).not.toBeNull();
  expect(container.querySelector('.tile-wall-refund-complete')).toBeNull();
  expect(container.querySelector<HTMLInputElement>('input[type=range]')?.value).toBe('40');
  expect(container.querySelectorAll('.founding-campaign form,.founding-campaign iframe,.founding-campaign a')).toHaveLength(0);
});
test('dedicated route and link agree', () => {
  expect(routeFromPath('/tile-wall')).toEqual({ name: 'tile-wall' });
  expect(routePath({ name: 'tile-wall' })).toBe('/tile-wall');
});
