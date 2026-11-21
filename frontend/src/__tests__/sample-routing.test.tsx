import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useRoute } from '../router';
function Routes() {
  const route = useRoute();
  return (
    <>
      <h1>{route.name}</h1>
      <a href="/campaigns/fixture-meadow-partnership?fixtures=1">Sample</a>
    </>
  );
}
afterEach(() => {
  cleanup();
  window.history.replaceState(null, '', '/');
  vi.restoreAllMocks();
});
test('SPA card navigation keeps fixtures=1 in the URL so a reload stays a sample', () => {
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  window.history.replaceState(null, '', '/campaigns?fixtures=1');
  render(<Routes />);
  fireEvent.click(screen.getByRole('link', { name: 'Sample' }));
  expect(window.location.pathname).toBe('/campaigns/fixture-meadow-partnership');
  expect(window.location.search).toBe('?fixtures=1');
  expect(screen.getByRole('heading').textContent).toBe('campaign');
});
