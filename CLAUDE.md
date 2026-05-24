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

DB commands require `web/.env` with `DATABASE_URL` (and `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` for auth). The `.envrc` loads `.env` automatically via direnv.

Local infrastructure (PostgreSQL on :5432, Redis on :6379):
```bash
docker compose up -d  # from repo root
```

## Architecture

**Stack**: TanStack Start (React 19 SSR), TanStack Router (file-based), TanStack Query, Prisma 7 with `@prisma/adapter-pg`, Better Auth, Tailwind CSS v4, Vite 8.

**Path alias**: `@/` maps to `web/src/` (configured in `package.json` `imports` and tsconfig).

**Routing**: TanStack Router generates `src/routeTree.gen.ts` automatically from files in `src/routes/`. Never edit `routeTree.gen.ts` manually. The root layout is `src/routes/__root.tsx`.

**Server functions**: Use `createServerFn` from `@tanstack/react-start` for server-only logic (DB access, auth). These run only on the server even though they're co-located with route files.

**Database**: Prisma client is a singleton in `src/db.ts` (uses `globalThis.__prisma` in dev to survive HMR). Schema lives in `prisma/schema.prisma`; generated client outputs to `src/generated/prisma/`. Uses Prisma 7's TypeScript-native generator (`provider = "prisma-client"`) with `@prisma/adapter-pg` — the datasource has no `url` field since the connection string is passed directly to the adapter.

**Auth**: Better Auth with the Prisma adapter.
- Server config: `src/lib/auth.ts` — exports `auth`, used in the API catch-all route
- Client config: `src/lib/auth-client.ts` — exports `authClient` (Better Auth React client)
- API route: `src/routes/api/auth/$.ts` handles all `/api/auth/*` requests by passing them to `auth.handler`
- Session in components: `authClient.useSession()` hook
- Integration components (e.g., session-aware header): `src/integrations/better-auth/`

**Known compatibility issue**: Better Auth's Prisma adapter (`@better-auth/prisma-adapter`) checks `prisma[modelName]` at runtime. Prisma 7's TypeScript-native client (`prisma-client` generator) may not expose model properties the same way as the old `prisma-client-js` generator. If you see "Model user does not exist in the database" errors, this is the root cause.

**Styling**: Tailwind v4 — no `tailwind.config.js`; configuration is done in CSS. Design tokens are defined in `src/styles.css` (custom palette: `--sea-ink`, `--lagoon`, `--palm`, `--sand`, `--foam`, etc.; shadcn tokens like `--background`, `--primary` also defined there). Uses both Google Fonts (Fraunces, Manrope) and self-hosted fontsource (Geist, JetBrains Mono).

**UI components**: shadcn-style components in `src/components/ui/`. Includes a custom `Field` system (`Field`, `FieldGroup`, `FieldLabel`, `FieldDescription`, `FieldError`) built for form layouts — prefer this over raw label/input composition.

**Adding components**: Always use the shadcn CLI to add new UI components — run from `web/`:
```bash
npx shadcn@latest add <component-name>
```
Never manually create component files in `src/components/ui/` when the CLI can generate them.

**Worker**: `worker/` directory exists but is empty — intended for background job processing (Redis-backed, per docker-compose).
