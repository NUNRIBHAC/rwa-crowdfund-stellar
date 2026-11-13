import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const html = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'index.html'), 'utf8');
const links = [...html.matchAll(/<link\b[^>]*>/gs)].map((match) => match[0]);

describe('index font links', () => {
  it('has no Google Fonts stylesheet or preconnect links', () => {
    expect(links.filter((link) => /fonts\.(googleapis|gstatic)\.com/i.test(link))).toEqual([]);
  });

  it('keeps the app entry, icons, manifest and social metadata', () => {
    expect(html).toContain('<script type="module" src="/src/main.tsx"></script>');
    expect(html).toContain('rel="manifest" href="/site.webmanifest"');
    expect(links.filter((link) => /rel="(?:icon|apple-touch-icon)"/.test(link))).toHaveLength(4);
    expect(html).toContain('property="og:title"');
    expect(html).toContain('property="og:image"');
  });
});
