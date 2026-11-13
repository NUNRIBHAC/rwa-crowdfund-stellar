import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { loadEnv } from 'vite';
import { mediaOrigin, publicMediaPlugin } from './scripts/public-media-build.mjs';

export default defineConfig(({ mode }) => ({
  plugins: [publicMediaPlugin(mediaOrigin(loadEnv(mode, process.cwd(), '').VITE_PUBLIC_MEDIA_ORIGIN)), react()],
  server: {
    port: 5173,
    allowedHosts: ['localhost', '127.0.0.1'],
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
}));
