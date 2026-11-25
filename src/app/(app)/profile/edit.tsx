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
  type ProfileUser,
  type RegisteredUser,
} from '@/api';
import { ApiErrorRow } from '@/components/home/ApiErrorRow';
import { BackIcon } from '@/components/vehicle-details/icons';
import { useAuth } from '@/auth';
import { colors, interactionOpacity, radius, spacing, typography } from '@/theme';

/**
 * B4.2/B4.3 — functional Edit Profile route, NOT an approved final design.
 *
 * This is a direct child of `(app)`, so the existing auth/onboarding gate in
 * `(app)/_layout.tsx` protects `/profile/edit`. It deliberately sits outside
 * `(drawer)/(tabs)`: like `/my-requests`, it owns a simple app bar instead of
 * rebuilding the tab/drawer frame.
 *
 * Name and Phone are locally editable drafts. Email stays read-only. There is
 * no PATCH, Save button or navigation away from this screen that persists the
 * draft; photo, location and all other profile fields remain out of scope.
 *
 * Comment map: `initialValues` is the loaded baseline, `draft` is what the user
 * sees and types into, and `dirtyRef` guards those drafts from late GET replies.
 * See `B4.2_FINAL_REPORT.md` / `B4.3_FINAL_REPORT.md` for task scope and limits.
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

const MAX_FIELD_LENGTH = 255;
const MISSING_VALUE = 'Not provided';
const LENGTH_ERROR = `Maximum ${MAX_FIELD_LENGTH} characters`;

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
  const { user } = useAuth();

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
  const [error, setError] = useState<ApiError | null>(null);
  const [attempt, setAttempt] = useState(0);

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

    async function load() {
      try {
        const response = await getUserProfile();
        if (!active) {
          return;
        }
        if (!response.success || response.data === null) {
          throw new ApiError('http', 'Profile could not be loaded.', { body: response });
        }
        applyLoadedValues(reconcileProfile(response.data, authValues));
        setError(null);
      } catch (cause) {
        if (!active) {
          return;
        }
        setError(cause instanceof ApiError ? cause : ApiError.network(cause));
      } finally {
        if (active) {
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

  // B4.3: drafts are intentionally discarded on exit — no Save/PATCH exists.
  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/profile');
    }
  }, [router]);

  // B4.3: only the confirmed max:255 contract is enforced. No phone format
  // rule and no mandatory value — both backend fields are nullable.
  const nameError = getLengthError(draft.name);
  const phoneError = getLengthError(draft.phone);
  const isAuthError = error !== null && (error.status === 401 || error.status === 403);

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

        {error === null ? null : (
          <View style={styles.noticeCard}>
            {isAuthError ? (
              <>
                <Text style={styles.noticeTitle}>
                  {error.status === 401 ? 'Session expired' : 'Not authorized'}
                </Text>
                <Text style={styles.noticeText}>
                  {error.status === 401
                    ? 'Your session is no longer valid. Go back and sign in again.'
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
                <Text style={styles.noticeTitle}>Profile could not be refreshed</Text>
                <Text style={styles.noticeText}>
                  Showing the profile saved on this device. Check your connection and try again.
                </Text>
                <ApiErrorRow message={error.message} onRetry={retry} />
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
  noticeCard: {
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.heroPlate,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.lg,
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
