import { fileURLToPath } from 'node:url'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    'better-convex-nuxt'
  ],

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  alias: {
    '@convex': fileURLToPath(new URL('./convex', import.meta.url))
  },

  routeRules: {
    '/': { redirect: '/player-stats' }
  },

  compatibilityDate: '2025-01-15',

  convex: {
    url: process.env.CONVEX_URL
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})
