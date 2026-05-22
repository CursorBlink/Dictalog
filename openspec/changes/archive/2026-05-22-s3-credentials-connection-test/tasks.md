## 1. Dependencies

- [x] 1.1 Add `@aws-sdk/client-s3` to `web/package.json` and install

## 2. Server Function — S3 Connection Test

- [x] 2.1 Add `testS3Connection` server function in `web/src/routes/_authenticated/settings/sources.tsx` (or a shared server file) that accepts `bucket`, `region`, `accessKeyId`, `secretAccessKey`
- [x] 2.2 Implement `HeadBucket` call using `@aws-sdk/client-s3` `S3Client` + `HeadBucketCommand` — return `{ success: false, errorCode, errorMessage }` on failure
- [x] 2.3 On `HeadBucket` success, attempt `ListBuckets` and set `overPermissioned: true` if it succeeds (catch `AccessDenied` and treat as `false`)
- [x] 2.4 Add session authentication guard at the top of the server function (throw if no session)
- [x] 2.5 Ensure `secretAccessKey` is used only in the in-flight SDK client and is not written to any log or database

## 3. Form State — Test Result & Save Gate

- [x] 3.1 Add `testResult` state (`'idle' | 'pending' | 'passed' | 'failed'`) and `testError` string state to the `SourcesPage` component
- [x] 3.2 Add `overPermissioned` boolean state and `warningAcknowledged` boolean state
- [x] 3.3 Reset `testResult`, `overPermissioned`, and `warningAcknowledged` to initial values whenever `bucket`, `region`, `accessKeyId`, or `secretAccessKey` change (in `setField`)
- [x] 3.4 Disable the "Save" button when `testResult !== 'passed'` or (`overPermissioned && !warningAcknowledged`)
- [x] 3.5 Wire the "Test Connection" button to call `testS3Connection`, set `testResult` to `'pending'` during the call, then update state from the result

## 4. Form UI — Test Connection Button & Result Display

- [x] 4.1 Add a "Test Connection" button in the form below the credential fields (before `prefix`), showing a spinner when `testResult === 'pending'` and disabled during the call
- [x] 4.2 Show an inline success badge/message when `testResult === 'passed'` and `!overPermissioned`
- [x] 4.3 Show an inline error message with `testError` details when `testResult === 'failed'`
- [x] 4.4 Show an inline warning banner when `overPermissioned` is true, explaining that credentials can list all S3 buckets
- [x] 4.5 Add an acknowledgement checkbox below the warning banner; checking it sets `warningAcknowledged` to `true`

## 5. Form State — sessionStorage Persistence

- [x] 5.1 Define a stable `sessionStorage` key (e.g., `dictalog:source-config-draft`) for the form draft
- [x] 5.2 On every `setField` call (for any field), serialize form state — excluding `secretAccessKey` — to `sessionStorage`
- [x] 5.3 On component mount, check `sessionStorage` for a saved draft; if found, restore non-secret fields and open the form automatically
- [x] 5.4 Show a note near the secret access key field when the form was restored from `sessionStorage`, telling the user the secret must be re-entered
- [x] 5.5 Clear the `sessionStorage` key on successful save and on cancel (`closeForm`)

## 6. Validation & Edge Cases

- [x] 6.1 Ensure the `testS3Connection` server function is called only after client-side Zod validation passes for `bucket`, `region`, `accessKeyId`, and `secretAccessKey`
- [x] 6.2 Verify that changing only `name` or `prefix` after a passing test does not reset `testResult`
- [x] 6.3 Verify that the edit form also requires a passing test before Save is enabled (the masked secret placeholder counts as empty — user must enter a new secret to test, or the existing secret is not re-testable without re-entry)
