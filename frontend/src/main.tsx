import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { I18nProvider, browserPreferences, storedLocale } from './i18n';
import { initialLocale } from './i18n/locale-bootstrap';
import { preferredLocale } from './i18n/locale-negotiation';
import { initTheme } from './theme';
import { installMediaFallback, installFontTimeout } from './media-fallback';
import './styles.css';
import './content-surfaces.css';
import './tour-highlight.css';
import './footer-layout-fix.css';

initTheme();
installMediaFallback();
installFontTimeout();

async function mount() {
  // Set only to the exact verified Worker origin at build time. An unconfigured
  // local/dev build keeps browser/manual negotiation with no external request.
  const origin: string = import.meta.env.VITE_COUNTRY_ORIGIN ?? '';
  const tags = browserPreferences();
  const locale = /^https:\/\/[a-z0-9][a-z0-9.-]*$/.test(origin)
    ? await initialLocale({ saved: storedLocale, tags, endpoint: origin + '/country' })
    : preferredLocale(storedLocale(), tags);
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <I18nProvider initialLocale={locale}>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </I18nProvider>
    </StrictMode>,
  );
}

void mount();
