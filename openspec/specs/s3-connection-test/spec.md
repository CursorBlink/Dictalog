# s3-connection-test Specification

## Requirements

### Requirement: Server function tests S3 credentials before save
The system SHALL expose a `testS3Connection` server function that accepts `bucket`, `region`, `accessKeyId`, and `secretAccessKey` and returns a structured result: `{ success: boolean, errorCode?: string, errorMessage?: string, overPermissioned: boolean }`.

#### Scenario: Valid credentials with bucket access return success
- **WHEN** `testS3Connection` is called with credentials that can perform `HeadBucket` on the specified bucket
- **THEN** the function returns `{ success: true, overPermissioned: false }` (or `true` if `ListBuckets` also succeeds)

#### Scenario: Invalid credentials return failure with error details
- **WHEN** `testS3Connection` is called with credentials that fail `HeadBucket` (wrong key, wrong bucket, permissions denied)
- **THEN** the function returns `{ success: false, errorCode: <AWS error code>, errorMessage: <human-readable message> }`

#### Scenario: Unauthenticated call to test function is rejected
- **WHEN** `testS3Connection` is called without a valid session
- **THEN** the function throws an authentication error and performs no AWS calls

### Requirement: Server function detects over-permissioned credentials
The `testS3Connection` server function SHALL attempt `ListBuckets` after a successful `HeadBucket` call and set `overPermissioned: true` in the result if `ListBuckets` succeeds.

#### Scenario: Credentials with ListAllMyBuckets are flagged
- **WHEN** `testS3Connection` is called with credentials that succeed at both `HeadBucket` and `ListBuckets`
- **THEN** the function returns `{ success: true, overPermissioned: true }`

#### Scenario: Credentials without ListAllMyBuckets are not flagged
- **WHEN** `testS3Connection` is called with credentials where `ListBuckets` fails with `AccessDenied`
- **THEN** the function returns `{ success: true, overPermissioned: false }`

### Requirement: Credentials are not logged or persisted during the test
The `testS3Connection` server function SHALL NOT write the provided `secretAccessKey` or `accessKeyId` to any log, database, or cache — they are used only for the in-flight SDK call.

#### Scenario: Test does not write credentials to the database
- **WHEN** `testS3Connection` is called
- **THEN** no new records are created or updated in the `source_config` table as a side effect of the test
