import { useEffect, useState } from 'react';

export type RouteName =
  | 'home'
  | 'investments'
  | 'campaign'
  | 'how-it-works'
  | 'learn'
  | 'glossary'
  | 'risk-warnings'
  | 'faq'
  | 'financing'
  | 'about'
  | 'account'
  | 'terms-of-service'
  | 'privacy-policy'
  | 'risk-disclosure'
  | 'legal-notice'
  | 'conflicts-of-interest'
  | 'complaints-management'
  | 'business-continuity'
  | 'events'
  | 'blog'
  | 'press'
  | 'jobs'
  | 'podcast'
  | 'campaign-builder'
  | 'not-found';

export type Route = { name: RouteName; campaignId?: string };

const KNOWN_SEGMENTS = new Set([
  'investments',
  'campaigns',
  'how-it-works',
  'learn',
  'glossary',
  'risk-warnings',
  'faq',
  'financing',
  'for-businesses',
  'campaign-builder',
  'about',
  'account',
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
]);

// Path routing serves real per-page URLs (needed for the XML sitemap and
// shareable links); the server SPA fallback covers direct loads. Legacy #/
// links are upgraded to their path equivalent, so old shared links keep
// working. Unknown segments route to a truthful not-found state: the URL is
// kept as typed and the app renders a localized not-found view instead of
// silently showing home under the wrong address.
export function routeFromPath(pathname: string): Route {
  const parts = pathname.replace(/^\//, '').split('/').filter(Boolean);
  switch (parts[0]) {
    case 'investments':
      return { name: 'investments' };
    case 'campaigns':
      if (!parts[1]) return { name: 'investments' };
      try {
        return { name: 'campaign', campaignId: decodeURIComponent(parts[1]) };
      } catch {
        // Invalid percent escapes and malformed UTF-8 are bad URLs, not a
        // component failure. Reuse the existing localized not-found view.
        return { name: 'not-found' };
      }
    case 'how-it-works':
      return { name: 'how-it-works' };
    case 'learn':
      return { name: 'learn' };
    case 'glossary':
      return { name: 'glossary' };
    case 'risk-warnings':
      return { name: 'risk-warnings' };
    case 'faq':
      return { name: 'faq' };
    case 'for-businesses':
    case 'financing':
      return { name: 'financing' };
    case 'campaign-builder':
      return { name: 'campaign-builder' };
    case 'about':
      return { name: 'about' };
    case 'account':
      return { name: 'account' };
    case 'terms-of-service':
      return { name: 'terms-of-service' };
    case 'privacy-policy':
      return { name: 'privacy-policy' };
    case 'risk-disclosure':
      return { name: 'risk-disclosure' };
    case 'legal-notice':
      return { name: 'legal-notice' };
    case 'conflicts-of-interest':
      return { name: 'conflicts-of-interest' };
    case 'complaints-management':
      return { name: 'complaints-management' };
    case 'business-continuity':
      return { name: 'business-continuity' };
    case 'events':
      return { name: 'events' };
    case 'blog':
      return { name: 'blog' };
    case 'press':
      return { name: 'press' };
    case 'jobs':
      return { name: 'jobs' };
    case 'podcast':
      return { name: 'podcast' };
    case undefined:
      return { name: 'home' };
    default:
      return { name: 'not-found' };
  }
}

export function routePath(route: Route): string {
  // not-found is never linked to; it only describes the current bad URL.
  if (route.name === 'not-found') return '/';
  if (route.name === 'campaign') return `/campaigns/${encodeURIComponent(route.campaignId ?? '')}`;
  if (route.name === 'home') return '/';
  if (route.name === 'investments') return '/campaigns';
  if (route.name === 'financing') return '/for-businesses';
  return `/${route.name}`;
}

// Backwards compatibility: parse a legacy '#/...' hash into the same route.
export function routeFromHash(hash: string): Route {
  return routeFromPath(hash.replace(/^#/, ''));
}

// Kept name/signature for existing consumers; now emits path URLs so header,
// footer and campaign links are crawlable per-page URLs. The hash form is
// still understood and upgraded on arrival.
export function routeHash(route: Route): string {
  return routePath(route);
}

function isKnownPath(pathname: string): boolean {
  const first = pathname.replace(/^\//, '').split('/').filter(Boolean)[0];
  return first === undefined || KNOWN_SEGMENTS.has(first);
}

// Resolve the current location, upgrading a legacy '#/route' hash in place
// (replaceState: no history entry, no loop).
function currentRoute(): Route {
  if (window.location.hash.startsWith('#/')) {
    const route = routeFromHash(window.location.hash);
    window.history.replaceState(null, '', routePath(route));
    return route;
  }
  const route = routeFromPath(window.location.pathname);
  if (/^\/(investments|financing)\/?$/.test(window.location.pathname)) {
    window.history.replaceState(null, '', routePath(route) + window.location.search + window.location.hash);
  }
  return route;
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(currentRoute);
  useEffect(() => {
    const onPop = () => {
      setRoute(currentRoute());
      window.scrollTo(0, 0);
    };
    window.addEventListener('popstate', onPop);
    // A pasted/edited '#/...' hash mid-session upgrades the same way.
    window.addEventListener('hashchange', onPop);

    // SPA navigation for internal route links only: left-clicks without
    // modifiers on same-origin, known-route anchors. Downloads, target=_blank,
    // external links and non-route hash anchors (e.g. the '#main' skip link)
    // keep their default behavior.
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!anchor || anchor.target || anchor.hasAttribute('download')) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.hash.startsWith('#/')) {
        // Legacy hash link rendered by an older bundle or typed by hand.
        event.preventDefault();
        const target = routeFromHash(url.hash);
        window.history.pushState(null, '', routePath(target));
        setRoute(target);
        window.scrollTo(0, 0);
        return;
      }
      if (url.hash) return; // same-page anchor, not a route
      if (!isKnownPath(url.pathname)) return; // assets, api, unknown paths
      event.preventDefault();
      const target = routeFromPath(url.pathname);
      window.history.pushState(null, '', routePath(target));
      setRoute(target);
      window.scrollTo(0, 0);
    };
    document.addEventListener('click', onClick);
    return () => {
      window.removeEventListener('popstate', onPop);
      window.removeEventListener('hashchange', onPop);
      document.removeEventListener('click', onClick);
    };
  }, []);
  return route;
}
