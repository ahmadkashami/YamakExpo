import * as SecureStore from 'expo-secure-store';

/**
 * A6.2E — backend-managed onboarding, local seen-version checkpoint.
 *
 * Storage supersedes the A6.2 boolean key `yamak_onboarding_completed`. The
 * backend owns onboarding content and its lifecycle (`version`); the device
 * only records WHICH version the user has already completed. Only this one key
 * is ever written by this module, and it is written ONLY by the explicit
 * Skip / Get Started completion action — never during screen mount.
 *
 * Obsolete boolean decision (spec §5): the old `yamak_onboarding_completed`
 * flag is deliberately NOT mapped to any version. It was never an
 * authoritative "version seen" record, so translating `true` into an arbitrary
 * backend version would fabricate a checkpoint the user may never have seen.
 * The new version key is authoritative; the obsolete key is simply ignored —
 * never read, never migrated, never deleted. Existing `true` values are inert.
 */
export const ONBOARDING_SEEN_VERSION_KEY = 'yamak_onboarding_seen_version';

/**
 * Parse the stored value:
 * - missing            → null
 * - positive-int string → number
 * - anything else      → null (invalid/corrupt treated as unseen)
 */
function parseSeenVersion(value: string | null): number | null {
  if (value === null) {
    return null;
  }

  const trimmed = value.trim();

  if (!/^[1-9]\d*$/.test(trimmed)) {
    return null;
  }

  const parsed = Number(trimmed);

  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

/**
 * Read the seen version. On SecureStore read failure we return `null` (unseen):
 * when a valid active backend version exists, the caller must show onboarding
 * because we cannot prove it was seen (spec §9 — local read failure does NOT
 * fail open; only remote failure fail-open applies).
 */
export async function getOnboardingSeenVersion(): Promise<number | null> {
  let value: string | null;

  try {
    value = await SecureStore.getItemAsync(ONBOARDING_SEEN_VERSION_KEY);
  } catch {
    return null;
  }

  return parseSeenVersion(value);
}

/**
 * Persist the seen version. Called only by the completion flow (Skip / Get
 * Started) BEFORE navigation state changes; it must resolve successfully before
 * the app may leave onboarding. Throws on write failure so the caller stays on
 * onboarding and never fakes an in-memory `seen` state (spec §19).
 */
export async function setOnboardingSeenVersion(version: number): Promise<void> {
  if (!Number.isSafeInteger(version) || version <= 0) {
    throw new Error('Seen version must be a positive integer');
  }

  await SecureStore.setItemAsync(ONBOARDING_SEEN_VERSION_KEY, String(version));
}