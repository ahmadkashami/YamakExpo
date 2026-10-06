import { apiGet } from './http-client';

/**
 * One remote onboarding slide.
 *
 * Backend source: `Api\Mobile\OnboardingController@show` — `slides` maps each
 * `OnboardingSlide` to `{ id, order (sort_order), title (localized), description
 * (localized), imageUrl }`. Localization follows the normal api-group language
 * resolution (`?lang` / `Accept-Language`, owned by `SetLocale`), so `title` and
 * `description` arrive already localised — the mobile app never translates them.
 *
 * `imageUrl` is the absolute Cloudinary URL, or `null` when the slide has no
 * image — the screen must render a graceful placeholder, never crash.
 */
export type OnboardingSlide = {
  id: number;
  order: number;
  title: string;
  description: string;
  imageUrl: string | null;
};

/**
 * Active (enabled) payload, inside the `response()->success()` `data` envelope.
 *
 * These keys exist ONLY when `enabled` is true. The disabled payload contains
 * only `enabled: false` — never invent a `version`/`skippable`/`slides` default
 * for a disabled or missing onboarding.
 */
export type ActiveOnboardingConfig = {
  enabled: true;
  version: number;
  skippable: boolean;
  slides: OnboardingSlide[];
};

export type DisabledOnboardingConfig = {
  enabled: false;
};

export type OnboardingConfig = ActiveOnboardingConfig | DisabledOnboardingConfig;

/**
 * `GET /onboarding` response. The backend `response()->success()` macro always
 * emits `{ success, message, data, errors: null }`; the config lives under
 * `data`. `data` may also be `null`/absent on malformed upstream bodies — the
 * consumer treats anything that is not a well-formed enabled config as
 * disabled (fail-open).
 */
export type OnboardingResponse = {
  success: boolean;
  message: string;
  data: OnboardingConfig | null;
  errors: null;
};

/**
 * `GET /onboarding` — public (no auth middleware; the shared client still sends
 * the bearer token when one exists, which is harmless).
 *
 * Returns the single active published onboarding, or `{ enabled: false }` when
 * none is active. Reused for the whole `enabled`/`version`/`skippable`/`slides`
 * contract and consumed at every authenticated app startup.
 */
export function getOnboarding(): Promise<OnboardingResponse> {
  return apiGet<OnboardingResponse>('onboarding');
}