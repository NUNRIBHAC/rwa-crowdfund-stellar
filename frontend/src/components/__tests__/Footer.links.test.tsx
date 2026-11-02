import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Footer from '../Footer';

// The footer links only verified, real profile URLs; unresolved platforms
// stay decorative images (no placeholder hrefs).
describe('Footer social links', () => {
  it('links the verified profiles including the user-created Discord server', () => {
    render(<Footer />);
    const expected: Record<string, string> = {
      'Blockallisto on X': 'https://x.com/blockallisto',
      'Blockallisto on Instagram': 'https://www.instagram.com/blockallisto/',
      'Blockallisto on Threads': 'https://www.threads.com/@blockallisto',
      'Blockallisto on YouTube': 'https://www.youtube.com/@blockallisto',
      'Blockallisto on Discord': 'https://discord.gg/BdXATtWNXJ',
      'Email Blockallisto': 'mailto:blockallisto@gmail.com',
    };
    for (const [label, href] of Object.entries(expected)) {
      const a = screen.getByRole('link', { name: label });
      expect(a.getAttribute('href')).toBe(href);
    }
    // Unresolved platforms must not be links.
    const social = document.querySelector('.footer-social')!;
    const imgs = [...social.querySelectorAll(':scope > img')].map((i) => i.getAttribute('src'));
    expect(imgs).toEqual(['/social/facebook.svg', '/social/telegram.svg', '/social/farcaster.svg', '/social/linkedin.png']);
  });
});
