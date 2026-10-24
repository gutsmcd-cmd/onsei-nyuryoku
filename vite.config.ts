import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

const MANIFEST_ID = '/onsei-nyuryoku/'

function assertManifestId(): Plugin {
  return {
    name: 'assert-manifest-id',
    apply: 'build',
    enforce: 'post',
    closeBundle() {
      const manifest = JSON.parse(readFileSync(resolve('dist/manifest.webmanifest'), 'utf8')) as { id?: string }
      if (manifest.id !== MANIFEST_ID) throw new Error(`manifest id must be ${MANIFEST_ID}, got ${String(manifest.id)}`)
    },
  }
}

export default defineConfig({
  base: './',
  worker: { format: 'es' },
  optimizeDeps: { exclude: ['@huggingface/transformers'] },
  build: { chunkSizeWarningLimit: 2000 },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon-32.png', 'icons/icon-180.png'],
      manifest: {
        id: MANIFEST_ID,
        name: '音声入力',
        short_name: '音声入力',
        description: '話すだけで文字に。電波なしでも使える音声入力。Offline voice typing that runs on your device.',
        lang: 'ja',
        dir: 'ltr',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#2a2140',
        theme_color: '#2a2140',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest,mjs}'],
        maximumFileSizeToCacheInBytes: 30 * 1024 * 1024,
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // Whisper model files (Hugging Face) + onnxruntime wasm (jsDelivr): download once, then offline.
            // transformers.js also keeps the model in its own "transformers-cache"; this is the belt-and-braces copy.
            urlPattern: ({ url }) => url.hostname === 'cdn.jsdelivr.net' || url.hostname === 'huggingface.co' || url.hostname.endsWith('.hf.co'),
            handler: 'CacheFirst',
            options: { cacheName: 'onsei-nyuryoku-model', expiration: { maxEntries: 40 }, cacheableResponse: { statuses: [0, 200] } },
          },
        ],
      },
    }),
    assertManifestId(),
  ],
})
