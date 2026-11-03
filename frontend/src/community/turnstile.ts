// Cloudflare Turnstile loader for the mail-triggering community flows
// (register / resend / reset-request). The site key is a PUBLIC value served
// by GET /api/auth/abuse-config; when the deployment has no key configured
// (local dev, older backends) every call resolves undefined and the requests
// go out unchanged.
//
// The widget runs in managed mode with appearance 'interaction-only': real
// users typically see nothing, and the challenge UI only appears inside the
// container when Cloudflare decides interaction is needed. Tokens are
// single-use and live for 300s, so a fresh token is produced per submit and
// the widget is reset after every use.
// https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/

import { ApiError } from './api';

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          'error-callback': (code?: string) => void;
          'expired-callback': () => void;
          appearance?: string;
          language?: string;
        },
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

let siteKeyPromise: Promise<string | null> | null = null;
let scriptPromise: Promise<void> | null = null;
let container: HTMLElement | null = null;

export function loadTurnstileSiteKey(): Promise<string | null> {
  if (!siteKeyPromise) {
    siteKeyPromise = fetch('/api/auth/abuse-config')
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => (j && typeof j.turnstileSiteKey === 'string' && j.turnstileSiteKey ? j.turnstileSiteKey : null))
      .catch(() => null);
  }
  return siteKeyPromise;
}

function loadScript(): Promise<void> {
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      // Already loaded (hot reload, duplicate caller, cached page).
      if (window.turnstile) return resolve();
      const s = document.createElement('script');
      s.src = SCRIPT_SRC;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => {
        // Observed on staging: some environments fire error on the element
        // even though the API still arrives (cache/race). Fail only when the
        // API truly never appears; allow a brief grace window first.
        const started = Date.now();
        const poll = setInterval(() => {
          if (window.turnstile) {
            clearInterval(poll);
            resolve();
          } else if (Date.now() - started > 2000) {
            clearInterval(poll);
            // Let the next attempt retry instead of caching a rejection.
            scriptPromise = null;
            reject(new ApiError('turnstile script failed to load', 'turnstile_script_failed'));
          }
        }, 100);
      };
      document.head.appendChild(s);
    });
  }
  return scriptPromise;
}

function widgetContainer(): HTMLElement {
  if (!container) {
    container = document.createElement('div');
    container.className = 'turnstile-widget';
    document.body.appendChild(container);
  }
  return container;
}

// Resolves a fresh single-use token, or undefined when Turnstile is not
// configured on this deployment. Rejects when the user aborts/errors so the
// caller surfaces the failure instead of submitting token-less.
export async function getTurnstileToken(locale?: string): Promise<string | undefined> {
  const sitekey = await loadTurnstileSiteKey();
  if (!sitekey) return undefined;
  await loadScript();
  const api = window.turnstile;
  if (!api) throw new ApiError('turnstile unavailable', 'turnstile_unavailable');
  return new Promise<string>((resolve, reject) => {
    const id = api.render(widgetContainer(), {
      sitekey,
      appearance: 'interaction-only',
      ...(locale ? { language: locale } : {}),
      callback: (token: string) => {
        api.remove(id);
        resolve(token);
      },
      'error-callback': (code?: string) => {
        api.remove(id);
        reject(new ApiError(`turnstile error${code ? `: ${code}` : ''}`, 'turnstile_failed'));
      },
      'expired-callback': () => {
        api.reset(id);
      },
    });
  });
}
