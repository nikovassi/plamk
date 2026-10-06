/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { githubPagesPreview, placeholderDev, prerender } from './scripts/prerender.ts'

// GitHub Pages serves the site under /<repo>/. Override with VITE_BASE=/ for a custom domain.
export default defineConfig(({ mode, isSsrBuild }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const base = env.VITE_BASE || '/plamk/'
  const siteUrl = env.VITE_SITE_URL || 'https://nikovassi.github.io/plamk'
  return {
    base,
    plugins: [
      react(),
      tailwindcss(),
      placeholderDev(),
      githubPagesPreview(),
      !isSsrBuild && prerender({ ssrEntry: `${env.SSR_OUT_DIR || 'dist-ssr'}/entry-server.js`, siteUrl }),
      !isSsrBuild && VitePWA({
        registerType: 'autoUpdate',
        injectRegister: false,
        includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'offline.html'],
        manifest: {
          name: 'ПЛАМК — фасади, хартиени продукти и фолиа',
          short_name: 'ПЛАМК',
          description: 'Проектиране, доставка и монтаж на фасадни облицовки и вентилируеми фасади.',
          lang: 'bg',
          start_url: base,
          scope: base,
          display: 'standalone',
          orientation: 'portrait',
          background_color: '#111214',
          theme_color: '#111214',
          icons: [
            { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
            { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
          shortcuts: [
            { name: 'Поискай оферта', url: `${base}zapitvane`, icons: [{ src: 'icons/icon-192.png', sizes: '192x192' }] },
            { name: 'Проекти', url: `${base}proekti`, icons: [{ src: 'icons/icon-192.png', sizes: '192x192' }] },
          ],
        },
        workbox: {
          // App shell + static content only. Lead submissions are never cached.
          globPatterns: ['**/*.{js,css,html,svg,png,webp,avif,woff2,webmanifest}'],
          // Nested index.html files duplicate the flat route.html files; placeholders are runtime-cached.
          globIgnores: ['admin.html', '**/admin/**', '**/assets/Admin*', '**/*greek*', '**/*vietnamese*', '**/*italic*', '**/*/index.html', 'placeholders/**', 'images/**', 'og-image.png', 'proekti/**', 'uslugi/**', 'materiali/**', '404.html'],
          // Every route is prerendered + precached; unknown pages go to the network,
          // and only when offline the static offline page is shown.
          navigateFallback: null,
          cleanupOutdatedCaches: true,
          // A new deploy takes over immediately; registerSW (autoUpdate) then reloads open tabs once.
          skipWaiting: true,
          clientsClaim: true,
          runtimeCaching: [
            {
              urlPattern: ({ request }) => request.mode === 'navigate',
              handler: 'NetworkFirst',
              options: { cacheName: 'pages', networkTimeoutSeconds: 4, precacheFallback: { fallbackURL: `${base}offline.html` } },
            },
            {
              urlPattern: ({ request }) => request.destination === 'image',
              handler: 'CacheFirst',
              options: { cacheName: 'images', expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 30 } },
            },
          ],
        },
      }),
    ],
    build: {
      target: 'es2022',
      cssCodeSplit: true,
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/test/setup.ts'],
      include: ['src/**/*.test.{ts,tsx}'],
      css: false,
    },
  }
})
