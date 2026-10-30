import { useEffect, useState } from 'react';

export type RouteName = 'home' | 'investments' | 'campaign' | 'how-it-works' | 'learn' | 'glossary' | 'risk-warnings' | 'faq' | 'financing' | 'about';

export type Route = { name: RouteName; campaignId?: string };

// Hash routing keeps the single static deploy working without server rewrites.
export function routeFromHash(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  switch (parts[0]) {
    case 'investments':
      return { name: 'investments' };
    case 'campaigns':
      return parts[1] ? { name: 'campaign', campaignId: decodeURIComponent(parts[1]) } : { name: 'investments' };
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
    case 'financing':
      return { name: 'financing' };
    case 'about':
      return { name: 'about' };
    default:
      return { name: 'home' };
  }
}

export function routeHash(route: Route): string {
  if (route.name === 'campaign') return `#/campaigns/${encodeURIComponent(route.campaignId ?? '')}`;
  if (route.name === 'home') return '#/';
  return `#/${route.name}`;
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => routeFromHash(window.location.hash));
  useEffect(() => {
    const onChange = () => {
      setRoute(routeFromHash(window.location.hash));
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}
