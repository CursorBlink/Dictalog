## MODIFIED Requirements

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
