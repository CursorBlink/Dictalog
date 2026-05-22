## 1. Database

- [x] 1.1 Add `SourceType` enum and `SourceConfig` model to `prisma/schema.prisma`
- [x] 1.2 Run `npm run db:migrate` to generate and apply the migration
- [x] 1.3 Run `npm run db:generate` to regenerate the Prisma client

## 2. Zod Schemas

- [x] 2.1 Create `web/src/lib/schemas/source-config.ts` with a Zod `s3ConfigSchema` (bucket, region, accessKeyId, secretAccessKey, optional prefix) and a top-level `sourceConfigSchema` (name, type, config)
- [x] 2.2 Export inferred TypeScript types from the schemas for use in server functions and form components

## 3. Settings Layout Route

- [x] 3.1 Create `web/src/routes/_authenticated/settings.tsx` as a layout route that renders `SidebarProvider`, `AppSidebar`, `SidebarInset`, and `<Outlet />`
- [x] 3.2 Create `web/src/routes/_authenticated/settings/index.tsx` that redirects to `/settings/sources`

## 4. Source Config Server Functions

- [x] 4.1 Create `web/src/routes/_authenticated/settings/sources.tsx` route file
- [x] 4.2 Implement `listSourceConfigs` server function (fetch all configs for authenticated user)
- [x] 4.3 Implement `createSourceConfig` server function (parse input with `sourceConfigSchema.parse()`, insert record)
- [x] 4.4 Implement `updateSourceConfig` server function (verify ownership, parse input with Zod, update fields; preserve existing secret if the field is blank)
- [x] 4.5 Implement `deleteSourceConfig` server function (verify ownership, delete record)

## 5. Source Config UI

- [x] 5.1 Build the sources page component with empty state (message + "Add Source" button)
- [x] 5.2 Build the source config list using shadcn `Card` components showing name, type badge, edit/delete action buttons
- [x] 5.3 Build the inline S3 form component with fields: name, bucket, region, access key ID, secret access key, prefix (optional); use the `Field`/`FieldLabel`/`FieldError` system for layout
- [x] 5.4 Add secret access key input with `type="password"` default and an eye/eye-off icon toggle button to switch visibility
- [x] 5.5 Wire up client-side Zod validation on form submit — display field errors via `FieldError` and block server call if invalid
- [x] 5.6 Implement inline form show/hide: "Add Source" and "Edit" buttons reveal the form in-page; "Cancel" hides it without saving
- [x] 5.7 On edit, pre-populate all fields; show masked placeholder for secret access key and only send a new value if the field was changed
- [x] 5.8 Add inline delete confirmation (reveal confirm/cancel buttons on first "Delete" click) before calling the delete server function
- [x] 5.9 Refresh the source config list after create/update/delete (TanStack Query invalidation or route re-validation)

## 6. Navigation

- [x] 6.1 Update `AppSidebar` nav data to include a top-level "Settings" link pointing to `/settings/sources` using `Settings2Icon`
