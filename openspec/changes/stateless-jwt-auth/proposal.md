## Why

The current Better Auth setup uses server-side sessions stored in the database, which ties authentication state to a single backend. Switching to JWT-based stateless auth allows the same tokens to be verified by a future mobile API without sharing session storage, enabling a unified auth layer across web and mobile clients.

## What Changes

- Enable Better Auth's JWT plugin so access tokens are issued as signed JWTs instead of opaque session IDs
- Configure token expiry, signing secret, and refresh-token rotation
- Update the auth server config (`src/lib/auth.ts`) to use the `jwt` plugin
- Update the auth client config (`src/lib/auth-client.ts`) to use `inferAdditionalFields` / JWT-aware client helpers if needed
- Expose a `/api/auth/token` endpoint (handled automatically by Better Auth JWT plugin) that mobile clients can use to obtain/refresh JWTs
- Ensure existing web session behaviour (cookie-based for SSR) continues to work via Better Auth's dual-mode support (JWT payload carried in cookie)

## Capabilities

### New Capabilities

- `jwt-auth`: Stateless JWT issuance, verification, and refresh via Better Auth's JWT plugin — covers server config, signing, token endpoint, and client-side token handling

### Modified Capabilities

<!-- No existing spec files exist yet — no delta specs needed -->

## Impact

- `web/src/lib/auth.ts` — add `jwt()` plugin from `better-auth/plugins`
- `web/src/lib/auth-client.ts` — add `jwtClient()` plugin if needed for token access on client
- `web/.env` — may need `BETTER_AUTH_SECRET` confirmed (already required) and optional `JWT_EXPIRES_IN`
- Existing web auth flows (sign-in, sign-out, `useSession`) continue unchanged; JWT is embedded in the session cookie automatically
- Future mobile API consumers can call `/api/auth/token` with credentials to receive a bearer JWT
