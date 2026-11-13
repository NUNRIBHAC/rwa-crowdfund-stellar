export const LEGACY_MEDIA_ORIGIN = 'https://blockallisto-media.nunrib-df6.workers.dev';
export function mediaOrigin(value = LEGACY_MEDIA_ORIGIN) {
  if (!/^https:\/\/[a-z0-9][a-z0-9.-]*$/.test(value)) throw new Error('VITE_PUBLIC_MEDIA_ORIGIN must be an HTTPS origin without a path');
  return value;
}

// One build-time origin for TS/JS, CSS and HTML. Existing object paths stay
// unchanged; the static export supplies the Worker's legacy aliases.
export function publicMediaPlugin(origin) {
  const replace = (text) => text.replaceAll(LEGACY_MEDIA_ORIGIN, origin);
  return {
    name: 'public-media-origin',
    enforce: 'pre',
    transform(code, id) {
      if (!id.includes('/frontend/src/') || id.includes('.test.')) return null;
      if (!/\.(tsx?|jsx?|css)(\?|$)/.test(id)) return null;
      let result = replace(code);
      if (id.endsWith('.css')) {
        result = result.replace(/url\(['"]?(https:\/\/[^)'"\s]+)['"]?\)(\s+format\([^)]+\))/g, (all, url, format) => {
          if (!url.startsWith(origin + '/fonts/')) return all;
          return `${all}, url('/media/${url.slice(origin.length + 1)}')${format}`;
        });
      }
      return { code: result, map: null };
    },
    transformIndexHtml: { order: 'pre', handler: replace },
    generateBundle(_options, bundle) {
      const reserveFonts = [];
      for (const item of Object.values(bundle)) {
        if (item.type === 'asset' && typeof item.source === 'string') {
          item.source = replace(item.source);
          if (item.fileName.endsWith('.css'))
            for (const face of item.source.matchAll(/@font-face\{[^}]+\}/g)) reserveFonts.push(face[0].replaceAll(origin + '/', '/media/'));
        }
      }
      this.emitFile({ type: 'asset', fileName: 'media-reserve-fonts.css', source: reserveFonts.join('\n') });
    },
  };
}
