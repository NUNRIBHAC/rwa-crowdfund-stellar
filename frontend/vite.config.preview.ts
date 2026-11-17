// Untracked machine-setup override: do NOT commit.
// Mirrors vite.config.ts (same plugins/proxy) but widens host/allowedHosts
// so the Vorflux public preview proxy can reach the dev server. Only used
// via `vite --config vite.config.preview.ts`; the committed vite.config.ts
// is never modified.
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { mediaOrigin, publicMediaPlugin } from './scripts/public-media-build.mjs';

export default defineConfig(({ mode }) => ({
  plugins: [publicMediaPlugin(mediaOrigin(loadEnv(mode, process.cwd(), '').VITE_PUBLIC_MEDIA_ORIGIN)), react()],
  server: {
    port: 5173,
    host: '0.0.0.0',
    allowedHosts: true,
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
}));
