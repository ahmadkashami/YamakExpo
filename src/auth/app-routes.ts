/**
 * Phase A / Step A1 — session gate destination table.
 *
 * These live OUTSIDE `src/app/` on purpose: Expo Router treats every file in
 * the app directory as a potential route, so shared routing constants must not
 * be declared there.
 */

/**
 * Where an unauthenticated session is sent. Unchanged by A1 — the default
 * entry of the unauthenticated area is still Register.
 */
export const UNAUTHENTICATED_ENTRY_ROUTE = '/register';

/**
 * Where an authenticated session is sent by the gate.
 *
 * A1 originally pointed this at `/map` only because that was the one entry
 * route inside `(app)`; A3 created the real Home route
 * (`src/app/(app)/(tabs)/home.tsx`, href `/home`) and repointed it there. Both
 * the A1 cold-start gate (`src/app/index.tsx`) and the A2 post-OTP navigation
 * (`src/app/email-otp.tsx`) consume this single constant, so `/home` is the only
 * authenticated destination declared anywhere.
 *
 * A5 will add the `(tabs)` layout that turns `/home` and `/map` into tabs
 * without moving either file; this constant does not need to change again.
 */
export const AUTHENTICATED_ENTRY_ROUTE = '/home';