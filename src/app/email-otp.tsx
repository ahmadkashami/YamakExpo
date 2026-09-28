import { useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SymbolView } from 'expo-symbols';
import { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Animated,
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
import { useAuth } from '@/auth';
import {
  colors,
  fontWeight,
  interactionOpacity,
  radius,
  spacing,
  typography,
} from '@/theme';

const appLogo = require('@/assets/images/appLogo.png');

const OTP_LENGTH = 4;
const MASK_CHARACTER = '•';
const SUCCESS_MESSAGE = 'Email verified successfully';
const SUCCESS_ANIMATION_DURATION = 260;
const SUCCESS_STARTED_SCALE = 0.94;
const NETWORK_ERROR_MESSAGE = 'Unable to connect to the server. Please try again.';
const GENERIC_VERIFY_ERROR_MESSAGE = 'Unable to verify the code. Please try again.';
const SESSION_SAVE_ERROR_MESSAGE = 'Unable to save your session. Please try again.';
const INVALID_CODE_MESSAGE = 'That code is not correct. Please try again.';
const EXPIRED_CODE_MESSAGE = 'This code has expired. Please register again to get a new one.';

function maskEmailDestination(value: string): string {
  const trimmed = value.trim();
  const atIndex = trimmed.indexOf('@');

  if (atIndex < 1) {
    return '';
  }

  const localPart = trimmed.slice(0, atIndex);
  const visibleCharacters = localPart.slice(0, 1);
  const maskedCharacters = MASK_CHARACTER.repeat(Math.max(localPart.length - 1, 3));

  return `${visibleCharacters}${maskedCharacters}${trimmed.slice(atIndex)}`;
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
  if (!(error instanceof ApiError)) {
    return GENERIC_VERIFY_ERROR_MESSAGE;
  }

  if (error.kind === 'network') {
    return NETWORK_ERROR_MESSAGE;
  }

  const validationMessage = getValidationMessage(error.body);

  if (validationMessage !== null) {
    return validationMessage;
  }

  const backendMessage = error.message.toLowerCase();

  if (backendMessage.includes('expired')) {
    return EXPIRED_CODE_MESSAGE;
  }

  if (backendMessage.includes('invalid code')) {
    return INVALID_CODE_MESSAGE;
  }

  return GENERIC_VERIFY_ERROR_MESSAGE;
}

export default function EmailOtpScreen() {
  const { email } = useLocalSearchParams<{ email?: string | string[] }>();
  const emailValue = Array.isArray(email) ? (email[0] ?? '') : (email ?? '');
  const maskedDestination = maskEmailDestination(emailValue);

  const [digits, setDigits] = useState<string[]>(() =>
    Array.from({ length: OTP_LENGTH }, () => ''),
  );
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const digitInputs = useRef<Array<TextInput | null>>([]);
  const isVerifyingRef = useRef(false);
  const successScale = useRef(new Animated.Value(SUCCESS_STARTED_SCALE)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;
  const { authenticate } = useAuth();

  const code = digits.join('');
  const isCodeComplete = code.length === OTP_LENGTH;

  useEffect(() => {
    if (!isVerified) {
      successScale.setValue(SUCCESS_STARTED_SCALE);
      successOpacity.setValue(0);
      return;
    }

    Animated.parallel([
      Animated.timing(successScale, {
        toValue: 1,
        duration: SUCCESS_ANIMATION_DURATION,
        useNativeDriver: true,
      }),
      Animated.timing(successOpacity, {
        toValue: 1,
        duration: SUCCESS_ANIMATION_DURATION,
        useNativeDriver: true,
      }),
    ]).start();

    AccessibilityInfo.announceForAccessibility(SUCCESS_MESSAGE);
  }, [isVerified, successOpacity, successScale]);

  function focusDigit(index: number) {
    digitInputs.current[index]?.focus();
  }

  function handleDigitChange(index: number, text: string) {
    const incoming = text.replace(/\D/g, '');

    if (incoming.length === 0) {
      return;
    }

    setVerifyError(null);

    setDigits((previous) => {
      const next = [...previous];

      if (incoming.length > 1) {
        for (let offset = 0; offset < incoming.length && index + offset < OTP_LENGTH; offset += 1) {
          next[index + offset] = incoming[offset];
        }
      } else {
        next[index] = incoming;
      }

      return next;
    });

    const nextIndex =
      incoming.length > 1
        ? Math.min(index + incoming.length, OTP_LENGTH) - 1
        : Math.min(index + 1, OTP_LENGTH - 1);

    if (nextIndex !== index) {
      focusDigit(nextIndex);
    }
  }

  function handleDigitCleared(index: number) {
    setVerifyError(null);

    if (digits[index] !== '') {
      setDigits((previous) => {
        const next = [...previous];
        next[index] = '';
        return next;
      });
      return;
    }

    if (index === 0) {
      return;
    }

    setDigits((previous) => {
      const next = [...previous];
      next[index - 1] = '';
      return next;
    });
    focusDigit(index - 1);
  }

  async function handleVerifyPress() {
    if (isVerifyingRef.current || !isCodeComplete) {
      return;
    }

    isVerifyingRef.current = true;
    setIsVerifying(true);
    setVerifyError(null);

    try {
      const response = await verifyEmailOtp({ email: emailValue, code });

      if (
        response.success &&
        response.data?.user !== undefined &&
        response.data.accessToken !== undefined
      ) {
        try {
          await authenticate(response.data.accessToken, response.data.user);
          setIsVerified(true);
        } catch {
          setVerifyError(SESSION_SAVE_ERROR_MESSAGE);
        }
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
          {isVerified ? null : (
            <>
              <Text style={styles.subtitle}>Please enter the 4-digit code we sent to:</Text>
              {maskedDestination.length > 0 ? (
                <Text
                  accessibilityLabel={`Verification code sent to ${maskedDestination}`}
                  style={styles.destination}>
                  {maskedDestination}
                </Text>
              ) : null}
            </>
          )}

          {isVerified ? (
            <Animated.View
              accessible
              accessibilityRole="text"
              accessibilityLabel={SUCCESS_MESSAGE}
              style={[
                styles.verifiedGroup,
                { opacity: successOpacity, transform: [{ scale: successScale }] },
              ]}>
              <View style={styles.verifiedBadge}>
                <SymbolView
                  name={{
                    ios: 'checkmark.circle.fill',
                    android: 'check_circle',
                    web: 'check_circle',
                  }}
                  size={40}
                  tintColor={colors.navy}
                />
              </View>
              <Text style={styles.verifiedTitle}>{SUCCESS_MESSAGE}</Text>
            </Animated.View>
          ) : (
            <>
              <View style={styles.digitRow}>
                {Array.from({ length: OTP_LENGTH }, (_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.digitBox,
                      index < code.length && styles.digitBoxFilled,
                      focusedIndex === index && styles.digitBoxFocused,
                      verifyError !== null && styles.digitBoxInvalid,
                    ]}>
                    <TextInput
                      ref={(input) => {
                        digitInputs.current[index] = input;
                      }}
                      accessibilityLabel={`Digit ${index + 1} of ${OTP_LENGTH}`}
                      value={digits[index] ?? ''}
                      onChangeText={(text) =>
                        text.length === 0
                          ? handleDigitCleared(index)
                          : handleDigitChange(index, text)
                      }
                      onFocus={() => setFocusedIndex(index)}
                      onBlur={() =>
                        setFocusedIndex((current) => (current === index ? null : current))
                      }
                      editable={!isVerifying}
                      autoFocus={index === 0}
                      keyboardType="number-pad"
                      inputMode="numeric"
                      textContentType="oneTimeCode"
                      autoComplete="sms-otp"
                      style={styles.digitInput}
                    />
                  </View>
                ))}
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
                accessibilityState={{ disabled: !isCodeComplete || isVerifying, busy: isVerifying }}
                disabled={!isCodeComplete || isVerifying}
                onPress={handleVerifyPress}
                style={({ pressed }) => [
                  styles.verifyButton,
                  !isCodeComplete && styles.verifyButtonDisabled,
                  isVerifying && styles.verifyButtonSubmitting,
                  pressed && isCodeComplete && !isVerifying && styles.verifyButtonPressed,
                ]}>
                {isVerifying ? (
                  <ActivityIndicator color={colors.brandText} size="small" />
                ) : (
                  <Text
                    style={[
                      styles.verifyButtonLabel,
                      !isCodeComplete && styles.verifyButtonLabelDisabled,
                    ]}>
                    Verify
                  </Text>
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
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
  },
  brandGroup: {
    alignItems: 'center',
  },
  logoPlate: {
    width: 72,
    height: 72,
    marginBottom: spacing.sm,
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
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  title: {
    ...typography.title,
    fontSize: 24,
    lineHeight: 30,
    color: colors.title,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    marginTop: spacing.sm,
    color: colors.subtitle,
    textAlign: 'center',
  },
  destination: {
    ...typography.subtitle,
    marginTop: spacing.xs,
    color: colors.title,
    fontWeight: fontWeight.bold,
    textAlign: 'center',
  },
  digitRow: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  digitBox: {
    width: 48,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  digitBoxFilled: {
    borderColor: colors.navy,
  },
  digitBoxFocused: {
    borderWidth: 2,
    borderColor: colors.routeGold,
    backgroundColor: colors.countrySelected,
  },
  digitBoxInvalid: {
    borderColor: colors.error,
    backgroundColor: colors.errorBackground,
  },
  digitInput: {
    flex: 1,
    width: '100%',
    padding: 0,
    textAlign: 'center',
    textAlignVertical: 'center',
    color: colors.fieldText,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: fontWeight.bold,
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
  verifyButtonDisabled: {
    backgroundColor: colors.tagline,
  },
  verifyButtonPressed: {
    opacity: interactionOpacity.pressed,
  },
  verifyButtonSubmitting: {
    opacity: interactionOpacity.submitting,
  },
  verifyButtonLabel: {
    ...typography.buttonLabel,
    color: colors.brandText,
  },
  verifyButtonLabelDisabled: {
    color: colors.navy,
  },
  verifiedGroup: {
    marginTop: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  verifiedBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.countrySelected,
  },
  verifiedTitle: {
    ...typography.subtitle,
    fontWeight: fontWeight.bold,
    color: colors.title,
    textAlign: 'center',
  },
});
