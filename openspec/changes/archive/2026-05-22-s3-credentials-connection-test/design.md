## Context

The sources settings page (`/settings/sources`) allows users to add and edit S3 source configurations. Currently, credentials are accepted and saved with no validation that they actually work. Users only discover problems when Dictalog attempts to read from the source later.

Three concerns drive this change:
1. **Connectivity** — credentials may be wrong, the bucket may not exist, or network policies may block access.
2. **Over-permission** — credentials may have `s3:ListAllMyBuckets` permission, exposing other bucket names. This is a security hygiene signal.
3. **State loss** — navigating away from a partially filled form loses entered data, which is disruptive when users need to retrieve credentials from another tab.

## Goals / Non-Goals

**Goals:**
- Server-side S3 connectivity test using the entered credentials before save is allowed
- Block the Save action until the test passes for the current credential values
- Detect and warn about excess `ListAllMyBuckets` permission; allow user to acknowledge and proceed
- Persist form state in `sessionStorage` so users can navigate away and return without data loss
- Clear persisted state on successful save or explicit cancel

**Non-Goals:**
- Testing credentials for sources other than S3
- Storing test results permanently or exposing test history
- Blocking save if only the warning (over-permission) is present and the user acknowledges it
- Auditing or revoking credentials — only surfacing the signal

## Decisions

### 1. Server-side test via a new `createServerFn`

The connection test must run server-side so credentials are never sent to a third-party from the browser. A new `testS3Connection` server function accepts the same fields as the create/update payload and performs two checks:
- `HeadBucket` on the specified bucket to verify access
- `ListBuckets` (catch-all) to detect `ListAllMyBuckets` permission

**Alternative considered**: A dedicated API route. Rejected because `createServerFn` is the established pattern in this codebase and avoids a separate fetch endpoint.

### 2. AWS SDK (`@aws-sdk/client-s3`) for the server function

The `@aws-sdk/client-s3` package provides typed S3 clients. It runs server-side only inside the server function so it does not inflate the client bundle.

**Alternative considered**: Raw `fetch` against the S3 REST API with manual SigV4 signing. Rejected — error-prone and fragile vs. the maintained SDK.

### 3. Test result gates Save; re-test required on credential change

The form tracks a `testResult` state (`idle | pending | passed | failed`). Save is enabled only when `testResult === 'passed'`. Any change to `accessKeyId`, `secretAccessKey`, `bucket`, or `region` resets `testResult` to `idle`, requiring a re-test. Non-credential fields (`name`, `prefix`) do not reset the test.

**Alternative considered**: Allow save with a stale passing test. Rejected — a user could test with valid credentials then swap them before saving.

### 4. Over-permission warning is a soft block

When the test passes but `ListBuckets` succeeded (user has `s3:ListAllMyBuckets`), the UI shows an inline warning banner. The Save button remains disabled until the user explicitly checks an acknowledgement checkbox. This is not a hard block — the user can always acknowledge and proceed.

### 5. `sessionStorage` for form persistence

`sessionStorage` is scoped to the browser tab, so it does not leak between sessions or devices. The form serialises its state (all fields except `secretAccessKey` — see below) to a single `sessionStorage` key on every change. On mount, if a matching key exists, the form restores from it.

**Credential handling**: `secretAccessKey` is intentionally excluded from `sessionStorage` because storing a plaintext secret in browser storage is a security risk. If the user navigates away and returns, only the non-secret fields are restored; the user must re-enter the secret and re-run the test.

**Alternative considered**: `localStorage` for cross-session persistence. Rejected — a tab-scoped store is sufficient and reduces the window of exposure.

## Risks / Trade-offs

- **Test latency** — S3 `HeadBucket` adds a network round-trip (typically 100–500 ms). The test button shows a spinner during the check. → Acceptable UX cost; no mitigation needed.
- **Temporary credentials / IAM role restrictions** — some AWS environments restrict `HeadBucket` even for valid credentials. The error message from the test will surface the AWS error code so users can diagnose. → No mitigation; surfacing the raw error is the right behaviour.
- **Secret not persisted across navigation** — users must re-enter the secret on return. This is intentional (security trade-off) but is a UX friction point. A note is shown in the form explaining this. → Accepted trade-off; documented in the UI.
- **sessionStorage size** — form data is small (< 1 KB); no concern.
