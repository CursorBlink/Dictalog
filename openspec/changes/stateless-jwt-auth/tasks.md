## 1. Verify Better Auth JWT Plugin Availability

- [x] 1.1 Check installed `better-auth` version and confirm `jwt` plugin is available in `better-auth/plugins`
- [x] 1.2 If not bundled, install the required package version or separate plugin package

## 2. Server Auth Config

- [x] 2.1 Import `jwt` from `better-auth/plugins` in `web/src/lib/auth.ts`
- [x] 2.2 Add `jwt()` to the `plugins` array in the `betterAuth({...})` config
- [x] 2.3 Confirm `BETTER_AUTH_SECRET` is set in `web/.env` (used as JWT signing secret)

## 3. Client Auth Config

- [x] 3.1 Import `jwtClient` from `better-auth/client/plugins` in `web/src/lib/auth-client.ts`
- [x] 3.2 Add `jwtClient()` to the `plugins` array in `createAuthClient({...})`

## 4. Smoke Test Web Flows

- [ ] 4.1 Start dev server and sign in via the web UI — confirm session cookie is set and `useSession()` returns a valid session
- [ ] 4.2 Sign out and confirm `useSession()` returns null and cookie is cleared
- [ ] 4.3 Confirm no regressions on the dashboard route (auth guard still works)

## 5. Smoke Test Mobile Token Flow

- [ ] 5.1 Use `curl` or a REST client to `POST /api/auth/sign-in/email` with valid credentials and confirm the response body includes an `accessToken` JWT field
- [ ] 5.2 Decode the JWT (e.g. via jwt.io) and verify it contains `sub`, `iat`, and `exp` claims
- [ ] 5.3 Test `POST /api/auth/sign-in/email` with invalid credentials and confirm a 401 is returned with no token

## 6. Token Refresh Verification

- [ ] 6.1 Call the Better Auth refresh endpoint with a valid refresh token and confirm a new JWT access token is issued
- [ ] 6.2 Confirm the old refresh token is rotated (invalidated after use)
