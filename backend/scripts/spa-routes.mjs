// Page paths the single-page app renders. The first path segment decides: any
// other first segment is answered with the app shell but HTTP 404, so crawlers,
// link checkers and monitors see a truthful status while people still get the
// localized not-found page. Keep in sync with KNOWN_SEGMENTS in
// frontend/src/router.tsx (a frontend test enforces it).
export const SPA_SEGMENTS = [
  'tile-wall',
  'investments',
  'campaigns',
  'how-it-works',
  'for-investors',
  'learn',
  'glossary',
  'risk-warnings',
  'faq',
  'financing',
  'for-businesses',
  'campaign-builder',
  'about',
  'account',
  'testnet-setup',
  'terms-of-service',
  'privacy-policy',
  'risk-disclosure',
  'legal-notice',
  'conflicts-of-interest',
  'complaints-management',
  'business-continuity',
  'events',
  'blog',
  'press',
  'jobs',
  'podcast',
];

const KNOWN = new Set(SPA_SEGMENTS);

// 200 for a path the app knows, 404 otherwise. Mirrors routeFromPath: only the
// first segment is checked, and a malformed percent escape under /campaigns is
// a bad URL (the app shows not-found for it too). Campaign ids are not checked
// here; an unknown id still gets the app's own not-found view with status 200.
export function spaStatus(pathname) {
  const parts = pathname.replace(/^\//, '').split('/').filter(Boolean);
  if (parts.length === 0) return 200;
  if (!KNOWN.has(parts[0])) return 404;
  if (parts[0] === 'campaigns' && parts[1]) {
    try {
      decodeURIComponent(parts[1]);
    } catch {
      return 404;
    }
  }
  return 200;
}
