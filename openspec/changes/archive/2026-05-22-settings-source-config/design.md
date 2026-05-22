## Context

The app currently has no persistent user configuration. Processing files from S3 requires bucket credentials, which must be stored securely per user. The stack is TanStack Start (SSR), TanStack Router (file-based), Prisma 7, Better Auth, and shadcn/Tailwind v4.

The dashboard already uses a `SidebarProvider` + `AppSidebar` + `SidebarInset` layout. Settings pages must share this layout consistently.

## Goals / Non-Goals

**Goals:**
- Add a `/settings/sources` route for managing S3 source configurations
- Persist source configs in PostgreSQL via Prisma with a schema extensible to future source types
- Provide a CRUD UI using shadcn components with in-page forms (no Dialog/Sheet)
- Validate all form input with Zod schemas on both client and server
- Mask secret fields by default with a user-controlled visibility toggle
- Protect all settings routes under the existing `_authenticated` layout

**Non-Goals:**
- Validating S3 credentials against AWS at save time (connection testing is future work)
- Supporting source types other than S3 in this change
- Encrypting stored secrets at the application layer (deferred; use DB encryption or secrets manager later)

## Decisions

### 1. `SourceConfig` model with `type` discriminator + `Json` config field

Store type-specific configuration in a `Json` column rather than a separate table per source type. This avoids a schema migration for every new source type.

**Alternatives considered:**
- Separate model per type (`S3Config`, etc.): more type-safe but requires a new Prisma model and migration for each future source.
- Single flat table with nullable columns: gets unwieldy fast and loses clarity.

**Chosen**: `type` enum + `config Json` — one migration now, zero schema changes for future source types.

```prisma
enum SourceType {
  S3
}

model SourceConfig {
  id        String     @id @default(cuid())
  userId    String
  user      User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  name      String
  type      SourceType
  config    Json
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt

  @@index([userId])
  @@map("source_config")
}
```

S3 `config` shape: `{ bucket: string, region: string, accessKeyId: string, secretAccessKey: string, prefix?: string }`

### 2. Settings layout via TanStack Router directory structure

Use `web/src/routes/_authenticated/settings.tsx` as the layout file (consistent with the existing `_authenticated/dashboard.tsx` convention). Child routes live at `_authenticated/settings/index.tsx` and `_authenticated/settings/sources.tsx`.

**Alternatives considered:**
- Dot-separated notation (`_authenticated.settings.tsx`): equivalent in TanStack Router but inconsistent with the project's existing directory convention.

**Chosen**: Directory structure `_authenticated/settings.tsx` with `<Outlet />`.

### 3. Server functions for CRUD, co-located with route files

All DB access goes through `createServerFn` calls in the route files. No separate API endpoints needed — TanStack Start's server functions handle RPC.

### 4. In-page form for add/edit

The add/edit form renders inline on the `/settings/sources` page — clicking "Add Source" or "Edit" expands a form section below the list (or replaces it) rather than opening a Dialog or Sheet.

**Alternatives considered:**
- Dialog: interrupts context and requires an extra dismiss interaction.
- Sheet: similarly modal; better suited for preview panels than data entry.

**Chosen**: In-page form — simpler, no overlay, consistent with settings-page conventions.

### 5. Zod schemas for validation on client and server

Define a Zod schema per source type (e.g., `s3ConfigSchema`) and a top-level `sourceConfigSchema`. Use these schemas:
- Client-side: validate on submit before calling the server function, surface errors via `FieldError`
- Server-side: parse input with `.parse()` inside each server function to prevent invalid data reaching Prisma

### 6. Secret field masking with toggle

The `secretAccessKey` input defaults to `type="password"`. An eye/eye-off icon button next to the field toggles it to `type="text"`. On edit, the field shows a masked placeholder; the user must explicitly reveal and modify the value to change it.

## Risks / Trade-offs

- **Secrets stored in plain JSON**: `secretAccessKey` is stored unencrypted in the `config` JSON column. → Mitigation: document this limitation; plan application-layer encryption as follow-up.
- **No credential validation**: A user can save invalid credentials and only discover errors when processing starts. → Mitigation: add test-connection feature in a future change.
- **`Json` field loses type safety at runtime**: Prisma returns `JsonValue`; code must parse/validate. → Mitigation: use a Zod schema per source type to parse `config` before use.

## Migration Plan

1. Add `SourceType` enum and `SourceConfig` model to `prisma/schema.prisma`
2. Run `npm run db:migrate` to generate and apply the migration
3. Deploy routes and UI
4. Rollback: drop `source_config` table and `SourceType` enum (data loss acceptable — feature is new)

## Open Questions

<!-- none -->
