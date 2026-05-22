## ADDED Requirements

### Requirement: Source config form persists non-secret fields to sessionStorage
The system SHALL serialize the current form state (excluding `secretAccessKey`) to `sessionStorage` under a stable key on every field change, allowing the user to navigate away and return without losing entered data.

#### Scenario: Form state is saved on field change
- **WHEN** a user types into any form field while the inline form is open
- **THEN** the form state (all fields except `secretAccessKey`) is written to `sessionStorage`

#### Scenario: Form state is restored on remount
- **WHEN** a user navigates away from `/settings/sources` and returns while the browser tab is still open
- **THEN** the inline form reopens automatically with the previously entered non-secret values restored

#### Scenario: Secret access key is never persisted
- **WHEN** form state is written to `sessionStorage`
- **THEN** the `secretAccessKey` field value is absent from the stored data

### Requirement: Persisted form state is cleared on successful save or cancel
The system SHALL remove the `sessionStorage` entry for the source config form when the user successfully saves or explicitly cancels the form.

#### Scenario: Successful save clears persisted state
- **WHEN** a source config is successfully created or updated
- **THEN** the `sessionStorage` key for the form is removed

#### Scenario: Cancel clears persisted state
- **WHEN** a user clicks the "Cancel" button on the inline form
- **THEN** the `sessionStorage` key for the form is removed and the form closes

### Requirement: A note informs the user that the secret is not persisted across navigation
The system SHALL display a visible note on form restore informing the user that the secret access key must be re-entered because it was not saved.

#### Scenario: Note is shown when form is restored from sessionStorage
- **WHEN** the form reopens with state restored from `sessionStorage`
- **THEN** a note is visible near the secret access key field explaining that the secret must be re-entered
