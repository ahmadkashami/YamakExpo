import { Redirect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SymbolView } from 'expo-symbols';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiError, loginUser } from '@/api';
import { AUTHENTICATED_ENTRY_ROUTE, useAuth } from '@/auth';
import { AuthBrandHeader } from '@/components/auth/AuthBrandHeader';
import {
  colors,
  fontWeight,
  interactionOpacity,
  radius,
  spacing,
  typography,
} from '@/theme';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NETWORK_ERROR_MESSAGE = 'Unable to connect to the server. Please try again.';
const INVALID_CREDENTIALS_MESSAGE = 'Email or password is incorrect.';
const UNVERIFIED_EMAIL_MESSAGE = 'Please verify your email address before signing in.';
const SESSION_SAVE_ERROR_MESSAGE = 'Unable to save your session. Please try again.';
const GENERIC_LOGIN_ERROR_MESSAGE = 'Unable to sign you in. Please try again.';

function getEmailError(email: string): string | null {
  const value = email.trim();

  if (value.length === 0) {
    return 'Email is required';
  }

  if (!EMAIL_PATTERN.test(value)) {
    return 'Enter a valid email address';
  }

  return null;
}

function getPasswordError(password: string): string | null {
  if (password.length === 0) {
    return 'Password is required';
  }

  return null;
}

function getLoginErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.kind === 'network' ? NETWORK_ERROR_MESSAGE : INVALID_CREDENTIALS_MESSAGE;
  }

  return GENERIC_LOGIN_ERROR_MESSAGE;
}

function FieldError({ message }: { message: string | null }) {
  if (message === null) {
    return null;
  }

  return (
    <View style={styles.fieldError} accessibilityRole="alert" accessibilityLiveRegion="polite">
      <SymbolView
        name={{ ios: 'info.circle', android: 'error', web: 'info' }}
        size={12}
        tintColor={colors.error}
      />
      <Text style={styles.fieldErrorText}>{message}</Text>
    </View>
  );
}

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const isSubmittingRef = useRef(false);
  const router = useRouter();
  const { status, authenticate } = useAuth();

  const emailError = emailTouched ? getEmailError(email) : null;
  const passwordError = passwordTouched ? getPasswordError(password) : null;

  /**
   * Mirror the Register gate: an authenticated session must never sit on the
   * login screen. Placed after every hook so hook order stays unconditional.
   */
  if (status === 'authenticated') {
    return <Redirect href={AUTHENTICATED_ENTRY_ROUTE} />;
  }

  function handleSubmitPress() {
    if (isSubmittingRef.current) {
      return;
    }

    setEmailTouched(true);
    setPasswordTouched(true);
    setLoginError(null);

    const nextErrors = [getEmailError(email), getPasswordError(password)];
    const isFormValid = nextErrors.every((error) => error === null);

    if (!isFormValid) {
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);

    void (async () => {
      try {
        const response = await loginUser({ email: email.trim(), password });
        const data = response.data;

        if (!response.success || data === undefined || data === null) {
          setLoginError(GENERIC_LOGIN_ERROR_MESSAGE);
          return;
        }

        if (!data.isVerified) {
          setLoginError(UNVERIFIED_EMAIL_MESSAGE);
          return;
        }

        if (typeof data.accessToken !== 'string' || data.accessToken.length === 0) {
          setLoginError(GENERIC_LOGIN_ERROR_MESSAGE);
          return;
        }

        /**
         * `authenticate()` is the ONLY session writer: it persists to
         * SecureStore and flips AuthProvider to `authenticated`. Navigation
         * happens only after it resolves, so `(app)` mounts with a session.
         */
        try {
          await authenticate(data.accessToken, data.user);
        } catch {
          setLoginError(SESSION_SAVE_ERROR_MESSAGE);
          return;
        }

        router.replace(AUTHENTICATED_ENTRY_ROUTE);
      } catch (error) {
        setLoginError(getLoginErrorMessage(error));
      } finally {
        isSubmittingRef.current = false;
        setIsSubmitting(false);
      }
    })();
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />
      <AuthBrandHeader />
      <View style={styles.surface}>
        <ScrollView
          style={styles.formScroll}
          contentContainerStyle={styles.formContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}>
          <View style={styles.sheetGripper} />
          <Text accessibilityRole="header" style={styles.title}>
            Welcome back
          </Text>
          <Text style={styles.subtitle}>Sign in to continue your journey.</Text>
          <View style={styles.form}>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Email</Text>
              <View
                style={[styles.inputContainer, emailError !== null && styles.inputContainerInvalid]}>
                <SymbolView
                  name={{ ios: 'envelope', android: 'mail', web: 'mail' }}
                  size={18}
                  tintColor={emailError !== null ? colors.errorIcon : colors.placeholder}
                  style={styles.leadingIcon}
                />
                <TextInput
                  accessibilityLabel={emailError !== null ? `Email, ${emailError}` : 'Email'}
                  value={email}
                  onChangeText={setEmail}
                  onBlur={() => setEmailTouched(true)}
                  placeholder="name@example.com"
                  placeholderTextColor={colors.placeholder}
                  selectionColor={colors.navy}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  style={styles.input}
                />
              </View>
              <FieldError message={emailError} />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Password</Text>
              <View
                style={[
                  styles.inputContainer,
                  styles.passwordInputContainer,
                  passwordError !== null && styles.inputContainerInvalid,
                ]}>
                <SymbolView
                  name={{ ios: 'lock', android: 'lock', web: 'lock' }}
                  size={18}
                  tintColor={passwordError !== null ? colors.errorIcon : colors.placeholder}
                  style={styles.leadingIcon}
                />
                <TextInput
                  accessibilityLabel={
                    passwordError !== null ? `Password, ${passwordError}` : 'Password'
                  }
                  value={password}
                  onChangeText={setPassword}
                  onBlur={() => setPasswordTouched(true)}
                  placeholder="Enter password"
                  placeholderTextColor={colors.placeholder}
                  selectionColor={colors.navy}
                  secureTextEntry={!isPasswordVisible}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="current-password"
                  style={styles.input}
                />
                <Pressable
                  accessibilityLabel={isPasswordVisible ? 'Hide password' : 'Show password'}
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={() => setIsPasswordVisible((visible) => !visible)}
                  style={({ pressed }) => [
                    styles.passwordToggle,
                    pressed && styles.passwordTogglePressed,
                  ]}>
                  <SymbolView
                    name={{
                      ios: isPasswordVisible ? 'eye' : 'eye.slash',
                      android: isPasswordVisible ? 'visibility' : 'visibility_off',
                      web: isPasswordVisible ? 'visibility' : 'visibility_off',
                    }}
                    size={18}
                    tintColor={colors.placeholder}
                  />
                </Pressable>
              </View>
              <FieldError message={passwordError} />
            </View>
            <View style={styles.submitRow}>
              <FieldError message={loginError} />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Sign in"
                accessibilityState={{ disabled: isSubmitting, busy: isSubmitting }}
                disabled={isSubmitting}
                onPress={handleSubmitPress}
                style={({ pressed }) => [
                  styles.submitButton,
                  pressed && styles.submitButtonPressed,
                  isSubmitting && styles.submitButtonSubmitting,
                ]}>
                {isSubmitting ? (
                  <ActivityIndicator color={colors.brandText} size="small" />
                ) : (
                  <>
                    <Text style={styles.submitButtonLabel}>Sign in</Text>
                    <SymbolView
                      name={{
                        ios: 'arrow.right',
                        android: 'arrow_forward',
                        web: 'arrow_right',
                      }}
                      size={12}
                      tintColor={colors.brandText}
                    />
                  </>
                )}
              </Pressable>
            </View>
            <View style={styles.footerRow}>
              <Text style={styles.footerText}>New to Yamak?</Text>
              <Pressable
                accessibilityRole="link"
                accessibilityLabel="Create an account"
                hitSlop={8}
                onPress={() => router.push('/register')}
                style={({ pressed }) => [pressed && styles.footerLinkPressed]}>
                <Text style={styles.footerLink}>Create an account</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.navy,
  },
  surface: {
    flex: 1,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    backgroundColor: colors.surface,
    boxShadow: '0px -10px 25px rgba(5, 15, 28, 0.08)',
  },
  sheetGripper: {
    width: 40,
    height: 4,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
  },
  formScroll: {
    flex: 1,
  },
  formContent: {
    flexGrow: 1,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.xxl,
  },
  form: {
    marginTop: spacing.sm,
  },
  fieldGroup: {
    marginBottom: spacing.lg,
  },
  fieldLabel: {
    ...typography.label,
    marginBottom: 6,
    color: colors.fieldLabel,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  inputContainer: {
    height: 48,
    paddingLeft: 14,
    paddingRight: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  leadingIcon: {
    marginRight: 10,
  },
  inputContainerInvalid: {
    borderColor: colors.error,
    backgroundColor: colors.errorBackground,
  },
  fieldError: {
    marginTop: 6,
    paddingLeft: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fieldErrorText: {
    ...typography.error,
    flex: 1,
    color: colors.error,
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
  passwordInputContainer: {
    paddingRight: 2,
  },
  passwordToggle: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  passwordTogglePressed: {
    opacity: 0.6,
  },
  submitRow: {
    marginTop: spacing.md,
  },
  submitButton: {
    minHeight: 48,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.navy,
    boxShadow: `0px 4px 14px 0px ${colors.scrim}`,
  },
  submitButtonPressed: {
    opacity: interactionOpacity.pressed,
  },
  submitButtonSubmitting: {
    opacity: interactionOpacity.submitting,
  },
  submitButtonLabel: {
    ...typography.buttonLabel,
    color: colors.brandText,
  },
  footerRow: {
    marginTop: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  footerText: {
    ...typography.label,
    fontWeight: fontWeight.regular,
    color: colors.subtitle,
  },
  footerLink: {
    ...typography.label,
    fontWeight: fontWeight.semibold,
    color: colors.title,
    textDecorationLine: 'underline',
  },
  footerLinkPressed: {
    opacity: interactionOpacity.pressed,
  },
  title: {
    ...typography.title,
    color: colors.title,
  },
  subtitle: {
    ...typography.subtitle,
    marginTop: spacing.sm,
    color: colors.subtitle,
  },
});
