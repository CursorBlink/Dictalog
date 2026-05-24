## Why

S3 credentials are currently hardcoded to AWS endpoints, making it impossible to use Dictalog with S3-compatible object storage platforms like MinIO or RustFS. Adding an optional custom endpoint hostname unlocks self-hosted and on-premise deployments without changing anything for existing AWS users.

## What Changes

- Add optional `endpoint` field to the S3 source config form (placeholder: AWS default) and Zod schema
- Add optional `forcePathStyle` boolean field for platforms (e.g. MinIO) that require path-style addressing
- Add optional `tlsVerify` boolean field (default `true`) allowing TLS certificate verification to be disabled for self-signed certs on private deployments
- Pass all three new options to `S3Client` in both the connection test and any future read operations
- Display endpoint on the source config card when set; display `forcePathStyle` and `tlsVerify` indicators when non-default
- Store all new fields in the existing `config` JSON column — no schema migration needed

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `source-config`: Add `endpoint`, `forcePathStyle`, and `tlsVerify` as optional fields to the S3 config — affects the add/edit form, Zod validation schema, server-side CRUD, and the source card display
- `s3-connection-test`: Pass `endpoint`, `forcePathStyle`, and `tlsVerify` to `S3Client` during the connection test so the test validates the actual target storage platform

## Impact

- `web/src/lib/schemas/source-config.ts` — `s3ConfigSchema` gains `endpoint`, `forcePathStyle`, and `tlsVerify` optional fields
- `web/src/routes/_authenticated/settings/sources.tsx` — form state, field UI, card display, and `testS3ConnectionFn` all updated
- Node.js `https` agent required client-side for `tlsVerify: false` — needs `requestHandler` on `S3Client` using `@aws-sdk/node-http-handler` or equivalent
- No database migration — `config` is a JSON column; new fields are stored alongside existing ones
- No breaking change to existing saved source configs — absent fields fall back to safe defaults (AWS endpoint, virtual-hosted style, TLS verification enabled)
