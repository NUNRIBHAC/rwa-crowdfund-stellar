import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useRoute } from '../router';
function Probe() {
  const route = useRoute();
  return (
    <>
      <a href="/campaigns/%GG">bad campaign</a>
      <div data-testid="route">{route.name}</div>
    </>
  );
}
afterEach(() => {
  cleanup();
  window.history.replaceState(null, '', '/');
  vi.restoreAllMocks();
});
test('initial bad campaign URL renders not-found without an exception', () => {
  window.history.replaceState(null, '', '/campaigns/%E0%A4');
  render(<Probe />);
  expect(screen.getByTestId('route').textContent).toBe('not-found');
});
test('bad campaign navigation by click, history and legacy hash stays within the router', () => {
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  window.history.replaceState(null, '', '/');
  render(<Probe />);
  fireEvent.click(screen.getByText('bad campaign'));
  expect(screen.getByTestId('route').textContent).toBe('not-found');
  window.history.replaceState(null, '', '/campaigns/%');
  fireEvent.popState(window);
  expect(screen.getByTestId('route').textContent).toBe('not-found');
  window.history.replaceState(null, '', '/#/campaigns/%C3%28');
  fireEvent(window, new HashChangeEvent('hashchange'));
  expect(screen.getByTestId('route').textContent).toBe('not-found');
});
