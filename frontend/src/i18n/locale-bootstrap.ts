import type { Locale } from './index';
import { browserLocale, countryLocale, validLocale } from './locale-negotiation';

/** One bounded request before mounting. Automatic choices are never stored. */
export async function initialLocale({
  saved,
  tags,
  endpoint,
  request = fetch,
  timeoutMs = 800,
}: {
  saved: () => unknown;
  tags: readonly string[];
  endpoint: string;
  request?: typeof fetch;
  timeoutMs?: number;
}): Promise<Locale> {
  const manual = saved();
  if (validLocale(manual)) return manual;
  const browser = browserLocale(tags);
  if (browser) return browser;
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<undefined>((resolve) => {
    timer = setTimeout(() => {
      controller.abort();
      resolve(undefined);
    }, timeoutMs);
  });
  try {
    const country = await Promise.race([
      request(endpoint, { credentials: 'omit', cache: 'no-store', referrerPolicy: 'no-referrer', signal: controller.signal })
        .then(async (response) => (response.ok ? countryLocale((await response.json()).country) : undefined))
        .catch(() => undefined),
      timeout,
    ]);
    const latest = saved();
    return (validLocale(latest) ? latest : undefined) ?? country ?? 'en';
  } finally {
    clearTimeout(timer);
    controller.abort();
  }
}
