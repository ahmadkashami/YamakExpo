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
 * A1 deliberately does NOT decide the final post-OTP screen and does NOT
 * create a Home route. Its only job is to place an authenticated session
 * inside the `(app)` group, and `/map` is the one entry route that already
 * exists there. When A3 adds Home and A5 adds the tab layout, this constant is
 * repointed at that entry — no other A1 file needs to change.
 */
export const AUTHENTICATED_ENTRY_ROUTE = '/map';