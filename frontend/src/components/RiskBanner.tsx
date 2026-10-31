import { useI18n } from '../i18n';
import { setTheme, useTheme } from '../theme';

// Persistent risk banner shown on every page, adapted to what this app
// actually is: a testnet prototype with no live offers. The theme toggle lives
// at the banner's inline end (user target, 2026-10-31).
export default function RiskBanner() {
  const { m } = useI18n();
  const theme = useTheme();
  return (
    <div className="risk-banner" role="note">
      {m.riskBanner}
      <button
        type="button"
        className="theme-toggle risk-theme-toggle"
        onClick={() => setTheme(theme === 'light' ? 'navy' : 'light')}
        aria-label={theme === 'light' ? m.header.themeToDark : m.header.themeToLight}
        title={theme === 'light' ? m.header.themeToDark : m.header.themeToLight}
      >
        {theme === 'light' ? (
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path d="M20.6 14.5A8.5 8.5 0 0 1 9.5 3.4a8.5 8.5 0 1 0 11.1 11.1Z" fill="currentColor" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <circle cx="12" cy="12" r="4.4" fill="currentColor" />
            <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4M5 5l1.7 1.7M17.3 17.3 19 19M19 5l-1.7 1.7M6.7 17.3 5 19" />
            </g>
          </svg>
        )}
      </button>
    </div>
  );
}
