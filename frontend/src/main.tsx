import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { I18nProvider } from './i18n';
import { initTheme } from './theme';
import './styles.css';
import './content-surfaces.css';
import './tour-highlight.css';
import './footer-layout-fix.css';

initTheme();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      <App />
    </I18nProvider>
  </StrictMode>,
);
