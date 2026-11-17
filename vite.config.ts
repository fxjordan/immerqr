import { copyFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { playwright } from '@vitest/browser-playwright';
import { VitePWA } from 'vite-plugin-pwa';

/** GitHub Pages serves 404.html for unknown paths; a copy of the app lets the client router handle /warum etc. */
function pagesFallback(): Plugin {
  return {
    name: 'pages-404-fallback',
    apply: 'build',
    closeBundle() {
      copyFileSync('dist/index.html', 'dist/404.html');
    },
  };
}

/** Path the site is served under: `/` on its own domain, `/immerqr/` as a GitHub project page. */
const base = process.env.BASE_PATH ?? '/';

export default defineConfig({
  base,
  resolve: {
    alias: Object.fromEntries(
      ['html2canvas', 'canvg', 'dompurify'].map((name) => [
        name,
        fileURLToPath(new URL('./src/core/vendor/unused-optional.ts', import.meta.url)),
      ]),
    ),
  },
  plugins: [
    svelte(),
    pagesFallback(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      manifest: {
        name: 'ImmerQR',
        short_name: 'ImmerQR',
        description: 'QR-Codes, die nie verwelken. Dein Link steckt direkt im Code.',
        lang: 'de',
        // Relative to the manifest, so the app installs correctly under any base path.
        start_url: '.',
        scope: '.',
        display: 'standalone',
        theme_color: '#0F3B2C',
        background_color: '#F4F8F3',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Everything the app needs offline, including the lazily loaded jsPDF and jsQR chunks and fonts.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2,webmanifest}'],
        navigateFallback: `${base}index.html`,
        cleanupOutdatedCaches: true,
        // Control the first page view at once; updates still wait for the user's reload prompt.
        clientsClaim: true,
      },
    }),
  ],
  build: { target: 'es2022' },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'node',
          environment: 'node',
          // Decode suites render and scan hundreds of codes per file.
          testTimeout: 60_000,
          include: ['tests/core/**/*.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'browser',
          include: ['tests/browser/**/*.test.ts'],
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
});
