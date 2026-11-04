// Every canonical application route. Account is signed out; protected/operator
// states require a separate explicit synthetic state suite, not invented URLs.
export const PUBLIC_PAGES = [
  '/',
  '/about',
  '/account',
  '/blog',
  '/business-continuity',
  '/campaign-builder',
  '/campaigns/demo-solar',
  '/complaints-management',
  '/conflicts-of-interest',
  '/events',
  '/faq',
  '/for-businesses',
  '/glossary',
  '/how-it-works',
  '/campaigns',
  '/jobs',
  '/learn',
  '/legal-notice',
  '/podcast',
  '/press',
  '/privacy-policy',
  '/risk-disclosure',
  '/risk-warnings',
  '/terms-of-service',
  // Unknown-path capture: routes to the not-found view, keeping the bad URL.
  '/404',
].map((path) => ({ path, name: path === '/' ? 'home' : path.slice(1).replaceAll('/', '-') }));
export const VISUAL_LOCALES = ['en', 'pt', 'es', 'fr', 'de', 'zh-TW', 'zh-CN', 'ja', 'ko', 'ar', 'hi'];
export const VISUAL_WIDTHS = [390, 820, 1440];
