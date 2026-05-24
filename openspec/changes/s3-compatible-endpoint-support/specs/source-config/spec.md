## MODIFIED Requirements

### Requirement: Add and edit forms render inline on the page
The system SHALL display the source config form inline on the `/settings/sources` page — no Dialog, Sheet, or other overlay. Clicking "Add Source" or "Edit" SHALL reveal the form within the page content area. The form SHALL include a "Test Connection" button and SHALL gate the "Save" button on a passing connection test for the current credential values. If persisted state is found in `sessionStorage` on page load, the form SHALL reopen automatically with the restored non-secret fields.

#### Scenario: Add form appears inline
- **WHEN** a user clicks "Add Source"
- **THEN** a form renders inline on the page with all S3 fields (name, bucket, region, access key ID, secret access key, optional endpoint, optional force path style toggle, optional TLS verify toggle, optional prefix) plus a "Test Connection" button and a disabled "Save" button

#### Scenario: Edit form appears inline pre-populated
- **WHEN** a user clicks "Edit" on a source config card
- **THEN** the form renders inline with all fields pre-populated and the "Save" button disabled until a connection test is run

#### Scenario: Cancelling the form hides it
- **WHEN** a user clicks "Cancel" on the inline form
- **THEN** the form disappears, the list is restored without changes, and any `sessionStorage` draft is cleared

#### Scenario: Form restores from sessionStorage on navigation return
- **WHEN** a user returns to `/settings/sources` and a `sessionStorage` draft exists
- **THEN** the inline form reopens with the previously entered non-secret fields restored and the "Save" button disabled pending a new test

### Requirement: User can add an S3 source configuration
The system SHALL allow creation of a new S3 source configuration with fields: name (required), bucket (required), region (required), access key ID (required), secret access key (required), endpoint (optional), forcePathStyle (optional boolean, default false), tlsVerify (optional boolean, default true), prefix (optional).

#### Scenario: Successful S3 config creation with defaults
- **WHEN** a user fills in all required fields and submits the inline form without setting optional advanced fields
- **THEN** the new source config is saved to the database and connects to AWS using virtual-hosted style with TLS verification enabled

#### Scenario: S3 config created with custom endpoint and path style
- **WHEN** a user fills in all required fields plus an endpoint URL and enables forcePathStyle
- **THEN** the new source config is saved with `endpoint` and `forcePathStyle: true` stored in the `config` JSON

#### Scenario: S3 config created with TLS verification disabled
- **WHEN** a user enables the "Disable TLS verification" toggle and submits
- **THEN** the source config is saved with `tlsVerify: false` in the `config` JSON

#### Scenario: Zod validation prevents invalid submissions
- **WHEN** a user submits the form with any required field empty or invalid
- **THEN** the system displays field-level validation errors via `FieldError` and does not call the server

### Requirement: User can edit an existing source configuration
The system SHALL allow editing of name, bucket, region, access key ID, endpoint, forcePathStyle, tlsVerify, prefix, and secret access key for an existing config.

#### Scenario: Secret access key is masked on edit form load
- **WHEN** the edit form loads
- **THEN** the secret access key field shows a masked placeholder (e.g., `••••••••`) and does not transmit the existing value to the client

#### Scenario: Secret access key update is optional
- **WHEN** a user submits the edit form with the secret access key field left as its masked placeholder
- **THEN** the server retains the existing secret access key value unchanged

#### Scenario: Successful edit saves changes
- **WHEN** a user modifies fields and submits the edit form
- **THEN** the source config is updated in the database and the list reflects the new values

### Requirement: Save is gated on a passing connection test
The system SHALL disable the "Save" button until the user has run the connection test and it has returned a passing result for the current values of `bucket`, `region`, `accessKeyId`, `secretAccessKey`, `endpoint`, `forcePathStyle`, and `tlsVerify`. Changing any of those seven fields after a passing test SHALL reset the test result and re-disable Save.

#### Scenario: Save is disabled before any test is run
- **WHEN** the inline form is open and no test has been run
- **THEN** the "Save" button is disabled

#### Scenario: Save is enabled after a passing test
- **WHEN** the user clicks "Test Connection" and the test succeeds (with or without the over-permission warning acknowledged)
- **THEN** the "Save" button becomes enabled

#### Scenario: Changing a credential or connection field resets the test
- **WHEN** the user modifies `bucket`, `region`, `accessKeyId`, `secretAccessKey`, `endpoint`, `forcePathStyle`, or `tlsVerify` after a passing test
- **THEN** the test result resets to idle and the "Save" button is re-disabled

#### Scenario: Changing a non-connection field does not reset the test
- **WHEN** the user modifies `name` or `prefix` after a passing test
- **THEN** the test result remains passing and the "Save" button stays enabled

### Requirement: TLS verification disabled warning is shown in the form
The system SHALL display a visible warning when the "Disable TLS verification" option is enabled, informing the user of the security implications.

#### Scenario: Warning is shown when TLS verification is disabled
- **WHEN** a user enables the "Disable TLS verification" toggle in the form
- **THEN** an inline warning message is displayed explaining that disabling TLS verification exposes the connection to potential man-in-the-middle attacks

#### Scenario: Warning is hidden when TLS verification is enabled
- **WHEN** the "Disable TLS verification" toggle is off (default)
- **THEN** no TLS warning is displayed

## ADDED Requirements

### Requirement: Source card displays advanced connection options when non-default
The system SHALL display the endpoint value on the source config card when it is set, and SHALL display badges or indicators for `forcePathStyle` and `tlsVerify: false` when those non-default values are stored.

#### Scenario: Card shows endpoint for S3-compatible source
- **WHEN** a source config with a non-empty endpoint is displayed in the list
- **THEN** the card shows the endpoint value in the config detail section

#### Scenario: Card omits endpoint row for AWS sources
- **WHEN** a source config has no endpoint value stored
- **THEN** no endpoint row is displayed on the card

#### Scenario: Card indicates when forcePathStyle is enabled
- **WHEN** a source config has `forcePathStyle: true` stored
- **THEN** the card displays a "Path Style" indicator

#### Scenario: Card indicates when TLS verification is disabled
- **WHEN** a source config has `tlsVerify: false` stored
- **THEN** the card displays a "TLS Unverified" indicator
