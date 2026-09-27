import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // la app avisa de las versiones nuevas en lugar de recargarse sola
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'FetenQuest · Ayuda de juego',
        short_name: 'FetenQuest',
        description: 'Generador de aventuras y ayudas de juego para FetenQuest',
        lang: 'es',
        theme_color: '#e9dab8',
        background_color: '#e9dab8',
        display: 'standalone',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // todo precacheado, plantillas incluidas: funciona sin conexión
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
      },
    }),
  ],
  // ruta de publicación, p. ej. /fetenquest/ en GitHub Pages (ver .github/workflows)
  base: process.env.BASE_PATH ?? '/',
  // puerto fijo: el depurador de VS Code (.vscode/launch.json) abre esta URL
  server: { port: 5180, strictPort: true },
})
