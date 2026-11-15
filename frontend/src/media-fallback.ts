// Images are retried once against the bounded same-origin media gateway. Capture phase runs before component handlers; no retries or loops
// after the gateway fails. A new source on the same element gets a fresh try.
export const MEDIA_ORIGIN = import.meta.env.VITE_PUBLIC_MEDIA_ORIGIN || 'https://blockallisto-public-media.pages.dev';
export const MEDIA_TIMEOUT_MS = 8000;

export function gatewayMediaUrl(value: string, origin = MEDIA_ORIGIN): string | null {
  let url: URL;
  try {
    url = new URL(value, window.location.href);
  } catch {
    return null;
  }
  if (url.origin !== origin || !/^\/[A-Za-z0-9._/-]+$/.test(url.pathname) || url.pathname.includes('..') || url.pathname.includes('//')) return null;
  return '/media' + url.pathname + '?retry=1';
}

export function installMediaFallback(root: Document = document, timeoutMs = MEDIA_TIMEOUT_MS): () => void {
  const pending = new Map<HTMLImageElement, { source: string; timer: ReturnType<typeof setTimeout> }>();
  const tried = new WeakMap<HTMLImageElement, string>();
  function clear(img: HTMLImageElement) {
    const item = pending.get(img);
    if (item) clearTimeout(item.timer);
    pending.delete(img);
  }
  function fallback(img: HTMLImageElement) {
    const source = img.getAttribute('src') || '';
    const gateway = gatewayMediaUrl(source);
    clear(img);
    if (!gateway || tried.get(img) === source) return;
    tried.set(img, source);
    img.removeAttribute('srcset');
    img
      .closest('picture')
      ?.querySelectorAll('source')
      .forEach((source) => source.removeAttribute('srcset'));
    img.src = gateway;
  }
  function watch(img: HTMLImageElement) {
    const source = img.getAttribute('src') || '';
    if (!gatewayMediaUrl(source)) {
      clear(img);
      return;
    }
    if (pending.get(img)?.source === source || (img.complete && img.naturalWidth > 0)) return;
    clear(img);
    // Lazy images below the fold have not started a network request yet.
    if (img.loading === 'lazy' && typeof IntersectionObserver !== 'undefined') {
      intersection?.observe(img);
      return;
    }
    pending.set(img, { source, timer: setTimeout(() => fallback(img), timeoutMs) });
  }
  const intersection =
    typeof IntersectionObserver === 'undefined'
      ? null
      : new IntersectionObserver((entries) => {
          for (const entry of entries)
            if (entry.isIntersecting) {
              const img = entry.target as HTMLImageElement;
              intersection?.unobserve(img);
              const source = img.getAttribute('src') || '';
              if (gatewayMediaUrl(source) && !pending.has(img)) pending.set(img, { source, timer: setTimeout(() => fallback(img), timeoutMs) });
            }
        });
  function error(event: Event) {
    if (!(event.target instanceof HTMLImageElement) || !gatewayMediaUrl(event.target.getAttribute('src') || '')) return;
    // Do not let an older component swap to another asset on the same failed
    // host, defeating the gateway retry.
    event.stopImmediatePropagation();
    fallback(event.target);
  }
  function loaded(event: Event) {
    if (event.target instanceof HTMLImageElement) clear(event.target);
  }
  const observer = new MutationObserver((records) => {
    for (const record of records) {
      if (record.type === 'attributes' && record.target instanceof HTMLImageElement) watch(record.target);
      for (const node of record.addedNodes)
        if (node instanceof Element) {
          if (node instanceof HTMLImageElement) watch(node);
          node.querySelectorAll('img').forEach(watch);
        }
    }
  });
  root.addEventListener('error', error, true);
  root.addEventListener('load', loaded, true);
  observer.observe(root.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['src'] });
  root.querySelectorAll('img').forEach(watch);
  return () => {
    observer.disconnect();
    intersection?.disconnect();
    root.removeEventListener('error', error, true);
    root.removeEventListener('load', loaded, true);
    for (const img of pending.keys()) clear(img);
  };
}

// Native CSS src tries the gateway second URL on a failed font request. A
// stalled request needs a separate bounded clock; the generated local sheet
// has the same faces/descriptors and only same-origin gateway sources.
export function installFontTimeout(root: Document = document, timeoutMs = MEDIA_TIMEOUT_MS): () => void {
  const fonts = root.fonts;
  if (!fonts) return () => {};
  let timer: ReturnType<typeof setTimeout> | undefined;
  let activated = false;
  const clear = () => {
    if (timer) clearTimeout(timer);
    timer = undefined;
  };
  const loading = () => {
    if (activated || timer) return;
    timer = setTimeout(() => {
      timer = undefined;
      if (fonts.status !== 'loading') return;
      activated = true;
      // Replace active face definitions so layout uses the gateway source.
      // The browser may retain old pending requests in its font bookkeeping.
      for (const sheet of root.styleSheets) {
        try {
          for (let index = sheet.cssRules.length - 1; index >= 0; index--) {
            const rule = sheet.cssRules[index];
            if (!(rule instanceof CSSFontFaceRule)) continue;
            if (!rule.style.getPropertyValue('src').includes(MEDIA_ORIGIN + '/')) continue;
            const replacement = rule.cssText.replace(/url\(['"]?(https:\/\/[^)'"\s]+)['"]?\)/g, (all, value) => {
              const gateway = gatewayMediaUrl(value);
              return gateway ? `url('${gateway}')` : all;
            });
            sheet.deleteRule(index);
            sheet.insertRule(replacement, index);
          }
        } catch {
          /* cross-origin sheets are not readable; generated sheet below covers our app faces */
        }
      }
      const link = root.createElement('link');
      link.rel = 'stylesheet';
      link.href = '/media-gateway-fonts.css';
      root.head.append(link);
    }, timeoutMs);
  };
  fonts.addEventListener('loading', loading);
  fonts.addEventListener('loadingdone', clear);
  if (fonts.status === 'loading') loading();
  return () => {
    clear();
    fonts.removeEventListener('loading', loading);
    fonts.removeEventListener('loadingdone', clear);
  };
}
