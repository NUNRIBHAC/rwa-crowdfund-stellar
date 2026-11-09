// Structural tests for the brand typography fix (todo-01M689505HT61FKKQHSJ7CF6X1).
// Live CSP (style-src 'self' 'unsafe-inline') blocks the index.html Google Fonts
// stylesheet, so brand fonts must come from same-origin @font-face on the media
// worker, exactly like the existing 'Blockallisto Nav' faces in styles.css.
// Every URL referenced here already exists on the worker (font manifest
// 2026-11-07, GET-verified) - this patch adds NO new uploads.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(join(here, '..', 'src', 'styles.css'), 'utf8');
const W = 'https://blockallisto-media.nunrib-df6.workers.dev/fonts/';

const fontUrls = [...css.matchAll(/url\('https:\/\/blockallisto-media[^']+\/fonts\/([^']+)'\)/g)].map((m) => m[1]);

describe('brand font loading (CSP-safe)', () => {
  it('references only the 9 pre-existing worker font objects (no new uploads)', () => {
    expect(new Set(fontUrls)).toEqual(
      new Set([
        'inter-400.woff2',
        'inter-500.woff2',
        'inter-600.woff2',
        'inter-700-latin.woff2',
        'inter-700-latin-ext.woff2',
        'montserrat-var-latin.woff2',
        'montserrat-var-latin-ext.woff2',
        'plusjakartasans-var-latin.woff2',
        'plusjakartasans-var-latin-ext.woff2',
      ]),
    );
  });

  it('declares Inter 400-700, variable Montserrat and variable Plus Jakarta Sans faces', () => {
    const norm = css.replace(/\s+/g, ' ');
    for (const need of [
      "font-family: 'Inter'; font-style: normal; font-weight: 400;",
      "font-family: 'Inter'; font-style: normal; font-weight: 500;",
      "font-family: 'Inter'; font-style: normal; font-weight: 600;",
      "font-family: 'Inter'; font-style: normal; font-weight: 700;",
      "font-family: 'Montserrat'; font-style: normal; font-weight: 100 900;",
      "font-family: 'Plus Jakarta Sans'; font-style: normal; font-weight: 200 800;",
    ]) {
      expect(norm, `missing face: ${need}`).toContain(need);
    }
  });

  it('splits latin / latin-ext subsets with unicode-range where the worker files are split', () => {
    for (const f of ['inter-700', 'montserrat-var', 'plusjakartasans-var']) {
      const latin = css.indexOf(`${W}${f}-latin.woff2`);
      const latinExt = css.indexOf(`${W}${f}-latin-ext.woff2`);
      expect(latin, f).toBeGreaterThan(-1);
      expect(latinExt, f).toBeGreaterThan(-1);
      expect(css.slice(latin, latin + 400)).toContain('unicode-range:');
      expect(css.slice(latinExt, latinExt + 400)).toContain('unicode-range:');
    }
  });

  it('keeps the original heading-family rule mapping h1-h4/.section-title to --font-display', () => {
    expect(css.replace(/\s+/g, ' ')).toMatch(/h1, h2, h3, h4, \.section-title \{\s*font-family: var\(--font-display\);/);
  });

  it('keeps figures on Plus Jakarta Sans via --font-figures (weight 700 usage unchanged)', () => {
    expect(css).toMatch(/--font-figures: ['"]Plus Jakarta Sans['"]/);
  });
});
