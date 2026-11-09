// Structural tests for the Arabic RTL layout fix (user 2026-11-07: FAQ page
// rendered fully right-aligned; layout must stay identical to the other 10
// locales while Arabic text keeps reading RTL).
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'styles.css'), 'utf8');
const norm = css.replace(/\s+/g, ' ');

describe('Arabic RTL: text direction flips, block geometry does not', () => {
  it('keeps the text-level direction: rtl flip for Arabic content', () => {
    expect(norm).toMatch(/html\.rtl-text :where\( h1, h2, h3, h4, h5, h6, p,[^{]*\) \{ direction: rtl; \}/);
  });

  it('pins block-text alignment to the LTR geometry at zero specificity', () => {
    const pin = norm.match(/:where\(html\.rtl-text\) :where\(([^)]*)\):not\(\s*:where\(([^)]*)\) \*\s*\) \{ text-align: left; \}/);
    expect(pin, 'zero-specificity text-align pin missing').toBeTruthy();
    for (const el of ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'blockquote', 'input', 'textarea', 'label', 'dd', 'dt']) {
      expect(pin[1], `pin must cover ${el}`).toContain(el);
    }
    // lists deliberately excluded (marker placement follows direction)
    expect(pin[1]).not.toContain('li');
    expect(pin[1]).not.toContain('button');
    // centred-by-design widget block is excluded from the pin
    expect(pin[2]).toContain('.home-contract');
  });

  it('keeps accordion summary cell order LTR while the question text reads RTL', () => {
    expect(norm).toContain('html.rtl-text .accordion summary { direction: ltr; }');
    expect(norm).toContain('html.rtl-text .accordion summary > span:first-child { direction: rtl; }');
  });

  it('keeps the existing metric/grid containers LTR (unchanged behavior)', () => {
    expect(norm).toContain(
      '.metric-chips, .stat-grid, .metric-cards, .info-grid, .intent-facts, .step-cards, .portfolio-row, .account-checklist-item) { direction: ltr; }',
    );
  });
});
