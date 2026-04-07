import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import pkg from './package.json'

// For GitHub Pages: set base to '/<repo-name>/' e.g. '/mixtastic/'
// For custom domain or local dev, use '/'
const appVersion = pkg.version

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
  },
  plugins: [
    react(),
    VitePWA({
      filename: 'sw.js',
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Mixtastic - DJ Mix Planner',
        short_name: 'Mixtastic',
        description: 'Plan DJ mix transitions with cue points, EQ levels, and notes',
        theme_color: '#0f1117',
        background_color: '#0f1117',
        display: 'standalone',
        orientation: 'any',
        start_url: '/mixtastic/',
        scope: '/mixtastic/',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        cacheId: `mixtastic-v${appVersion}`,
        globPatterns: ['**/*.{js,css,html,svg,png,woff,woff2}'],
        // Navigation requests: try network first so updates land fast,
        // fall back to cache when offline
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/mixtastic\/assets\//],
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'html-cache',
              expiration: { maxEntries: 1, maxAgeSeconds: 86400 },
            },
          },
        ],
        // Force new SW to activate immediately
        skipWaiting: true,
        clientsClaim: true,
      },
    }),
  ],
  base: '/mixtastic/',
})
