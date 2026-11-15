import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
describe('logo space is known before download', () => {
  for (const file of ['Header', 'Footer'])
    it(`${file} reserves the shipped SVG intrinsic ratio without changing its CSS size`, () => {
      const source = readFileSync(join(root, 'src/components', file + '.tsx'), 'utf8');
      expect(source).toMatch(/className="(?:brand-lockup|footer-brand-lockup-img)" width=\{518\} height=\{146\}/);
      for (const theme of ['', '-reversed']) {
        const svg = readFileSync(join(root, 'media-external', `blockallisto-lockup-horizontal${theme}.svg`), 'utf8');
        expect(svg).toContain('width="518" height="146"');
      }
    });
});
