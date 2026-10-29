---
name: eu-web-accessibility-compliance-wcag-eaa
description: Ensure crowdfunding platforms meet European Accessibility Act standards for tokenized assets.
---

When to use
Use this skill when designing, auditing, or remediating the user interface of an EU-based crowdfunding platform, specifically focusing on compliance with the European Accessibility Act (EAA) and WCAG 2.1/2.2 Level AA standards.

## Instructions
1.  **Audit Navigation Structure**: Ensure all tokenization flows (KYC, wallet connection, investment) are fully navigable via keyboard only. Check for a logical tab order and visible focus indicators.
2.  **Verify Semantic HTML**: Use correct ARIA labels for complex Stellar blockchain interactions (e.g., "Sign Transaction" buttons, progress bars for asset minting).
3.  **Validate Contrast & Scaling**: Confirm all text-to-background contrast ratios are at least 4.5:1. Ensure the platform remains functional when zoomed to 200%.
4.  **Error Handling**: For financial forms, provide clear, text-based error messages and suggestions. Do not rely on color alone (e.g., red outlines) to indicate a failed transaction.
5.  **Alternative Text**: Provide descriptive alt-text for all financial charts, token icons, and regulatory badges.
6.  **EAA Documentation**: Prepare a "Declaration of Conformity" outline that specifies how the digital service meets the requirements of Directive (EU) 2019/882.

## Examples
**User:** "We have a slider for users to select how many tokens to buy. How do we make it accessible?"
**Agent:** 
1. Implement a standard `<input type="range">` with an associated `<label>`.
2. Ensure the current value updates an `aria-live="polite"` region so screen readers announce changes.
3. Provide manual increment/decrement buttons as keyboard-friendly alternatives to dragging.
4. Ensure the slider handle has a high-contrast focus ring.

## Constraints
- Do NOT ignore mobile accessibility; EAA compliance requires responsive accessibility.
- Do NOT use "Click Here" for links; use descriptive text like "View Stellar Asset Terms."
- Do NOT rely on automatic overlays (accessibility widgets) as a substitute for native compliance.
- Do NOT skip testing with screen readers (NVDA/VoiceOver) for the wallet signing process.
