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
  it('keeps the legal risk link and all four link groups without the removed text column', () => {
    viewport(false);
    const { container } = render(<Footer />);
    expect(container.querySelector('.footer-context')).toBeNull();
    expect(container.querySelector('.risk-banner')).toBeNull();
    expect(container.querySelector('a[href="/risk-disclosure"]')).not.toBeNull();
    expect(container.querySelectorAll('.footer-grid > .footer-nav-group')).toHaveLength(4);
    expect(container.querySelectorAll('.footer-social a')).toHaveLength(10);
  });
  it('starts mobile groups closed and preserves every link in expandable sections', () => {
    viewport(true);
    const { container } = render(<Footer />);
    const groups = [...container.querySelectorAll<HTMLElement>('.footer-nav-group')];
    expect(groups).toHaveLength(4);
    expect(groups.every((g) => g.querySelector('button')?.getAttribute('aria-expanded') === 'false')).toBe(true);
    expect(groups.every((g) => g.querySelector('div')?.hidden)).toBe(true);
    expect(groups.map((g) => g.querySelectorAll('a').length)).toEqual([3, 7, 5, 5]);
    const legal = groups[1];
    const toggle = legal.querySelector('button')!;
    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    const panel = container.querySelector<HTMLElement>(`[id='${toggle.getAttribute('aria-controls')}']`)!;
    expect(panel.hidden).toBe(false);
    expect(legal.querySelector('h2 > button')).toBe(toggle);
  });
  it('keeps desktop groups expanded and out of the keyboard toggle order', () => {
    viewport(false);
    const { container } = render(<Footer />);
    const groups = [...container.querySelectorAll<HTMLElement>('.footer-nav-group')];
    expect(groups).toHaveLength(4);
    expect(groups.every((g) => !g.querySelector('div')?.hidden)).toBe(true);
    expect(groups.every((g) => !g.querySelector('button'))).toBe(true);
    expect(groups.every((g) => g.querySelector('h2'))).toBe(true);
  });
});
