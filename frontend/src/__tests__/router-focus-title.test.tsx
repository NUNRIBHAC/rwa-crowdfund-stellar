import { StrictMode } from 'react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useRoute } from '../router';
function Probe() {
  const route = useRoute();
  return (
    <>
      <a href="/learn">Learn link</a>
      <main id="main">
        <h1>{route.name === 'learn' ? 'Aprender' : 'Início'}</h1>
        <input aria-label="Search" />
      </main>
    </>
  );
}
beforeEach(() => {
  window.history.replaceState(null, '', '/');
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  window.history.replaceState(null, '', '/');
});
test('initial load sets a localized title without stealing focus', async () => {
  render(
    <StrictMode>
      <Probe />
    </StrictMode>,
  );
  await waitFor(() => expect(document.title).toBe('Início | Blockallisto'));
  expect(document.activeElement).not.toBe(screen.getByRole('heading'));
});
test('click and history navigation focus the new main heading and update the title', async () => {
  render(<Probe />);
  const link = screen.getByRole('link');
  link.focus();
  fireEvent.click(link);
  await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'Aprender' })));
  expect(document.title).toBe('Aprender | Blockallisto');
  expect(screen.getByRole('heading').getAttribute('tabindex')).toBe('-1');
  const search = screen.getByRole('textbox');
  search.focus();
  fireEvent.change(search, { target: { value: 'a' } });
  expect(document.activeElement).toBe(search);
  window.history.replaceState(null, '', '/');
  fireEvent.popState(window);
  await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'Início' })));
  expect(document.title).toBe('Início | Blockallisto');
});
test('a changed localized heading refreshes the title without taking input focus', async () => {
  render(<Probe />);
  await waitFor(() => expect(document.title).toBe('Início | Blockallisto'));
  const search = screen.getByRole('textbox');
  search.focus();
  screen.getByRole('heading').textContent = 'Home';
  await waitFor(() => expect(document.title).toBe('Home | Blockallisto'));
  expect(document.activeElement).toBe(search);
});
