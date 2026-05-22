## ADDED Requirements

### Requirement: JWT plugin enabled on auth server
The system SHALL configure Better Auth with the `jwt()` plugin so that all issued sessions include a signed JWT access token alongside the standard session cookie.

#### Scenario: Sign-in produces a JWT
- **WHEN** a user submits valid email and password to the sign-in endpoint
- **THEN** the response SHALL include a signed JWT access token in the session payload

#### Scenario: JWT is verifiable without a database round-trip
- **WHEN** a service receives a JWT access token
- **THEN** the service SHALL be able to verify its authenticity using only `BETTER_AUTH_SECRET` without querying the database

### Requirement: JWT client plugin configured
The system SHALL configure the Better Auth React client with the `jwtClient()` plugin so the client can access the raw JWT token.

#### Scenario: Client can retrieve the current JWT
- **WHEN** a user is signed in on the web
- **THEN** `authClient.getSession()` SHALL expose the JWT access token in its response

### Requirement: Mobile clients can obtain a bearer JWT
The system SHALL allow mobile API consumers to authenticate via `POST /api/auth/sign-in/email` and receive a JWT access token in the response body suitable for use as a `Authorization: Bearer` header.

#### Scenario: Mobile sign-in with valid credentials
- **WHEN** a mobile client sends valid credentials to `POST /api/auth/sign-in/email`
- **THEN** the response body SHALL contain an `accessToken` field with a signed JWT

#### Scenario: Mobile sign-in with invalid credentials
- **WHEN** a mobile client sends invalid credentials to `POST /api/auth/sign-in/email`
- **THEN** the response SHALL return a 401 status with no token issued

### Requirement: Web session flows remain unaffected
The system SHALL continue to support cookie-based authentication for the web SSR application; adding JWT MUST NOT break existing sign-in, sign-out, or `useSession()` behaviour.

#### Scenario: Web sign-in still sets session cookie
- **WHEN** a user signs in via the web UI
- **THEN** the browser SHALL receive a session cookie and `useSession()` SHALL return the active session

#### Scenario: Web sign-out clears session
- **WHEN** a user signs out via the web UI
- **THEN** the session cookie SHALL be cleared and `useSession()` SHALL return null

### Requirement: Refresh token rotation
The system SHALL support refresh token rotation so that expired JWT access tokens can be exchanged for new ones without requiring re-authentication.

#### Scenario: Expired access token is refreshed
- **WHEN** a client calls the refresh endpoint with a valid refresh token
- **THEN** the system SHALL issue a new JWT access token and rotate the refresh token
