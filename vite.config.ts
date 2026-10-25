import { defineConfig } from 'vite-plus'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  server: {
    port: Number(process.env.PORT) || 5173,
    host: true,
  },
  staged: {
    '*': 'vp check --fix',
  },
  fmt: {
    ignorePatterns: [
      'src/routeTree.gen.ts',
      'convex/_generated',
      'scripts/**',
      '.kilo/**',
      '.kilocode/**',
    ],
    singleQuote: true,
    semi: false,
  },
  lint: {
    options: { typeAware: true, typeCheck: true },
    ignorePatterns: [
      'src/routeTree.gen.ts',
      'convex/_generated',
      'scripts/**',
      '.kilo/**',
      '.kilocode/**',
    ],
  },
  plugins: [
    devtools(),
    tailwindcss(),
    tanstackStart(),
    nitro({
      preset: 'vercel',
      scanDirs: ['server'],
      serverDir: 'server',
    }),
    viteReact(),
  ],
})

export default config
