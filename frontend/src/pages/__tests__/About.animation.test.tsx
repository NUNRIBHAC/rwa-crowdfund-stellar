import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import About from '../About';
import { I18nProvider } from '../../i18n';
test('About uses the supplied question-mark animation with a simulation caption', () => {
  localStorage.setItem('blockallisto-language', 'en');
  const { container } = render(
    <I18nProvider>
      <About />
    </I18nProvider>,
  );
  expect(container.querySelector('.about-question')?.getAttribute('src')).toBe('/about-question.svg');
  expect(container.querySelector('.funding-block')).toBeNull();
  expect(screen.getByText(/Interactive illustration - no transaction/)).toBeTruthy();
});
