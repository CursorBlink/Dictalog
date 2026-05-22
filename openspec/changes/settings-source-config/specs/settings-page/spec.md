## ADDED Requirements

### Requirement: Settings route exists and is auth-protected
The system SHALL expose a `/settings` route via `web/src/routes/_authenticated/settings.tsx` (directory convention, consistent with `_authenticated/dashboard.tsx`), nested under the `_authenticated` layout, ensuring unauthenticated users are redirected to `/login`.

#### Scenario: Unauthenticated access redirects to login
- **WHEN** an unauthenticated user navigates to `/settings`
- **THEN** the system redirects them to `/login` with a `redirect` search param

#### Scenario: Authenticated user can access settings
- **WHEN** an authenticated user navigates to `/settings`
- **THEN** the settings page renders with the app sidebar visible

### Requirement: Settings page uses the shared app sidebar layout
The system SHALL render the settings page inside `SidebarProvider` with `AppSidebar` and `SidebarInset`, consistent with the dashboard layout.

#### Scenario: Sidebar is present on settings page
- **WHEN** an authenticated user views any `/settings/*` route
- **THEN** the `AppSidebar` component is visible with a sidebar trigger in the header

### Requirement: Settings navigation includes a Sources link
The settings page header or sidebar navigation SHALL include a link to `/settings/sources`.

#### Scenario: Sources link navigates correctly
- **WHEN** a user clicks the "Sources" link on the settings page
- **THEN** the browser navigates to `/settings/sources`

### Requirement: Settings index redirects to sources
The `/settings` index SHALL redirect to `/settings/sources` so users land on a meaningful default.

#### Scenario: Navigating to /settings lands on sources
- **WHEN** a user navigates to `/settings`
- **THEN** they are redirected to `/settings/sources`
