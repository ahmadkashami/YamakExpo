import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  ApiError,
  getUserProfile,
  updateUserProfile,
  type ProfileUser,
  type RegisteredUser,
  type UpdateProfileRequest,
} from '@/api';
import { ApiErrorRow } from '@/components/home/ApiErrorRow';
import { BackIcon } from '@/components/vehicle-details/icons';
import { useAuth } from '@/auth';
import { colors, interactionOpacity, radius, spacing, typography } from '@/theme';

/**
 * B4.2/B4.3/B4.4 — functional Edit Profile route, NOT an approved final design.
 *
 * This is a direct child of `(app)`, so the existing auth/onboarding gate in
 * `(app)/_layout.tsx` protects `/profile/edit`. It deliberately sits outside
 * `(drawer)/(tabs)`: like `/my-requests`, it owns a simple app bar instead of
 * rebuilding the tab/drawer frame.
 *
 * B4.4 adds a local Save action: PATCH only changed Name/Phone, then refresh the
 * AuthProvider user and its persisted snapshot without touching the access
 * token. Email, photo, location and all other profile fields stay out of scope.
 *
 * Comment map: `initialValues` is the loaded baseline, `draft` is what the user
 * sees and types into, `dirtyRef` guards drafts from late GET replies, and
 * `stateEpochRef` drops GET replies that predate a successful save.
 */

type ProfileValues = {
  name: string | null;
  phone: string | null;
  email: string | null;
};

type EditableField = 'name' | 'phone';

type EditableDraft = {
  name: string;
  phone: string;
};

type DirtyFields = Record<EditableField, boolean>;

type FieldErrors = Partial<Record<EditableField, string | null>>;

type SavedEditableValues = {
  name: string | null;
  phone: string | null;
};

const MAX_FIELD_LENGTH = 255;
const MISSING_VALUE = 'Not provided';
const LENGTH_ERROR = `Maximum ${MAX_FIELD_LENGTH} characters`;
const UNEXPECTED_RESPONSE_MESSAGE = 'Unexpected server response';
const VALIDATION_MESSAGE = 'Please check the highlighted fields.';

function readValue(value: string | null | undefined): string | null {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return null;
  }
  return value.trim();
}

/** A null optional value becomes an empty, clearly placeholder-backed input. */
function toEditableValue(value: string | null): string {
  return value ?? '';
}

function valuesFromAuth(user: RegisteredUser | null): ProfileValues {
  return {
    name: readValue(user?.name),
    phone: readValue(user?.phone),
    email: readValue(user?.email),
  };
}

/**
 * The GET response is the loaded baseline. An absent key keeps the cached
 * value; an explicit null/empty string is a genuinely missing optional value.
 * The caller decides whether to apply it to each draft field.
 */
function reconcileProfile(profile: ProfileUser, cached: ProfileValues): ProfileValues {
  return {
    name: profile.name === undefined ? cached.name : readValue(profile.name),
    phone: profile.phone === undefined ? cached.phone : readValue(profile.phone),
    email: profile.email === undefined ? cached.email : readValue(profile.email),
  };
}

/** Backend contract is nullable|string|max:255 — no mandatory phone format. */
function getLengthError(value: string): string | null {
  return value.length > MAX_FIELD_LENGTH ? LENGTH_ERROR : null;
}

/**
 * B4.4 — compare against the loaded baseline, not sticky dirty flags. A value
 * that is now empty is an explicit `null` because the backend fields are
 * nullable; unchanged fields are omitted entirely.
 */
function buildSavePayload(draft: EditableDraft, initial: ProfileValues): UpdateProfileRequest {
  const payload: UpdateProfileRequest = {};

  if (toEditableValue(initial.name) !== draft.name) {
    payload.name = draft.name.length === 0 ? null : draft.name;
  }
  if (toEditableValue(initial.phone) !== draft.phone) {
    payload.phone = draft.phone.length === 0 ? null : draft.phone;
  }

  return payload;
}

/** Reject malformed PATCH payloads instead of trusting the server envelope. */
function validateSavedProfile(data: ProfileUser | null): SavedEditableValues | null {
  if (typeof data !== 'object' || data === null) {
    return null;
  }
  if (data.name === undefined || data.phone === undefined) {
    return null;
  }
  if (data.name !== null && typeof data.name !== 'string') {
    return null;
  }
  if (data.phone !== null && typeof data.phone !== 'string') {
    return null;
  }

  return {
    name: data.name === null || data.name.length === 0 ? null : data.name,
    phone: data.phone === null || data.phone.length === 0 ? null : data.phone,
  };
}

/**
 * The backend renders 422 as `errors.details: [{ field, message }]`. Only short,
 * single-line messages are surfaced so framework debug text cannot leak in.
 */
function getServerFieldError(body: unknown, field: EditableField): string | null {
  if (typeof body !== 'object' || body === null) {
    return null;
  }

  const errors = (body as { errors?: unknown }).errors;
  if (typeof errors !== 'object' || errors === null) {
    return null;
  }

  const details = (errors as { details?: unknown }).details;
  if (!Array.isArray(details)) {
    return null;
  }

  const messages = details
    .filter(
      (detail): detail is { field?: unknown; message?: unknown } =>
        typeof detail === 'object' && detail !== null && !Array.isArray(detail),
    )
    .filter(detail => detail.field === field)
    .map(detail => detail.message)
    .filter(
      (message): message is string =>
        typeof message === 'string' &&
        message.trim().length > 0 &&
        message.trim().length <= 160 &&
        !/[\r\n]/.test(message),
    )
    .map(message => message.trim());

  return messages.length > 0 ? messages.join(' ') : null;
}

function FieldError({ message }: { message: string | null }) {
  if (message === null) {
    return null;
  }

  return (
    <View style={styles.fieldError} accessibilityRole="alert" accessibilityLiveRegion="polite">
      <Text style={styles.fieldErrorText}>{message}</Text>
    </View>
  );
}

function ReadOnlyValueRow({
  label,
  value,
  testID,
  last = false,
}: {
  label: string;
  value: string | null;
  testID: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.row, !last && styles.rowDivider]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text
        testID={testID}
        accessibilityRole="text"
        accessibilityLabel={`${label}: ${value ?? MISSING_VALUE}`}
        style={styles.readOnlyValue}
      >
        {value ?? MISSING_VALUE}
      </Text>
    </View>
  );
}

function EditableFieldRow({
  label,
  value,
  error,
  dirty,
  onChangeText,
  keyboardType,
  testID,
}: {
  label: string;
  value: string;
  error: string | null;
  dirty: boolean;
  onChangeText: (value: string) => void;
  keyboardType: 'default' | 'phone-pad';
  testID: string;
}) {
  const accessibilityLabel = `${label}${dirty ? ', edited' : ''}${
    error === null ? '' : `, ${error}`
  }`;

  return (
    <View style={[styles.row, styles.rowDivider]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={[styles.inputContainer, error !== null && styles.inputContainerInvalid]}>
        <TextInput
          testID={testID}
          accessibilityLabel={accessibilityLabel}
          value={value}
          onChangeText={onChangeText}
          placeholder={MISSING_VALUE}
          placeholderTextColor={colors.placeholder}
          selectionColor={colors.navy}
          keyboardType={keyboardType}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={MAX_FIELD_LENGTH}
          style={styles.input}
        />
      </View>
      <FieldError message={error} />
    </View>
  );
}

export default function EditProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, updateUser } = useAuth();

  // AuthProvider values are available before the first render; keep the
  // baseline object stable so it does not trigger needless GET effects.
  const authValues = useMemo(() => valuesFromAuth(user), [user]);

  // Three separate concerns (do not merge them):
  // 1. initialValues = loaded baseline, also the source for read-only Email.
  // 2. draft         = current editable Name/Phone strings shown in the inputs.
  // 3. dirty + ref   = per-field "user has typed here" flags. The ref is updated
  //                   synchronously so a late GET can read it before re-render.
  const [initialValues, setInitialValues] = useState<ProfileValues>(() => ({ ...authValues }));
  const [draft, setDraft] = useState<EditableDraft>(() => ({
    name: toEditableValue(authValues.name),
    phone: toEditableValue(authValues.phone),
  }));
  const [dirty, setDirty] = useState<DirtyFields>(() => ({ name: false, phone: false }));
  const dirtyRef = useRef<DirtyFields>({ name: false, phone: false });

  const [isLoading, setIsLoading] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [attempt, setAttempt] = useState(0);

  // B4.4 save state. savingRef blocks duplicate presses before React re-renders;
  // stateEpochRef invalidates GET replies issued before a successful save.
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [saveError, setSaveError] = useState<ApiError | null>(null);
  const [serverFieldErrors, setServerFieldErrors] = useState<FieldErrors>({});
  const savingRef = useRef(false);
  const stateEpochRef = useRef(0);

  const markDirty = useCallback((field: EditableField) => {
    if (dirtyRef.current[field]) {
      return;
    }
    const next = { ...dirtyRef.current, [field]: true };
    dirtyRef.current = next;
    setDirty(next);
  }, []);

  const updateDraft = useCallback(
    (field: EditableField, value: string) => {
      markDirty(field);
      setDraft(current => ({ ...current, [field]: value }));
      setIsSaved(false);
      setServerFieldErrors(current => {
        if (current[field] === undefined) {
          return current;
        }
        const next = { ...current };
        delete next[field];
        return next;
      });
    },
    [markDirty],
  );

  /**
   * Called only after a successful GET. The baseline always refreshes, but a
   * draft field is replaced only while it is still pristine — this is the
   * late-response guard required by B4.3. Retry reuses the same guard.
   */
  const applyLoadedValues = useCallback((nextValues: ProfileValues) => {
    setInitialValues(nextValues);
    setDraft(current => ({
      name: dirtyRef.current.name ? current.name : toEditableValue(nextValues.name),
      phone: dirtyRef.current.phone ? current.phone : toEditableValue(nextValues.phone),
    }));
  }, []);

  useEffect(() => {
    let active = true;
    const epoch = stateEpochRef.current;

    async function load() {
      try {
        const response = await getUserProfile();
        if (!active || epoch !== stateEpochRef.current) {
          return;
        }
        if (!response.success || response.data === null) {
          throw new ApiError('http', 'Profile could not be loaded.', { body: response });
        }
        applyLoadedValues(reconcileProfile(response.data, authValues));
        setIsLoaded(true);
        setError(null);
      } catch (cause) {
        if (!active || epoch !== stateEpochRef.current) {
          return;
        }
        setIsLoaded(false);
        setError(cause instanceof ApiError ? cause : ApiError.network(cause));
      } finally {
        if (active && epoch === stateEpochRef.current) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [attempt, authValues, applyLoadedValues]);

  const retry = useCallback(() => {
    setError(null);
    setIsLoading(true);
    setAttempt(current => current + 1);
  }, []);

  // B4.4: drafts may still be discarded on exit; leaving does not save.
  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/profile');
    }
  }, [router]);

  // B4.3: only the confirmed max:255 contract is enforced. No phone format
  // rule and no mandatory value — both backend fields are nullable.
  const localNameError = getLengthError(draft.name);
  const localPhoneError = getLengthError(draft.phone);
  const nameError = localNameError ?? serverFieldErrors.name ?? null;
  const phoneError = localPhoneError ?? serverFieldErrors.phone ?? null;

  const savePayload = useMemo(() => buildSavePayload(draft, initialValues), [draft, initialValues]);
  const hasChanges = Object.keys(savePayload).length > 0;
  const canSave =
    isLoaded &&
    !isLoading &&
    !isSaving &&
    user !== null &&
    hasChanges &&
    nameError === null &&
    phoneError === null;

  const handleSave = useCallback(async () => {
    if (!canSave || savingRef.current) {
      return;
    }

    savingRef.current = true;
    setIsSaving(true);
    setIsSaved(false);
    setSaveError(null);
    setServerFieldErrors({});

    try {
      const response = await updateUserProfile(savePayload);
      if (!response.success || response.data === null) {
        throw new ApiError('http', UNEXPECTED_RESPONSE_MESSAGE, { body: response });
      }
      const saved = validateSavedProfile(response.data);
      if (saved === null || user === null) {
        throw new ApiError('http', UNEXPECTED_RESPONSE_MESSAGE, { body: response });
      }

      // Merge only Name/Phone; email, id and verification flags stay as-is.
      // RegisteredUser keeps these as strings, so an explicitly cleared value
      // is represented as '' in the auth snapshot while the form baseline keeps
      // the semantic null. Token, status and identity are untouched.
      const updatedUser: RegisteredUser = {
        ...user,
        name: saved.name ?? '',
        phone: saved.phone ?? '',
      };
      await updateUser(updatedUser);

      // Invalidate GETs started before the save, then re-baseline the form only
      // after persistence succeeded. A failed persistence keeps the draft.
      stateEpochRef.current += 1;
      const nextValues: ProfileValues = {
        name: saved.name,
        phone: saved.phone,
        email: initialValues.email,
      };
      setInitialValues(nextValues);
      setDraft({ name: toEditableValue(saved.name), phone: toEditableValue(saved.phone) });
      dirtyRef.current = { name: false, phone: false };
      setDirty({ name: false, phone: false });
      setIsSaved(true);
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 422) {
        setServerFieldErrors({
          name: getServerFieldError(cause.body, 'name'),
          phone: getServerFieldError(cause.body, 'phone'),
        });
        setSaveError(new ApiError('http', VALIDATION_MESSAGE, { status: 422, body: cause.body }));
      } else {
        setSaveError(cause instanceof ApiError ? cause : ApiError.network(cause));
      }
      // Draft and baseline are intentionally left untouched on failure.
    } finally {
      savingRef.current = false;
      setIsSaving(false);
    }
  }, [canSave, initialValues.email, savePayload, updateUser, user]);

  const noticeError = saveError ?? error;
  const noticeIsAuthError =
    noticeError !== null && (noticeError.status === 401 || noticeError.status === 403);

  return (
    <View style={styles.screen}>
      <View style={[styles.appBar, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
          onPress={goBack}
          style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
        >
          <BackIcon color={colors.subtitle} size={22} />
        </Pressable>
        <View style={styles.barCenter}>
          <Text numberOfLines={1} style={styles.appBarTitle}>
            Edit Profile
          </Text>
        </View>
        <View style={styles.iconButton} />
      </View>

      <ScrollView
        style={styles.contentScroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxl }]}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View
            accessibilityRole="text"
            accessibilityLabel="Checking your profile"
            style={styles.loadingRow}
          >
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.loadingText}>Checking your profile…</Text>
          </View>
        ) : null}

        <View style={styles.card}>
          {/* B4.3: local drafts only; keyboardType is the sole field-specific rule. */}
          <EditableFieldRow
            label="Name"
            value={draft.name}
            error={nameError}
            dirty={dirty.name}
            onChangeText={value => updateDraft('name', value)}
            keyboardType="default"
            testID="edit-profile-name"
          />
          <EditableFieldRow
            label="Phone"
            value={draft.phone}
            error={phoneError}
            dirty={dirty.phone}
            onChangeText={value => updateDraft('phone', value)}
            keyboardType="phone-pad"
            testID="edit-profile-phone"
          />
          {/* B4.3: Email is deliberately read-only and bound to the baseline. */}
          <ReadOnlyValueRow
            label="Email"
            value={initialValues.email}
            testID="edit-profile-email"
            last
          />
        </View>

        {/* B4.4: Save stays disabled until a loaded, valid, changed draft exists. */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Save profile"
          accessibilityState={{ disabled: !canSave, busy: isSaving }}
          disabled={!canSave}
          onPress={handleSave}
          style={({ pressed }) => [
            styles.saveButton,
            pressed && styles.saveButtonPressed,
            !canSave && styles.saveButtonDisabled,
            isSaving && styles.saveButtonSubmitting,
          ]}
        >
          {isSaving ? (
            <ActivityIndicator color={colors.brandText} size="small" />
          ) : (
            <Text style={styles.saveButtonLabel}>Save</Text>
          )}
        </Pressable>

        {isSaved ? (
          <View style={[styles.noticeCard, styles.successNotice]} accessibilityRole="alert">
            <Text style={styles.successTitle}>Profile saved</Text>
            <Text style={styles.successText}>Your name and phone were updated.</Text>
          </View>
        ) : null}

        {noticeError === null ? null : (
          <View style={styles.noticeCard}>
            {noticeIsAuthError ? (
              <>
                <Text style={styles.noticeTitle}>
                  {noticeError.status === 401 ? 'Session expired' : 'Not authorized'}
                </Text>
                <Text style={styles.noticeText}>
                  {noticeError.status === 401
                    ? 'Your session is no longer valid. Go back and sign in again.'
                    : saveError !== null
                      ? 'You do not have permission to change this profile.'
                      : 'You do not have permission to view this profile.'}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={goBack}
                  style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
                >
                  <Text style={styles.backButtonLabel}>Go back</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Text style={styles.noticeTitle}>
                  {saveError !== null
                    ? 'Profile could not be saved'
                    : 'Profile could not be refreshed'}
                </Text>
                <Text style={styles.noticeText}>
                  {saveError !== null
                    ? 'Your edits are still here. Check the highlighted fields and press Save again.'
                    : 'Showing the profile saved on this device. Check your connection and try again.'}
                </Text>
                {saveError === null ? (
                  <ApiErrorRow message={noticeError.message} onRetry={retry} />
                ) : null}
              </>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.phonePrefix,
  },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    minHeight: 52,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonPressed: {
    opacity: interactionOpacity.pressed,
  },
  barCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appBarTitle: {
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
    color: colors.title,
  },
  contentScroll: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  loadingText: {
    ...typography.caption,
    color: colors.subtitle,
    marginLeft: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.heroPlate,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    shadowColor: 'black',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 10,
    elevation: 2,
  },
  row: {
    paddingVertical: spacing.md,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowLabel: {
    ...typography.label,
    color: colors.subtitle,
    marginBottom: spacing.xs,
  },
  inputContainer: {
    height: 48,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  inputContainerInvalid: {
    borderColor: colors.error,
    backgroundColor: colors.errorBackground,
  },
  input: {
    ...typography.body,
    flex: 1,
    height: 46,
    padding: 0,
    borderWidth: 0,
    color: colors.fieldText,
    backgroundColor: 'transparent',
    textAlignVertical: 'center',
  },
  fieldError: {
    marginTop: spacing.xs,
    paddingLeft: 2,
  },
  fieldErrorText: {
    ...typography.error,
    color: colors.error,
  },
  readOnlyValue: {
    ...typography.body,
    color: colors.fieldText,
  },
  saveButton: {
    minHeight: 48,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.navy,
    marginTop: spacing.lg,
  },
  saveButtonPressed: {
    opacity: interactionOpacity.pressed,
  },
  saveButtonDisabled: {
    opacity: interactionOpacity.submitting,
  },
  saveButtonSubmitting: {
    opacity: interactionOpacity.submitting,
  },
  saveButtonLabel: {
    ...typography.buttonLabel,
    color: colors.brandText,
  },
  noticeCard: {
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.heroPlate,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  successNotice: {
    backgroundColor: colors.successTint,
    borderColor: colors.success,
  },
  noticeTitle: {
    ...typography.body,
    fontWeight: '700',
    color: colors.title,
    marginBottom: spacing.xs,
  },
  noticeText: {
    ...typography.caption,
    color: colors.subtitle,
    marginBottom: spacing.sm,
  },
  successTitle: {
    ...typography.body,
    fontWeight: '700',
    color: colors.successText,
    marginBottom: spacing.xs,
  },
  successText: {
    ...typography.caption,
    color: colors.successText,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  backButtonPressed: {
    opacity: interactionOpacity.pressed,
  },
  backButtonLabel: {
    ...typography.label,
    color: colors.title,
  },
});
