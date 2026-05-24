## Context

The S3 source config currently hardcodes AWS endpoints by omitting the `endpoint`, `forcePathStyle`, and TLS options on `S3Client`. MinIO, RustFS, Ceph, and other S3-compatible platforms commonly require a custom endpoint URL, path-style addressing, and optionally disabled TLS verification for self-signed certificates on private/local deployments. The `config` JSON column already stores arbitrary fields, so no database migration is needed — the new fields are stored alongside `bucket`, `region`, etc.

## Goals / Non-Goals

**Goals:**
- Optional `endpoint` field in the S3 config form, Zod schema, and `S3Client` construction
- Optional `forcePathStyle` boolean toggle for platforms requiring path-style addressing
- Optional `tlsVerify` boolean (default `true`) to disable TLS certificate verification for self-signed certs
- All three options passed through to the connection test server function
- Endpoint shown on the source card when set; `forcePathStyle` and `tlsVerify` shown as badges when non-default
- Backward-compatible: existing saved configs without these fields fall back to safe defaults

**Non-Goals:**
- Any provider-specific UI or preset profiles (MinIO mode, RustFS mode, etc.) — fields are generic
- Client-side TLS cert upload or pinning

## Decisions

### 1. Store all new fields in the existing `config` JSON column

No migration: the `config` column is `Json` and already stores flexible S3 fields. Absent keys in existing records are treated as `undefined` by Zod, falling back to SDK defaults (AWS endpoint, virtual-hosted style, TLS enabled).

**Alternative considered**: Separate DB columns. Rejected — the `config` JSON column was designed for provider-specific fields and no other code introspects its structure at the DB layer.

### 2. `forcePathStyle` mapped directly to `S3Client` `forcePathStyle` option

`S3Client` accepts a `forcePathStyle` boolean. When `true`, requests use `endpoint/bucket/key` instead of `bucket.endpoint/key`. MinIO and RustFS installations commonly require this. Exposed as an optional checkbox defaulting to unchecked (false).

### 3. `tlsVerify: false` implemented via a custom Node.js HTTPS agent

The AWS SDK v3 supports a custom `requestHandler`. To disable TLS verification, we pass a `NodeHttpHandler` configured with an `https.Agent({ rejectUnauthorized: false })`. This is only applied server-side inside the server function — it never runs in the browser.

**Security note**: `tlsVerify: false` is a deliberate operator choice for private/dev deployments with self-signed certificates. The form will display a visible warning when this option is enabled.

### 4. `endpoint`, `forcePathStyle`, and `tlsVerify` are all credential fields for test-reset purposes

Any change to these three fields changes which server or protocol is contacted, invalidating a previous passing test. All three are added to `CREDENTIAL_FIELDS` so modifying them resets `testResult` to idle.

### 5. `tlsVerify` defaults to `true` (verify enabled) and is stored as explicit boolean when set to `false`

When absent from the stored config, the SDK default (verify enabled) applies. Only `false` is meaningful to store; `true` is the default. The Zod schema accepts `z.boolean().optional()` and the form shows a checkbox labelled "Disable TLS verification".

## Risks / Trade-offs

- **`tlsVerify: false` is a security risk** — Disabling TLS verification exposes connections to MITM attacks. A prominent warning is shown in the form when the checkbox is checked. → Accepted; this is an explicit operator opt-in for private deployments.
- **No URL format validation on `endpoint`** — A malformed URL will produce an SDK error surfaced via the connection test. → Acceptable; the test catches it immediately.
- **`NodeHttpHandler` import increases server bundle size slightly** — Only imported inside the server function body (dynamic import), so it does not affect the client bundle.
