import { apiGet, apiPatch } from './http-client';

/**
 * B4.2/B4.3/B4.4 — profile contract for the functional Edit Profile screen.
 *
 * The backend `appUserResource` exposes many more fields, but only the three
 * values the screen reads are modelled here. B4.4 adds a deliberately narrow
 * PATCH type for Name/Phone only; email, id, photo, location and all other
 * fields remain outside this screen's contract.
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

/**
 * B4.4 — only changed editable fields are sent. A cleared optional value is
 * sent as an explicit `null` because both backend fields are nullable.
 * Email, id, photo, location and every other field are never included.
 */
export type UpdateProfileRequest = {
  name?: string | null;
  phone?: string | null;
};

/** GET /api/mobile/v1/app-users/profile via the existing authenticated client. */
export function getUserProfile(): Promise<ProfileResponse> {
  return apiGet<ProfileResponse>('app-users/profile');
}

/** PATCH /api/mobile/v1/app-users/profile via the same authenticated client. */
export function updateUserProfile(payload: UpdateProfileRequest): Promise<ProfileResponse> {
  return apiPatch<ProfileResponse, UpdateProfileRequest>('app-users/profile', payload);
}
