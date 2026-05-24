## MODIFIED Requirements

### Requirement: Server function tests S3 credentials before save
The system SHALL expose a `testS3Connection` server function that accepts `bucket`, `region`, `accessKeyId`, `secretAccessKey`, and optional `endpoint`, `forcePathStyle`, and `tlsVerify`, and returns a structured result: `{ success: boolean, errorCode?: string, errorMessage?: string, overPermissioned: boolean }`. The `S3Client` SHALL be constructed with all provided options; absent options fall back to SDK defaults.

#### Scenario: Valid credentials with bucket access return success
- **WHEN** `testS3Connection` is called with credentials that can perform `HeadBucket` on the specified bucket
- **THEN** the function returns `{ success: true, overPermissioned: false }` (or `true` if `ListBuckets` also succeeds)

#### Scenario: Valid credentials against a custom endpoint with path style return success
- **WHEN** `testS3Connection` is called with a custom `endpoint`, `forcePathStyle: true`, and credentials that can perform `HeadBucket`
- **THEN** the function returns `{ success: true, overPermissioned: false }`

#### Scenario: Valid credentials against an endpoint with TLS verification disabled return success
- **WHEN** `testS3Connection` is called with a custom `endpoint`, `tlsVerify: false`, and valid credentials
- **THEN** the function constructs the `S3Client` with a custom HTTPS agent that disables certificate verification and returns `{ success: true, ... }` if the bucket is accessible

#### Scenario: Invalid credentials return failure with error details
- **WHEN** `testS3Connection` is called with credentials that fail `HeadBucket` (wrong key, wrong bucket, permissions denied)
- **THEN** the function returns `{ success: false, errorCode: <AWS error code>, errorMessage: <human-readable message> }`

#### Scenario: Unauthenticated call to test function is rejected
- **WHEN** `testS3Connection` is called without a valid session
- **THEN** the function throws an authentication error and performs no AWS calls
