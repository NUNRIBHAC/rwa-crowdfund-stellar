import illustration from '../../../media-external/about-accumulation.svg?raw';
import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import About from '../About';
import { I18nProvider } from '../../i18n';
test('About uses the supplied accumulating-block animation with a simulation caption', () => {
  localStorage.setItem('blockallisto-language', 'en');
  const { container } = render(
    <I18nProvider>
      <About />
    </I18nProvider>,
  );
  expect(container.querySelector('.about-accumulation')?.getAttribute('src')).toBe(
    'https://blockallisto-media.nunrib-df6.workers.dev/animations/about-accumulation.svg',
  );
  expect(container.querySelector('.funding-block')).toBeNull();
  expect(screen.getByText(/Interactive illustration - no transaction/)).toBeTruthy();
});

test('the shadow uses each animated tile silhouette, never a generic oval', () => {
  const doc = new DOMParser().parseFromString(illustration, 'image/svg+xml');
  const svg = doc.documentElement;
  const shadow = svg.querySelector('g[aria-hidden="true"]')!;
  expect(doc.querySelector('ellipse')).toBeNull();
  expect(shadow.getAttribute('transform')).toBe('translate(0 95)');
  const shadowTiles = [...shadow.querySelectorAll('g.b')];
  const tiles = [...svg.children].filter((e) => e.matches('g.b'));
  expect(tiles).toHaveLength(36);
  expect(shadowTiles).toHaveLength(tiles.length);
  tiles.forEach((tile, index) => {
    expect(shadowTiles[index].getAttribute('style')).toBe(tile.getAttribute('style'));
    const top = [...tile.querySelectorAll('polygon')].at(-1)!;
    const [a, b, c, d] = top
      .getAttribute('points')!
      .split(' ')
      .map((pair) => pair.split(',').map(Number));
    const outline = [a, b, [b[0], b[1] + 22], [c[0], c[1] + 22], [d[0], d[1] + 22], d];
    expect(shadowTiles[index].querySelector('polygon')?.getAttribute('points')).toBe(outline.map((p) => p.join(',')).join(' '));
  });
  expect(illustration).toContain('@media(prefers-reduced-motion:reduce){.b{animation:none!important;opacity:1;transform:none}}');
});
