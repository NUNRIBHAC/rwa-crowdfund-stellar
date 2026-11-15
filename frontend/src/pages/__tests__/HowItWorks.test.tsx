import { test, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import HowItWorks from '../HowItWorks';
import { I18nProvider } from '../../i18n';
afterEach(cleanup);

test('journey tabs use one tab stop, arrow activation and Home/End', () => {
  render(
    <I18nProvider>
      <HowItWorks />
    </I18nProvider>,
  );
  const tabs = screen.getAllByRole('tab');
  expect(tabs.map((tab) => tab.getAttribute('tabindex'))).toEqual(['0', '-1']);
  tabs[0].focus();
  fireEvent.keyDown(tabs[0], { key: 'ArrowRight' });
  expect(document.activeElement).toBe(tabs[1]);
  expect(tabs[1].getAttribute('aria-selected')).toBe('true');
  fireEvent.keyDown(tabs[1], { key: 'Home' });
  expect(document.activeElement).toBe(tabs[0]);
  fireEvent.keyDown(tabs[0], { key: 'End' });
  expect(document.activeElement).toBe(tabs[1]);
});
