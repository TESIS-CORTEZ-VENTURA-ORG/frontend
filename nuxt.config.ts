// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: [
    '@nuxt/ui',
    '@pinia/nuxt',
    '@pinia/colada-nuxt',
    'nuxt-auth-utils',
    '@vite-pwa/nuxt',
  ],

  css: ['~/assets/css/main.css', '~/assets/css/admin-catalog.css'],

  // TP1 es light-only; el color mode de Nuxt UI queda desactivado
  ui: { colorMode: false },

  app: {
    head: {
      htmlAttrs: { lang: 'es-PE' },
      title: 'GastronomIA',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'theme-color', content: '#F3EDE4' },
        { name: 'description', content: 'Control de rentabilidad con IA para tu restaurante' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/img/logo.svg' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
      ],
    },
  },

  // Landing SSR; el panel opera como SPA island detrás de auth
  routeRules: {
    '/app/**': { ssr: false },
  },

  typescript: { strict: true },

  runtimeConfig: {
    // NUXT_DEMO_PASSWORD — credencial demo mientras no existe la API NestJS
    demoPassword: '',
    // NUXT_API_BASE — upstream NestJS para el BFF (Sprint 1+)
    apiBase: '',
  },

  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'GastronomIA',
      short_name: 'GastronomIA',
      description: 'Control de rentabilidad con IA para restaurantes',
      lang: 'es-PE',
      display: 'standalone',
      theme_color: '#F3EDE4',
      background_color: '#F3EDE4',
      icons: [
        { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
        { src: 'pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    workbox: {
      navigateFallback: '/',
    },
    // El SW en dev contamina la caché durante el desarrollo; se prueba en build/preview
    devOptions: { enabled: false },
  },
})
