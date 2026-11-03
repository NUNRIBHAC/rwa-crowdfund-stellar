import { localizedApiError, requestFailedMessage } from './i18n';
export async function api(url: string, body?: unknown) {
  // Network failures and non-JSON bodies (dev server HTML fallback, empty
  // bodies during a redeploy) must never leak raw SyntaxError/TypeError text
  // to the UI: they surface as a stable code the UI localizes.
  let r: Response;
  try {
    r = await fetch(url, body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : undefined);
  } catch {
    throw Object.assign(new Error('API request failed'), { code: 'API_UNAVAILABLE' as const });
  }
  let v;
  try {
    v = await r.json();
  } catch {
    throw Object.assign(new Error('API request failed'), { code: 'API_UNAVAILABLE' as const });
  }
  if (!r.ok) {
    // Stable machine codes let the UI localize known failures without parsing text.
    throw Object.assign(new Error(localizedApiError(v.code) ?? v.error ?? requestFailedMessage(r.status)), { code: v.code as string | undefined });
  }
  return v;
}
