import { test, expect, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import CampaignTour from '../CampaignTour';
import { I18nProvider } from '../../i18n';
afterEach(cleanup);

test('tour makes background branches inert and restores their previous state before returning focus', () => {
  Element.prototype.scrollIntoView = vi.fn();
  const outside = document.createElement('button');
  outside.textContent = 'Outside';
  document.body.append(outside);
  const preserved = document.createElement('div');
  preserved.inert = true;
  document.body.append(preserved);
  const { unmount, container } = render(
    <I18nProvider>
      <div className="fund-grid-wrap">Funding</div>
      <CampaignTour />
    </I18nProvider>,
  );
  const trigger = screen.getByRole('button', { name: /Repeat tour/ });
  trigger.focus();
  fireEvent.click(trigger);
  expect(outside.inert).toBe(true);
  expect(container.querySelector<HTMLElement>('.fund-grid-wrap')?.inert).toBe(true);
  expect(screen.getByRole('dialog').closest<HTMLElement>('.tour-overlay')?.inert).not.toBe(true);
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(outside.inert).not.toBe(true);
  expect(preserved.inert).toBe(true);
  expect(document.activeElement).toBe(trigger);
  fireEvent.click(trigger);
  unmount();
  expect(outside.inert).not.toBe(true);
  expect(preserved.inert).toBe(true);
  outside.remove();
  preserved.remove();
});
