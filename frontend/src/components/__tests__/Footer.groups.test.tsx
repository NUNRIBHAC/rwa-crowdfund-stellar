import { act, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Footer from '../Footer';

function viewport(mobile: boolean) {
  let listener: (() => void) | undefined;
  const query = {
    matches: mobile,
    addEventListener: (_: string, fn: () => void) => {
      listener = fn;
    },
    removeEventListener: vi.fn(),
  };
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => query),
  );
  return {
    resize(next: boolean) {
      act(() => {
        query.matches = next;
        listener?.();
      });
    },
  };
}
afterEach(() => vi.unstubAllGlobals());
describe('Footer navigation groups', () => {
  it('starts mobile groups closed and preserves every link in expandable sections', () => {
    viewport(true);
    const { container } = render(<Footer />);
    const groups = [...container.querySelectorAll('details')];
    expect(groups).toHaveLength(4);
    expect(groups.every((g) => !g.open)).toBe(true);
    expect(groups.map((g) => g.querySelectorAll('a').length)).toEqual([3, 7, 5, 5]);
    const legal = groups[1];
    legal.open = true;
    fireEvent(legal, new Event('toggle'));
    expect(legal.open).toBe(true);
    expect(legal.querySelector('summary')?.tabIndex).toBe(0);
  });
  it('keeps desktop groups expanded and out of the keyboard toggle order', () => {
    viewport(false);
    const { container } = render(<Footer />);
    const groups = [...container.querySelectorAll('details')];
    expect(groups.every((g) => g.open)).toBe(true);
    expect(groups.every((g) => g.querySelector('summary')?.tabIndex === -1)).toBe(true);
    fireEvent.click(groups[1].querySelector('summary')!);
    expect(groups[1].open).toBe(true);
  });
});
