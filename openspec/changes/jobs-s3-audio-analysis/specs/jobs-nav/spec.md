## ADDED Requirements

### Requirement: Jobs navigation entry
The application SHALL include a "Jobs" entry in the main sidebar navigation that routes to the Jobs section.

#### Scenario: Jobs link visible in sidebar
- **WHEN** an authenticated user views any page
- **THEN** the sidebar SHALL display a "Jobs" navigation link

#### Scenario: Navigating to Jobs
- **WHEN** the user clicks the "Jobs" navigation link
- **THEN** the application SHALL navigate to the Jobs section and display the available job types

### Requirement: Jobs index redirects to first job
The Jobs index route SHALL redirect to the S3 Audio Analysis job page so users land on useful content.

#### Scenario: Visiting /jobs
- **WHEN** the user navigates to `/jobs`
- **THEN** the application SHALL redirect to `/jobs/s3-audio-analysis`
