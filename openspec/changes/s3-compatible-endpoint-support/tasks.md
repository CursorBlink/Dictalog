## 1. Schema — Zod validation

- [x] 1.1 Add optional `endpoint` field (`z.string().url().optional()`) to `s3ConfigSchema` in `web/src/lib/schemas/source-config.ts`
- [x] 1.2 Add optional `forcePathStyle` field (`z.boolean().optional()`) to `s3ConfigSchema`
- [x] 1.3 Add optional `tlsVerify` field (`z.boolean().optional()`) to `s3ConfigSchema`
- [x] 1.4 Verify `updateSourceConfigSchema` inherits all new fields (it extends `s3ConfigSchema` — confirm no separate change needed)

## 2. Server Functions — connection test

- [x] 2.1 Update `testS3ConnectionFn` input validator to accept optional `endpoint`, `forcePathStyle`, and `tlsVerify`
- [x] 2.2 Pass `endpoint` and `forcePathStyle` to `S3Client` constructor when present
- [x] 2.3 When `tlsVerify` is `false`, construct a custom Node.js `https.Agent({ rejectUnauthorized: false })` and pass it via `NodeHttpHandler` (from `@smithy/node-http-handler` or `@aws-sdk/node-http-handler`) as the `requestHandler` on `S3Client`
- [x] 2.4 `createSourceConfig` and `updateSourceConfig` require no changes — new fields flow through the JSON `config` column automatically

## 3. Server Functions — list

- [x] 3.1 Add `endpoint`, `forcePathStyle`, and `tlsVerify` to the `listSourceConfigs` return map (read from `cfg.endpoint`, `cfg.forcePathStyle`, `cfg.tlsVerify`)

## 4. Form State

- [x] 4.1 Add `endpoint: string`, `forcePathStyle: boolean`, and `tlsVerify: boolean` to `FormState` type and `emptyForm` constant (`endpoint: ''`, `forcePathStyle: false`, `tlsVerify: true`)
- [x] 4.2 Add `endpoint`, `forcePathStyle`, and `tlsVerify` to `CREDENTIAL_FIELDS` set so changing any of them resets the connection test
- [x] 4.3 Add `endpoint`, `forcePathStyle`, and `tlsVerify` to the `Draft` type and `saveDraft` serialization
- [x] 4.4 Pre-populate `endpoint`, `forcePathStyle`, and `tlsVerify` in `openEdit` from `source.config`
- [x] 4.5 Pass `endpoint`, `forcePathStyle`, and `tlsVerify` in the `createSourceConfig` and `updateSourceConfig` call payloads inside `handleSubmit`
- [x] 4.6 Pass `endpoint`, `forcePathStyle`, and `tlsVerify` in the `testS3ConnectionFn` call inside `handleTestConnection`

## 5. Form UI

- [x] 5.1 Add `endpoint` `<Field>` between the secret access key field and the advanced options, with placeholder `https://minio.example.com` and a hint "Leave blank to use AWS"
- [x] 5.2 Add `forcePathStyle` checkbox field with label "Force path-style addressing" and a hint "Required for some MinIO/RustFS configurations"
- [x] 5.3 Add `tlsVerify` checkbox field with label "Disable TLS verification" (checked = tlsVerify false, unchecked = true — invert display logic)
- [x] 5.4 Show an inline warning beneath the TLS checkbox when it is checked, explaining the security risk
- [x] 5.5 Add `endpoint` path mapping (`'config.endpoint'`) in the `extractErrors` helper
- [x] 5.6 Wire `forcePathStyle` and `tlsVerify` inputs to `setField` (treat them as boolean — use a helper or convert to string and back, or add a separate `setBoolField` handler)

## 6. Source card — display non-default values

- [x] 6.1 Render an endpoint `<dd>` in the card's `<dl>` only when `source.config.endpoint` is truthy
- [x] 6.2 Render a "Path Style" badge/indicator on the card when `source.config.forcePathStyle` is true
- [x] 6.3 Render a "TLS Unverified" badge/indicator on the card when `source.config.tlsVerify` is `false`
