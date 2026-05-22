# source-config Specification

## Purpose
TBD - created by archiving change settings-source-config. Update Purpose after archive.
## Requirements
### Requirement: SourceConfig Prisma model stores user source configurations
The system SHALL have a `SourceConfig` Prisma model with fields: `id`, `userId`, `name`, `type` (enum `SourceType`), `config` (Json), `createdAt`, `updatedAt`. The `SourceType` enum SHALL initially contain only `S3`.

#### Scenario: SourceConfig is user-scoped
- **WHEN** a source config is created
- **THEN** it is associated with the authenticated user's `userId` and not visible to other users

#### Scenario: SourceType enum exists with S3 value
- **WHEN** the Prisma schema is applied
- **THEN** the `source_config` table has a `type` column constrained to the `SourceType` enum

### Requirement: User can list their source configurations
The system SHALL display all source configurations belonging to the authenticated user on the `/settings/sources` page.

#### Scenario: Empty state when no configs exist
- **WHEN** a user with no source configs visits `/settings/sources`
- **THEN** the page shows an empty state message and an "Add Source" button

#### Scenario: Existing configs are listed
- **WHEN** a user with one or more source configs visits `/settings/sources`
- **THEN** each config is displayed with its name, type badge, and action buttons (edit, delete)

### Requirement: Add and edit forms render inline on the page
The system SHALL display the source config form inline on the `/settings/sources` page — no Dialog, Sheet, or other overlay. Clicking "Add Source" or "Edit" SHALL reveal the form within the page content area. The form SHALL include a "Test Connection" button and SHALL gate the "Save" button on a passing connection test for the current credential values. If persisted state is found in `sessionStorage` on page load, the form SHALL reopen automatically with the restored non-secret fields.

#### Scenario: Add form appears inline
- **WHEN** a user clicks "Add Source"
- **THEN** a form renders inline on the page with all S3 fields (name, bucket, region, access key ID, secret access key, optional prefix) plus a "Test Connection" button and a disabled "Save" button

#### Scenario: Edit form appears inline pre-populated
- **WHEN** a user clicks "Edit" on a source config card
- **THEN** the form renders inline with all fields pre-populated and the "Save" button disabled until a connection test is run

#### Scenario: Cancelling the form hides it
- **WHEN** a user clicks "Cancel" on the inline form
- **THEN** the form disappears, the list is restored without changes, and any `sessionStorage` draft is cleared

#### Scenario: Form restores from sessionStorage on navigation return
- **WHEN** a user returns to `/settings/sources` and a `sessionStorage` draft exists
- **THEN** the inline form reopens with the previously entered non-secret fields restored and the "Save" button disabled pending a new test

### Requirement: Save is gated on a passing connection test
The system SHALL disable the "Save" button until the user has run the connection test and it has returned a passing result for the current values of `bucket`, `region`, `accessKeyId`, and `secretAccessKey`. Changing any of those four fields after a passing test SHALL reset the test result and re-disable Save.

#### Scenario: Save is disabled before any test is run
- **WHEN** the inline form is open and no test has been run
- **THEN** the "Save" button is disabled

#### Scenario: Save is enabled after a passing test
- **WHEN** the user clicks "Test Connection" and the test succeeds (with or without the over-permission warning acknowledged)
- **THEN** the "Save" button becomes enabled

#### Scenario: Changing a credential field resets the test
- **WHEN** the user modifies `bucket`, `region`, `accessKeyId`, or `secretAccessKey` after a passing test
- **THEN** the test result resets to idle and the "Save" button is re-disabled

#### Scenario: Changing a non-credential field does not reset the test
- **WHEN** the user modifies `name` or `prefix` after a passing test
- **THEN** the test result remains passing and the "Save" button stays enabled

### Requirement: Test Connection button shows inline result and loading state
The system SHALL show a loading spinner on the "Test Connection" button while the test is in flight, and SHALL display an inline result message (success or failure with error details) after the test completes.

#### Scenario: Button shows spinner during test
- **WHEN** the user clicks "Test Connection" and the server function is pending
- **THEN** the button shows a loading indicator and is disabled to prevent duplicate calls

#### Scenario: Success result is shown inline
- **WHEN** the test returns `success: true`
- **THEN** an inline success message is displayed near the "Test Connection" button

#### Scenario: Failure result is shown with error details
- **WHEN** the test returns `success: false`
- **THEN** an inline error message is displayed with the `errorMessage` from the test result, and the "Save" button remains disabled

### Requirement: Over-permission warning requires acknowledgement before save
The system SHALL show a dismissible inline warning when the connection test succeeds but `overPermissioned: true` is returned. The "Save" button SHALL remain disabled until the user checks an acknowledgement checkbox, after which save proceeds normally.

#### Scenario: Warning is shown when credentials are over-permissioned
- **WHEN** the test returns `{ success: true, overPermissioned: true }`
- **THEN** an inline warning banner is shown explaining that the credentials can list all buckets, and a checkbox is shown for acknowledgement

#### Scenario: Save remains disabled until warning is acknowledged
- **WHEN** the over-permission warning is visible and the acknowledgement checkbox is unchecked
- **THEN** the "Save" button remains disabled

#### Scenario: Save is enabled after acknowledgement
- **WHEN** the user checks the acknowledgement checkbox after the over-permission warning appears
- **THEN** the "Save" button becomes enabled

#### Scenario: Warning and acknowledgement reset when credential fields change
- **WHEN** the user modifies `bucket`, `region`, `accessKeyId`, or `secretAccessKey` after a warning was shown
- **THEN** the warning is hidden, the acknowledgement checkbox is unchecked, and the "Save" button is re-disabled

### Requirement: User can add an S3 source configuration
The system SHALL allow creation of a new S3 source configuration with fields: name (required), bucket (required), region (required), access key ID (required), secret access key (required), prefix (optional).

#### Scenario: Successful S3 config creation
- **WHEN** a user fills in all required fields and submits the inline form
- **THEN** the new source config is saved to the database and appears in the list

#### Scenario: Zod validation prevents invalid submissions
- **WHEN** a user submits the form with any required field empty or invalid
- **THEN** the system displays field-level validation errors via `FieldError` and does not call the server

### Requirement: User can edit an existing source configuration
The system SHALL allow editing of name, bucket, region, access key ID, prefix, and secret access key for an existing config.

#### Scenario: Secret access key is masked on edit form load
- **WHEN** the edit form loads
- **THEN** the secret access key field shows a masked placeholder (e.g., `••••••••`) and does not transmit the existing value to the client

#### Scenario: Secret access key update is optional
- **WHEN** a user submits the edit form with the secret access key field left as its masked placeholder
- **THEN** the server retains the existing secret access key value unchanged

#### Scenario: Successful edit saves changes
- **WHEN** a user modifies fields and submits the edit form
- **THEN** the source config is updated in the database and the list reflects the new values

### Requirement: Secret fields are masked by default with a visibility toggle
All secret fields (secret access key) SHALL render as password inputs by default. A toggle button (eye / eye-off icon) SHALL be present to switch between masked and visible states.

#### Scenario: Secret field is masked on initial render
- **WHEN** the form renders with a secret field
- **THEN** the input type is `password` and the value is not readable

#### Scenario: User can reveal the secret field
- **WHEN** a user clicks the visibility toggle next to a secret field
- **THEN** the input type switches to `text` and the value becomes readable

#### Scenario: User can re-mask the secret field
- **WHEN** a user clicks the visibility toggle again
- **THEN** the input type returns to `password`

### Requirement: Zod schemas validate all source config input
The system SHALL define Zod schemas for source config input. These schemas SHALL be used for client-side validation (before submission) and server-side validation (inside server functions).

#### Scenario: Client-side Zod validation fires on submit
- **WHEN** a user submits the form with invalid data
- **THEN** Zod validation runs client-side, field errors are displayed, and the server function is not called

#### Scenario: Server-side Zod validation rejects malformed input
- **WHEN** a server function receives input that fails Zod validation
- **THEN** the server throws a validation error and no data is written to the database

### Requirement: User can delete a source configuration
The system SHALL allow users to delete a source config with a confirmation step.

#### Scenario: Delete button triggers confirmation
- **WHEN** a user clicks "Delete" on a source config card
- **THEN** the system asks for confirmation (e.g., inline confirm/cancel buttons) before proceeding

#### Scenario: Confirmed deletion removes the config
- **WHEN** a user confirms deletion
- **THEN** the source config is removed from the database and disappears from the list

### Requirement: Source config CRUD is enforced server-side per user
All create, read, update, and delete operations on source configs SHALL be performed via `createServerFn` and SHALL verify the authenticated user's session, only allowing access to configs owned by that user.

#### Scenario: Server function rejects unauthenticated requests
- **WHEN** a server function for source config CRUD is called without a valid session
- **THEN** the server throws an authentication error and no data is modified

