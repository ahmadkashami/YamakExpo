import { apiGet } from './http-client';

/**
 * B4.2 — minimal read-only profile contract for the functional Edit Profile
 * route. The backend `appUserResource` returns many more fields; only the three
 * values this screen displays are modelled here. No PATCH contract is added.
 */
export type ProfileUser = {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
};

export type ProfileResponse = {
  success: boolean;
  message?: string;
  data: ProfileUser | null;
};

/** GET /api/mobile/v1/app-users/profile via the existing authenticated client. */
export function getUserProfile(): Promise<ProfileResponse> {
  return apiGet<ProfileResponse>('app-users/profile');
}
