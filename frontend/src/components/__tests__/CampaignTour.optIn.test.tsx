import { test, expect, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import CampaignTour from '../CampaignTour';
import { I18nProvider } from '../../i18n';
afterEach(() => {
  cleanup();
  localStorage.clear();
  Element.prototype.scrollIntoView = vi.fn();
});
test('tour never opens without visitor request, even on first visit', () => {
  localStorage.clear();
  Element.prototype.scrollIntoView = vi.fn();
  render(
    <I18nProvider>
      <div className="fund-grid-wrap">Funding</div>
      <CampaignTour />
    </I18nProvider>,
  );
  expect(screen.queryByRole('dialog')).toBeNull();
  fireEvent.click(screen.getByRole('button'));
  expect(screen.getByRole('dialog')).toBeTruthy();
});
