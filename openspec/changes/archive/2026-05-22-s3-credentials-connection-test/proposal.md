## Why

Users currently enter S3 credentials and save without any validation that those credentials actually work, leading to silent failures when Dictalog tries to read from the source. A connection test with guardrails prevents misconfigured sources from being saved and surfaces over-permissioned credentials before they become a security concern.

## What Changes

- Add a "Test Connection" button to the S3 source config inline form (add and edit modes)
- Block the "Save" button until a passing connection test has been run for the current credential set
- Persist unsaved form state in `sessionStorage` so users can navigate away and return without losing entered credentials
- Run a server-side S3 connectivity check that attempts to list objects in the specified bucket using the provided credentials
- Detect when the credentials can access buckets beyond the specified one (ListAllMyBuckets permission) and surface a dismissible warning
- Allow the user to acknowledge the over-permission warning and proceed to save

## Capabilities

### New Capabilities

- `s3-connection-test`: Server-side S3 connection test endpoint — verifies credentials can reach the specified bucket, detects excess bucket-list permissions, and returns a structured result (success, failure reason, over-permission flag)
- `source-config-form-persistence`: Client-side `sessionStorage` persistence of the in-progress source config form — saves on every field change, restores on mount, clears on successful save or explicit cancel

### Modified Capabilities

- `source-config`: Add connection test state to the add/edit form — test result gates the Save button, over-permission warning is shown inline and must be acknowledged before saving

## Impact

- `web/src/routes/_authenticated/settings/sources.tsx` — new test connection flow, save-gate logic, over-permission warning UI, sessionStorage persistence
- New server function `testS3Connection` in the sources route (or a dedicated server file)
- AWS SDK (`@aws-sdk/client-s3`) added as a dependency for server-side connectivity checks
- No schema changes — credentials are not stored differently; only the form UX changes
- No breaking changes to existing saved source configs
