import { defineConfig } from 'vite-plus'
import { devtools } from '@tanstack/devtools-vite'
import tsconfigPaths from 'vite-tsconfig-paths'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'

const config = defineConfig({
  server: {
    port: Number(process.env.PORT) || 5173,
    host: true,
  },
  staged: {
    '*': 'vp check --fix',
  },
  fmt: {
    ignorePatterns: ['src/routeTree.gen.ts', 'convex/_generated'],
    singleQuote: true,
    semi: false,
  },
  lint: {
    options: { typeAware: true, typeCheck: true },
    ignorePatterns: ['src/routeTree.gen.ts', 'convex/_generated'],
  },
  plugins: [
    devtools(),
    tsconfigPaths({ projects: ['./tsconfig.json'] }),
    tailwindcss(),
    tanstackStart(),
    nitro({ preset: 'vercel' }),
    viteReact(),
  ],
})

export default config
