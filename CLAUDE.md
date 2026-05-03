# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All commands run from `web/`:

```bash
npm run dev          # Start dev server on :3000
npm run build        # Production build
npm run test         # Run tests (vitest)
npm run lint         # ESLint
npm run format       # Prettier + ESLint fix

npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to DB (no migration file)
npm run db:migrate   # Create and apply migration
npm run db:studio    # Open Prisma Studio
npm run db:seed      # Seed the database
```

DB commands require `.env.local` in `web/` with `DATABASE_URL`.

Local infrastructure (PostgreSQL on :5432, Redis on :6379):
```bash
docker compose up -d  # from repo root
```

## Architecture

**Stack**: TanStack Start (React 19 SSR), TanStack Router (file-based), TanStack Query, Prisma 7 with `@prisma/adapter-pg`, Tailwind CSS v4, Vite 8.

**Path alias**: `@/` maps to `web/src/` (configured in `package.json` `imports` and tsconfig).

**Routing**: TanStack Router generates `src/routeTree.gen.ts` automatically from files in `src/routes/`. Never edit `routeTree.gen.ts` manually. The root layout is `src/routes/__root.tsx`.

**Server functions**: Use `createServerFn` from `@tanstack/react-start` for server-only logic (DB access, auth). These run only on the server even though they're co-located with route files.

**Database**: Prisma client is a singleton in `src/db.ts` (uses `globalThis.__prisma` in dev to survive HMR). Schema lives in `prisma/schema.prisma`; generated client outputs to `src/generated/prisma/`.

**Router context**: The router context (`src/router.tsx`) carries a `QueryClient` instance, enabling SSR-integrated data fetching via `setupRouterSsrQueryIntegration`.

**Styling**: Tailwind v4 — no `tailwind.config.js`; configuration is done in CSS. Design tokens (color vars like `--sea-ink`, `--line`, `--header-bg`) are defined in `src/styles.css`.

**Worker**: `worker/` directory exists but is empty — intended for background job processing (Redis-backed, per docker-compose).
