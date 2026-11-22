/// <reference types="node" />
// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
const css = readFileSync('src/fonts-l10n.css', 'utf8');
const main = readFileSync('src/main.tsx', 'utf8');
const styles = readFileSync('src/styles.css', 'utf8');

const families = {
  ja: 'Noto Sans JP',
  ko: 'Noto Sans KR',
  'zh-CN': 'Noto Sans SC',
  'zh-TW': 'Noto Sans TC',
  ar: 'Noto Sans Arabic',
  hi: 'Noto Sans Devanagari',
};

describe('self-hosted non-Latin font contract', () => {
  it('loads one locale module and keeps body typography variable', () => {
    expect(main.match(/import '.\/fonts-l10n.css';/g)).toHaveLength(1);
    expect(styles).toContain('font-family: var(--font-body)');
  });
  it.each(Object.entries(families))('maps %s to its regional family with an explicit QA off switch', (lang, family) => {
    const rule = css.match(new RegExp(`html:not\\(\\[data-fonts-l10n='off'\\]\\)\\[lang='${lang}'\\] \\{([^}]+)\\}`))?.[1];
    expect(rule).toContain(`--font-body: 'Inter', '${family}'`);
    expect(rule).toContain('--font-display:');
    expect(rule).toContain('--font-figures:');
    expect(rule).toContain('system-ui');
  });
  it('keeps all font faces self-hosted, swap-based, normal style and unicode-sliced', () => {
    const faces = [...css.matchAll(/@font-face\s*\{([^}]+)\}/g)].map((m) => m[1]);
    expect(faces).toHaveLength(485);
    for (const face of faces) {
      expect(face).toContain('font-display: swap;');
      expect(face).toContain('font-style: normal;');
      expect(face).toContain('unicode-range:');
      expect(face).toMatch(/https:\/\/blockallisto-(?:media\.nunrib-df6\.workers\.dev|public-media\.pages\.dev)\/fonts\//);
      expect(face).not.toMatch(/googleapis|gstatic|@import/);
    }
  });
  it('does not add font overrides to the five Latin locales', () => {
    for (const lang of ['en', 'pt', 'es', 'fr', 'de']) expect(css).not.toContain(`[lang='${lang}']`);
  });
});
