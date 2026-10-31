import './StatusBadge.css';

/**
 * StatusBadge - small status label for the Blockallisto UI kit.
 *
 * Brand rule (brand/README.md, brand/brand-tokens.css): the support colors
 * success #1DE9B6, warning #FFA726 and danger #FF5252 are used ONLY in small
 * badges, chips and labels, and are ALWAYS paired with Ink #14163A text.
 * White text on these bright tones fails WCAG contrast - do not add a
 * white-text variant.
 */

export type StatusBadgeTone = 'success' | 'warning' | 'danger';

export type StatusBadgeProps = {
  tone: StatusBadgeTone;
  /** Short label, e.g. "Funded", "Funding", "Closed". */
  children: React.ReactNode;
  /** Show the small ink status dot before the label. Default true. */
  dot?: boolean;
};

export default function StatusBadge({ tone, children, dot = true }: StatusBadgeProps) {
  return (
    <span className={`bl-status-badge bl-status-badge-${tone}`}>
      {dot && <span className="bl-status-badge-dot" aria-hidden="true" />}
      {children}
    </span>
  );
}
