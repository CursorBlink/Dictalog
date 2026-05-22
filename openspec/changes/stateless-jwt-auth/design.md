## Context

The web app currently uses Better Auth with its default session mechanism: on sign-in, a session record is written to PostgreSQL and an opaque session ID is stored in a cookie. Every authenticated request hits the database to validate the session.

The goal is to move to stateless JWT authentication. Better Auth ships a first-party `jwt` plugin that replaces the opaque session ID with a signed JWT — the token is still delivered in the cookie for web SSR, but its payload is self-contained and can be verified by any service that knows the signing secret, including a future mobile API backend.

Constraints:
- We must not break the existing web sign-in/sign-out/`useSession()` flows.
- The Prisma adapter compatibility issue with Better Auth (model lookup) is already present and out of scope here.
- `BETTER_AUTH_SECRET` is already required and will double as the JWT signing secret.

## Goals / Non-Goals

**Goals:**
- Issue signed JWTs on authentication so tokens are self-contained and stateless
- Expose `/api/auth/token` for mobile clients to obtain bearer JWTs via credentials
- Keep web cookie-based flow intact (JWT embedded in cookie, SSR still works)
- Support token refresh without a DB round-trip on every request

**Non-Goals:**
- Building the mobile app itself
- Implementing a separate API gateway or middleware for mobile
- Migrating away from the Prisma session table entirely (Better Auth still writes refresh token records)
- Role-based access control or fine-grained permissions

## Decisions

### 1. Use Better Auth's built-in `jwt` plugin rather than a custom JWT library

**Decision**: Add `jwt()` from `better-auth/plugins` to the server config and `jwtClient()` to the client config.

**Rationale**: Better Auth's JWT plugin integrates with the existing session lifecycle (sign-in, sign-out, refresh) without requiring a custom token issuance layer. It handles token signing, rotation, and cookie embedding automatically.

**Alternative considered**: Using `jsonwebtoken` directly with custom middleware — rejected because it would require duplicating session management logic and lose Better Auth's built-in CSRF and cookie security handling.

### 2. Keep the session cookie for web; expose bearer token endpoint for mobile

**Decision**: The JWT is embedded in the existing Better Auth session cookie for web SSR. Mobile clients use `/api/auth/sign-in/email` (returns JWT in response body when the `jwt` plugin is active) or a dedicated token endpoint.

**Rationale**: No web-side changes to how cookies are set or read. SSR continues to work via `auth.api.getSession()`. Mobile clients receive the raw JWT they can attach as `Authorization: Bearer <token>`.

**Alternative considered**: Separate token issuance endpoint — Better Auth's JWT plugin already adds this; no custom route needed.

### 3. JWT signing secret reuses `BETTER_AUTH_SECRET`

**Decision**: No new environment variable. The existing `BETTER_AUTH_SECRET` is used as the JWT signing key.

**Rationale**: Fewer secrets to rotate; the secret is already required and documented.

## Risks / Trade-offs

- **Token revocation** → JWTs are stateless; a compromised access token is valid until expiry. Mitigation: keep access token TTL short (15 min default in Better Auth JWT plugin); refresh tokens remain in DB and can be revoked.
- **Token size** → JWTs in cookies are larger than opaque IDs, which may push past the 4KB cookie limit if many custom claims are added. Mitigation: keep JWT payload minimal (sub, iat, exp, email only).
- **Secret rotation** → Rotating `BETTER_AUTH_SECRET` invalidates all outstanding JWTs. Mitigation: document this clearly; plan a coordinated rotation with a brief re-login window.
- **Better Auth Prisma adapter compatibility** → Known issue already present in codebase; JWT plugin does not change this surface.

## Migration Plan

1. Install the `jwt` plugin (already bundled with `better-auth` — no new package needed in most versions; verify with `better-auth` changelog).
2. Update `src/lib/auth.ts` to add `jwt()` plugin.
3. Update `src/lib/auth-client.ts` to add `jwtClient()` plugin.
4. Smoke-test web sign-in/sign-out and `useSession()`.
5. Test mobile token flow: `POST /api/auth/sign-in/email` → extract JWT → call a protected route with `Authorization: Bearer`.
6. Rollback: remove the two plugin entries; existing session cookies will require re-login but no data is lost.

## Open Questions

- Should the JWT payload include custom claims (e.g., user role) for the mobile API? If so, add a `customJwtPayload` hook in the `jwt()` plugin config.
- What is the desired access token TTL? Default is 15 minutes — confirm with product.
