import { apiGet } from './http-client';

/**
 * B4.2/B4.3 — read-only profile contract for the functional Edit Profile screen.
 *
 * Scope: GET only. The backend `appUserResource` exposes many more fields, but
 * only the three values the screen reads are modelled here. B4.3 edits Name and
 * Phone locally on the screen, so there is deliberately no PATCH request type
 * or update helper in this module. Do not add one without a separately approved
 * backend contract (see `REBUILD-PLAN.md` §9 and the B4.3 final report).
 */
export type ProfileUser = {
  /** Locally editable on /profile/edit; backend contract: nullable, max 255. */
  name?: string | null;
  /** Read-only on /profile/edit; this form never changes it. */
  email?: string | null;
  /** Locally editable on /profile/edit; backend contract: nullable, max 255. */
  phone?: string | null;
};

export type ProfileResponse = {
  /** Validated by the screen before any value is applied. */
  success: boolean;
  /** Optional backend message, not rendered by this screen. */
  message?: string;
  /** Null/unsuccessful payloads keep the AuthProvider-cached values. */
  data: ProfileUser | null;
};

/** GET /api/mobile/v1/app-users/profile via the existing authenticated client. */
export function getUserProfile(): Promise<ProfileResponse> {
  return apiGet<ProfileResponse>('app-users/profile');
}
