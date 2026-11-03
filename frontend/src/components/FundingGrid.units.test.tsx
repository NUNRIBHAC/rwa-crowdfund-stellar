import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import FundingGrid from './FundingGrid';
import { I18nProvider } from '../i18n';

test('default campaign grid has 100 blocks and states the one-percent unit', () => {
  localStorage.setItem('blockallisto-language', 'en');
  const { container } = render(
    <I18nProvider>
      <FundingGrid raised="566000000" goal="5000000000" />
    </I18nProvider>,
  );
  expect(screen.getByRole('img').getAttribute('aria-label')).toContain('11 of 100');
  expect(screen.getByRole('img').getAttribute('aria-label')).toContain('11.32%');
  expect(screen.getByText('Each block represents 1% of the funding goal.')).toBeTruthy();
  expect(container.querySelectorAll('.fund-grid-tile.is-funded').length).toBe(12);
});
