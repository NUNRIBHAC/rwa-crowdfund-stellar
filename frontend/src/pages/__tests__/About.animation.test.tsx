import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import About from '../About';
import { I18nProvider } from '../../i18n';
test('About reuses the original animated funding mark with a simulation caption', () => {
  localStorage.setItem('blockallisto-language', 'en');
  const { container } = render(
    <I18nProvider>
      <About />
    </I18nProvider>,
  );
  expect(screen.getByRole('img', { name: /small purple blocks slide/ })).toBeTruthy();
  expect(container.querySelectorAll('.funding-tile')).toHaveLength(8);
  expect(container.querySelector('.funding-token')).toBeTruthy();
  expect(screen.getByText(/Interactive illustration - no transaction/)).toBeTruthy();
});
