## Why

Users need to configure external data sources (starting with S3) so Dictalog can read and process files for transcription. Without a persistent settings store, source credentials must be re-entered each session or hardcoded, which is insecure and impractical.

## What Changes

- Add a Settings page accessible from the dashboard sidebar navigation
- Introduce a `SourceConfig` Prisma model to persist source configurations per user
- Add an S3 source configuration form (bucket name, region, access key ID, secret access key, optional prefix)
- Design the data model to support multiple source types (S3 now; others in the future)
- Provide add/edit/delete UI for managing multiple source configurations

## Capabilities

### New Capabilities

- `settings-page`: Top-level settings route with sidebar navigation integration
- `source-config`: CRUD for user source configurations (S3 bucket settings), backed by Prisma model designed for extensibility to future source types

### Modified Capabilities

<!-- none -->

## Impact

- **Database**: New `SourceConfig` table (Prisma migration required)
- **Routes**: New `/settings` route and nested `/settings/sources` route
- **UI**: Sidebar nav updated to include Settings link; shadcn components used throughout
- **Auth**: Settings routes protected — only authenticated users can manage their own source configs
- **Dependencies**: No new npm packages required (shadcn components already available, Prisma already in use)
