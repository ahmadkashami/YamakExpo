import { useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SymbolView } from 'expo-symbols';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiError, verifyEmailOtp } from '@/api';
import { colors, fontWeight, radius, spacing, typography } from '@/theme';

const appLogo = require('@/assets/images/appLogo.png');

const OTP_LENGTH = 4;
const DIGITS_ONLY = /^\d+$/;
const NETWORK_ERROR_MESSAGE = 'Unable to connect to the server. Please try again.';
const GENERIC_VERIFY_ERROR_MESSAGE = 'Unable to verify the code. Please try again.';

function getOtpError(code: string): string | null {
  if (code.length === 0) {
    return 'Enter the verification code';
  }

  if (!DIGITS_ONLY.test(code)) {
    return 'The code must contain digits only';
  }

  if (code.length !== OTP_LENGTH) {
    return `Enter the ${OTP_LENGTH} digit code`;
  }

  return null;
}

function getValidationMessage(body: unknown): string | null {
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
    .map((detail) =>
      typeof detail === 'object' && detail !== null
        ? (detail as { message?: unknown }).message
        : undefined,
    )
    .filter((message): message is string => typeof message === 'string' && message.trim().length > 0);

  return messages.length > 0 ? messages.join(' ') : null;
}

function getVerifyErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.kind === 'network') {
      return NETWORK_ERROR_MESSAGE;
    }

    return getValidationMessage(error.body) ?? error.message;
  }

  return GENERIC_VERIFY_ERROR_MESSAGE;
}

export default function EmailOtpScreen() {
  const { email } = useLocalSearchParams<{ email?: string | string[] }>();
  const emailValue = Array.isArray(email) ? (email[0] ?? '') : (email ?? '');

  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const isVerifyingRef = useRef(false);

  function handleCodeChange(text: string) {
    setVerifyError(null);
    setCode(text.replace(/\D/g, '').slice(0, OTP_LENGTH));
  }

  async function handleVerifyPress() {
    if (isVerifyingRef.current) {
      return;
    }

    const otpError = getOtpError(code);

    if (otpError !== null) {
      setVerifyError(otpError);
      return;
    }

    isVerifyingRef.current = true;
    setIsVerifying(true);
    setVerifyError(null);

    try {
      const response = await verifyEmailOtp({ email: emailValue, code });

      if (response.success && response.data?.user !== undefined) {
        setIsVerified(true);
      } else {
        setVerifyError(GENERIC_VERIFY_ERROR_MESSAGE);
      }
    } catch (error) {
      setVerifyError(getVerifyErrorMessage(error));
    } finally {
      isVerifyingRef.current = false;
      setIsVerifying(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.brandGroup}>
          <View style={styles.logoPlate}>
            <Image source={appLogo} style={styles.logo} resizeMode="contain" />
          </View>
          <View style={styles.brandNameRow}>
            <Text style={styles.brandName}>YAMAK</Text>
            <Text style={styles.brandDivider}>·</Text>
            <Text style={styles.brandNameArabic}>يمك</Text>
          </View>
        </View>
        <View style={styles.card}>
          <Text accessibilityRole="header" style={styles.title}>
            Account Verification
          </Text>
          <Text style={styles.subtitle}>Please Enter the 4 digit we have sent to :</Text>
          <Text accessibilityLabel={`Verification code sent to ${emailValue}`} style={styles.email}>
            {emailValue}
          </Text>

          {isVerified ? (
            <View style={styles.verifiedGroup}>
              <SymbolView
                name={{ ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' }}
                size={28}
                tintColor={colors.navy}
              />
              <Text accessibilityRole="text" style={styles.verifiedTitle}>
                Email verified
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.otpRow}>
                {Array.from({ length: OTP_LENGTH }, (_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.otpBox,
                      index < code.length && styles.otpBoxFilled,
                      verifyError !== null && styles.otpBoxInvalid,
                    ]}>
                    <Text style={styles.otpDigit}>{code[index] ?? ''}</Text>
                  </View>
                ))}
                <TextInput
                  accessibilityLabel="Verification code"
                  value={code}
                  onChangeText={handleCodeChange}
                  editable={!isVerifying}
                  keyboardType="number-pad"
                  inputMode="numeric"
                  maxLength={OTP_LENGTH}
                  textContentType="oneTimeCode"
                  autoComplete="sms-otp"
                  caretHidden
                  selectionColor="transparent"
                  style={styles.otpInput}
                />
              </View>

              <View style={styles.statusRow}>
                {verifyError !== null ? (
                  <View
                    style={styles.statusError}
                    accessibilityRole="alert"
                    accessibilityLiveRegion="polite">
                    <SymbolView
                      name={{ ios: 'info.circle', android: 'error', web: 'info' }}
                      size={12}
                      tintColor={colors.error}
                    />
                    <Text style={styles.statusText}>{verifyError}</Text>
                  </View>
                ) : null}
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Verify"
                accessibilityState={{ disabled: isVerifying, busy: isVerifying }}
                disabled={isVerifying}
                onPress={handleVerifyPress}
                style={({ pressed }) => [
                  styles.verifyButton,
                  pressed && styles.verifyButtonPressed,
                  isVerifying && styles.verifyButtonSubmitting,
                ]}>
                {isVerifying ? (
                  <ActivityIndicator color={colors.brandText} size="small" />
                ) : (
                  <Text style={styles.verifyButtonLabel}>Verify</Text>
                )}
              </Pressable>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.navy,
  },
  scroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.xxl,
    justifyContent: 'center',
  },
  brandGroup: {
    alignItems: 'center',
  },
  logoPlate: {
    width: 72,
    height: 72,
    marginBottom: spacing.md,
    borderRadius: radius.heroPlate,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  logo: {
    width: 48,
    height: 48,
  },
  brandNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  brandName: {
    color: colors.brandText,
    fontSize: 20,
    lineHeight: 20,
    fontWeight: fontWeight.black,
    letterSpacing: 1,
  },
  brandDivider: {
    color: colors.wordmark,
    fontSize: 18,
    lineHeight: 20,
    fontWeight: fontWeight.bold,
  },
  brandNameArabic: {
    color: colors.wordmark,
    fontSize: 20,
    lineHeight: 20,
    fontWeight: fontWeight.bold,
    writingDirection: 'rtl',
  },
  card: {
    marginTop: spacing.xxl,
    paddingTop: spacing.xl,
    paddingRight: spacing.xl,
    paddingBottom: spacing.xl,
    paddingLeft: spacing.xl,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  title: {
    ...typography.title,
    color: colors.title,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    marginTop: spacing.sm,
    color: colors.subtitle,
    textAlign: 'center',
  },
  email: {
    ...typography.subtitle,
    marginTop: spacing.sm,
    color: colors.title,
    fontWeight: fontWeight.bold,
    textAlign: 'center',
  },
  otpRow: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  otpBox: {
    width: 52,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  otpBoxFilled: {
    borderColor: colors.navy,
  },
  otpBoxInvalid: {
    borderColor: colors.error,
    backgroundColor: colors.errorBackground,
  },
  otpDigit: {
    ...typography.title,
    color: colors.fieldText,
  },
  otpInput: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    color: 'transparent',
    backgroundColor: 'transparent',
  },
  statusRow: {
    marginTop: spacing.md,
    minHeight: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusError: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusText: {
    ...typography.error,
    flex: 1,
    color: colors.error,
  },
  verifyButton: {
    minHeight: 48,
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.navy,
  },
  verifyButtonPressed: {
    opacity: 0.7,
  },
  verifyButtonSubmitting: {
    opacity: 0.75,
  },
  verifyButtonLabel: {
    ...typography.body,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.6,
    color: colors.brandText,
  },
  verifiedGroup: {
    marginTop: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  verifiedTitle: {
    ...typography.subtitle,
    fontWeight: fontWeight.bold,
    color: colors.title,
  },
});
