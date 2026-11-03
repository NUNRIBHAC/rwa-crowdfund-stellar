import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Footer from '../Footer';

// The footer links only verified, real profile URLs; until 2026-11-03 the
// Facebook glyph stayed decorative because no Page existed.
describe('Footer social links', () => {
  it('links the verified profiles including the user-created Discord server', () => {
    render(<Footer />);
    const expected: Record<string, string> = {
      'Blockallisto on X': 'https://x.com/blockallisto',
      'Blockallisto on Instagram': 'https://www.instagram.com/blockallisto/',
      'Blockallisto on Threads': 'https://www.threads.com/@blockallisto',
      'Blockallisto on Facebook': 'https://www.facebook.com/profile.php?id=61595902542764',
      'Blockallisto on YouTube': 'https://www.youtube.com/@blockallisto',
      'Blockallisto on Discord': 'https://discord.gg/BdXATtWNXJ',
      'Blockallisto on Telegram': 'https://t.me/blockallisto',
      'Blockallisto on Farcaster': 'https://farcaster.xyz/blockallisto',
      'Blockallisto on LinkedIn': 'https://www.linkedin.com/company/blockallisto/',
      'Email Blockallisto': 'mailto:blockallisto@gmail.com',
    };
    for (const [label, href] of Object.entries(expected)) {
      const a = screen.getByRole('link', { name: label });
      expect(a.getAttribute('href')).toBe(href);
    }
    // Every platform glyph is now a link; no decorative bare images remain.
    const social = document.querySelector('.footer-social')!;
    const imgs = [...social.querySelectorAll(':scope > img')].map((i) => i.getAttribute('src'));
    expect(imgs).toEqual([]);
  });
});
