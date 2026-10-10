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

npm run db:generate  # Generate SQL migration files (drizzle-kit generate)
npm run db:push      # Push schema to DB without migration files (drizzle-kit push)
npm run db:migrate   # Apply pending migrations (drizzle-kit migrate)
npm run db:studio    # Open Drizzle Studio
npm run db:seed      # Seed the database
```

DB commands require `web/.env` with `DATABASE_URL` (and `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` for auth). The `.envrc` loads `.env` automatically via direnv.

Local infrastructure (PostgreSQL on :5432, Redis on :6379):
```bash
docker compose up -d  # from repo root
```

## Architecture

**Stack**: TanStack Start (React 19 SSR), TanStack Router (file-based), TanStack Query, Drizzle ORM with `drizzle-orm/node-postgres`, Better Auth, Tailwind CSS v4, Vite 8.

**Path alias**: `@/` maps to `web/src/` (configured in `package.json` `imports` and tsconfig).

**Routing**: TanStack Router generates `src/routeTree.gen.ts` automatically from files in `src/routes/`. Never edit `routeTree.gen.ts` manually. The root layout is `src/routes/__root.tsx`.

**Server functions**: Use `createServerFn` from `@tanstack/react-start` for server-only logic (DB access, auth). These run only on the server even though they're co-located with route files.

**Database**: Drizzle client is a singleton in `src/db.ts` (uses `globalThis.__db` in dev to survive HMR). Schema lives in `src/db/schema.ts`. Migrations output to `drizzle/`. Config in `drizzle.config.ts`.
- Use `drizzle-orm/node-postgres` driver with `DATABASE_URL` connection string
- Import `db` from `@/db` and table schemas from `@/db/schema`
- IDs are UUIDv7 (`import { v7 as uuidv7 } from 'uuid'`) — set explicitly on insert
- `updatedAt` is set manually on updates (`.set({ updatedAt: new Date() })`)

**Auth**: Better Auth with the Drizzle adapter.
- Server config: `src/lib/auth.ts` — exports `auth`, uses `drizzleAdapter(db, { provider: 'pg', schema })`
- Client config: `src/lib/auth-client.ts` — exports `authClient` (Better Auth React client)
- API route: `src/routes/api/auth/$.ts` handles all `/api/auth/*` requests by passing them to `auth.handler`
- Session in components: `authClient.useSession()` hook
- Integration components (e.g., session-aware header): `src/integrations/better-auth/`

**Styling**: Tailwind v4 — no `tailwind.config.js`; configuration is done in CSS. Design tokens are defined in `src/styles.css` (custom palette: `--sea-ink`, `--lagoon`, `--palm`, `--sand`, `--foam`, etc.; shadcn tokens like `--background`, `--primary` also defined there). Uses both Google Fonts (Fraunces, Manrope) and self-hosted fontsource (Geist, JetBrains Mono).

**UI components**: shadcn-style components in `src/components/ui/`. Includes a custom `Field` system (`Field`, `FieldGroup`, `FieldLabel`, `FieldDescription`, `FieldError`) built for form layouts — prefer this over raw label/input composition.

**Adding components**: Always use the shadcn CLI to add new UI components — run from `web/`:
```bash
npx shadcn@latest add <component-name>
```
Never manually create component files in `src/components/ui/` when the CLI can generate them.

**Worker**: `worker/` directory exists but is empty — intended for background job processing (Redis-backed, per docker-compose).
