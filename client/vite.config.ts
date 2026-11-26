import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Di dalam sandbox Base44, host preview memakai domain sandbox yang berubah
// setiap kali environment dibuat ulang. Tambahkan wildcard-nya hanya saat
// BASE44_PREVIEW_MODE === '1' agar perilaku biasa tidak berubah.
const previewHosts =
  process.env.BASE44_PREVIEW_MODE === '1' && process.env.BASE44_SANDBOX_HOST_DOMAIN
    ? ['.' + process.env.BASE44_SANDBOX_HOST_DOMAIN]
    : [];

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'icon-192.png', 'icon-512.png'],
      devOptions: { enabled: true, type: 'module', navigateFallback: 'index.html' },
      manifest: {
        name: 'E-Ujian CBT — Platform Ujian Online & Offline',
        short_name: 'E-Ujian CBT',
        description:
          'Platform ujian berbasis komputer yang bisa dipakai online maupun offline.',
        lang: 'id',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#0d1117',
        theme_color: '#0d1117',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            // Data tetap dikelola aplikasi lewat IndexedDB, bukan cache HTTP.
            urlPattern: /\/api\//,
            handler: 'NetworkOnly',
          },
        ],
      },
    }),
  ],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    allowedHosts: ['.localhost', ...previewHosts],
    // Bind mount di sandbox tidak selalu mengirim event inotify.
    watch: { usePolling: true, interval: 400 },
    proxy: {
      '/api': {
        target: process.env.API_PROXY_TARGET || 'http://api:8000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    allowedHosts: ['.localhost', ...previewHosts],
  },
});
