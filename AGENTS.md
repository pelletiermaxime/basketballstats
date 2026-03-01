# AGENTS.md

This file contains guidelines for agentic coding agents working in this repository.

## Project Overview

Basketball Stats - A Nuxt 4 application displaying NBA player statistics. Built with Vue 3, TypeScript, Tailwind CSS v4, Nuxt UI v4, and Convex backend using better-convex-nuxt.

## Build/Lint/Test Commands

```bash
# Development
pnpm run dev              # Start dev server [Please never do this as I already run it manually]

# Build & Preview
pnpm run build            # Build for production
pnpm run preview          # Preview production build

# Linting
pnpm run lint             # Run ESLint on all files
pnpm run typecheck        # Run TypeScript type checking (via nuxt typecheck)
```

## Code Style Guidelines

### General Principles

- No comments unless explaining complex business logic
- Avoid code explanation summaries unless requested
- Keep responses concise on command line
- Never commit changes unless explicitly asked

### TypeScript

- Use TypeScript interfaces for all type definitions
- Prefer explicit types over `any`
- Use `Record<K, T>` for dictionary types
- Use optional properties with `?` when appropriate
- Define props in Vue components using TypeScript:

```typescript
defineProps<{
  stats: PlayerStat[]
}>()
```

### Naming Conventions

- **Files**: PascalCase for Vue components (`PlayerStatsTable.vue`), camelCase for TypeScript files
- **Variables/functions**: camelCase (`getTeams`, `playerStats`)
- **Types/Interfaces**: PascalCase (`PlayerStat`, `Team`)
- **Constants**: SCREAMING_SNAKE_CASE for config values
- **Vue components**: Auto-imported by directory structure, use descriptive names

### Vue Components

- Use `<script setup lang="ts">` for all components
- Use Nuxt auto-imports for composables and utilities
- Define page metadata with `definePageMeta()`:

```typescript
definePageMeta({
  title: 'Player Stats'
})
```

- Use `useConvexQuery()` from `better-convex-nuxt` for data fetching in pages:

```typescript
import { api } from "@convex/_generated/api";

const { data: playerStats } = await useConvexQuery(
  api.playerStats.getTopPlayerStatsWithTeams,
  { year: 2026, limit: 100 }
)
```

### Imports

- Use `~` alias for imports from `app/` directory (`~/components/PlayerStatsTable`)
- Use `@convex` alias for imports from `convex/` directory (`@convex/_generated/api`)
- Use Nuxt auto-imports (no need to import `ref`, `computed`, etc.)
- Import types explicitly with `import type { PlayerStat } from '~/types/players'`

### Error Handling

- Convex errors are handled automatically by `useQuery()`
- Use try/catch for async operations when needed
- Use Nuxt's `createError()` for fatal errors:

```typescript
throw createError({
  statusCode: 500,
  statusMessage: 'Failed to fetch data'
})
```

### Convex Backend

- Uses `better-convex-nuxt` module for Vue/Nuxt integration
- Place functions in `convex/` directory
- Define schema in `convex/schema.ts` with indexes on frequently queried fields
- Export query/mutation/action functions using `query({})`, `mutation({})`, `action({})` from `./_generated/server`
- Access database via `ctx.db`
- Use `v` validator from `convex/values` for argument validation
- Don't manually run `convex dev` as it is already running

Example:
```typescript
import { query } from "./_generated/server";

export const getTeams = query({
  args: {},
  handler: async (ctx) => {
    const teams = await ctx.db.query("teams").collect();
    return teams;
  },
});
```

### Styling

- Use Tailwind CSS v4 utility classes in templates
- Use Nuxt UI v4 components (`UButton`, `UTable`, `UPageHeader`, etc.)
- Use Tailwind-compatible classes
- Avoid custom CSS unless necessary

### File Organization

```
├── app/
│   ├── app.vue              # App entry point
│   ├── components/          # Vue components (auto-imported)
│   ├── pages/               # Route pages (auto-routed)
│   └── assets/css/          # Styles
├── convex/                  # Convex backend functions
│   ├── schema.ts            # Database schema
│   ├── playerStats.ts       # Player stats functions
│   ├── teams.ts             # Teams functions
│   └── seed.ts              # Seed data
├── public/                  # Static assets
├── nuxt.config.ts           # Nuxt configuration
└── package.json             # Dependencies
```

### Before Submitting

1. Run `pnpm run lint` to check code quality
2. Run `pnpm run typecheck` to verify TypeScript


