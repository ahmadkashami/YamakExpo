import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SymbolView } from 'expo-symbols';
import { parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js';
import { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiError, registerUser } from '@/api';
import { AuthBrandHeader } from '@/components/auth/AuthBrandHeader';
import { CountrySelectorModal } from '@/components/auth/CountrySelectorModal';
import {
  defaultCountry,
  getAllowedCountries,
  getCallingCode,
  type Country,
} from '@/data/allowed-countries';
import { colors, fontWeight, radius, spacing, typography } from '@/theme';

const countries = getAllowedCountries();

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MINIMUM_NAME_LENGTH = 3;
const MINIMUM_PASSWORD_LENGTH = 8;
const TERMS_ERROR_MESSAGE = 'You must agree to the Terms and Privacy Policy';
const NETWORK_ERROR_MESSAGE = 'Unable to connect to the server. Please try again.';
const GENERIC_SIGNUP_ERROR_MESSAGE = 'Unable to create your account. Please try again.';

function getNameError(name: string): string | null {
  const value = name.trim();

  if (value.length === 0) {
    return 'Name is required';
  }

  if (value.length < MINIMUM_NAME_LENGTH) {
    return 'Name must be at least 3 characters';
  }

  return null;
}

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

  if (password.length < MINIMUM_PASSWORD_LENGTH) {
    return 'Password must be at least 8 characters';
  }

  return null;
}

type PhoneValidation = {
  error: string | null;
  e164: string | null;
};

function getPhoneValidation(phone: string, isoCode: CountryCode): PhoneValidation {
  const value = phone.trim();

  if (value.length === 0) {
    return { error: 'Phone number is required', e164: null };
  }

  const parsedPhone = parsePhoneNumberFromString(value, isoCode);

  if (parsedPhone === undefined || !parsedPhone.isPossible()) {
    return { error: 'Enter a valid phone number', e164: null };
  }

  return { error: null, e164: parsedPhone.number };
}

function getTermsError(isAgreed: boolean): string | null {
  return isAgreed ? null : TERMS_ERROR_MESSAGE;
}

function getSignupErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.kind === 'network' ? NETWORK_ERROR_MESSAGE : error.message;
  }

  return GENERIC_SIGNUP_ERROR_MESSAGE;
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

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<Country>(defaultCountry);
  const [isCountrySelectorVisible, setIsCountrySelectorVisible] = useState(false);
  const [phone, setPhone] = useState('');
  const [isAgreed, setIsAgreed] = useState(false);
  const [nameTouched, setNameTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [termsTouched, setTermsTouched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);
  const isSubmittingRef = useRef(false);
  const router = useRouter();
  const callingCode = getCallingCode(selectedCountry.isoCode);

  const nameError = nameTouched ? getNameError(name) : null;
  const emailError = emailTouched ? getEmailError(email) : null;
  const passwordError = passwordTouched ? getPasswordError(password) : null;
  const termsError = termsTouched ? getTermsError(isAgreed) : null;

  const phoneValidation = useMemo(
    () => getPhoneValidation(phone, selectedCountry.isoCode),
    [phone, selectedCountry.isoCode],
  );
  const phoneError = phoneTouched ? phoneValidation.error : null;

  function selectCountry(country: Country) {
    setSelectedCountry(country);
  }

  function closeCountrySelector() {
    setIsCountrySelectorVisible(false);
  }

  function openTermsOfService() {
    void Linking.openURL('https://yamak-kw.com/terms');
  }

  function openPrivacyPolicy() {
    void Linking.openURL('https://yamak-kw.com/privacy');
  }

  function handleSubmitPress() {
    if (isSubmittingRef.current) {
      return;
    }

    setNameTouched(true);
    setEmailTouched(true);
    setPasswordTouched(true);
    setPhoneTouched(true);
    setTermsTouched(true);
    setSignupError(null);

    const nextErrors = [
      getNameError(name),
      getEmailError(email),
      getPasswordError(password),
      phoneValidation.error,
      getTermsError(isAgreed),
    ];
    const e164Phone = phoneValidation.e164; // Phone number normalized to the international E.164 format, e.g. +96555551234
    const isFormValid = nextErrors.every((error) => error === null);

    if (!isFormValid || e164Phone === null) {
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);

    void (async () => {
      try {
        const response = await registerUser({ name, email, password, phone: e164Phone });

        if (response.success && response.data?.user !== undefined) {
          router.push({ pathname: '/email-otp', params: { email } });
        } else {
          setSignupError(GENERIC_SIGNUP_ERROR_MESSAGE);
        }
      } catch (error) {
        setSignupError(getSignupErrorMessage(error));
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
            Begin your journey
          </Text>
          <Text style={styles.subtitle}>
            A premium account for every journey on Kuwait&apos;s roads.
          </Text>
          <View style={styles.form}>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Full Name</Text>
              <View
                style={[styles.inputContainer, nameError !== null && styles.inputContainerInvalid]}>
                <SymbolView
                  name={{ ios: 'person', android: 'person', web: 'person' }}
                  size={18}
                  tintColor={nameError !== null ? colors.errorIcon : colors.placeholder}
                  style={styles.leadingIcon}
                />
                <TextInput
                  accessibilityLabel={
                    nameError !== null ? `Full Name, ${nameError}` : 'Full Name'
                  }
                  value={name}
                  onChangeText={setName}
                  onBlur={() => setNameTouched(true)}
                  placeholder="Your name"
                  placeholderTextColor={colors.placeholder}
                  selectionColor={colors.navy}
                  autoCapitalize="words"
                  autoComplete="name"
                  style={styles.input}
                />
              </View>
              <FieldError message={nameError} />
            </View>
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
                  autoComplete="new-password"
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
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Phone</Text>
              <View
                style={[
                  styles.phoneInputContainer,
                  phoneError !== null && styles.phoneInputContainerInvalid,
                ]}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${selectedCountry.name}, ${selectedCountry.isoCode}, ${callingCode}`}
                  accessibilityState={{ expanded: isCountrySelectorVisible }}
                  onPress={() => {
                    Keyboard.dismiss();
                    setIsCountrySelectorVisible(true);
                  }}
                  style={({ pressed }) => [
                    styles.callingCodePrefix,
                    phoneError !== null && styles.callingCodePrefixInvalid,
                    pressed && styles.callingCodePrefixPressed,
                  ]}>
                  <Text style={styles.flag}>{selectedCountry.flag}</Text>
                  <Text style={styles.countryCode}>{selectedCountry.isoCode}</Text>
                  <Text style={styles.callingCode}>{callingCode}</Text>
                  <SymbolView
                    name={{ ios: 'chevron.down', android: 'expand_more', web: 'expand_more' }}
                    size={12}
                    tintColor={colors.placeholder}
                  />
                </Pressable>
                <TextInput
                  accessibilityLabel={
                    phoneError !== null ? `Phone number, ${phoneError}` : 'Phone number'
                  }
                  value={phone}
                  onChangeText={setPhone}
                  onBlur={() => setPhoneTouched(true)}
                  placeholder="5XXX XXXX"
                  placeholderTextColor={colors.placeholder}
                  selectionColor={colors.navy}
                  keyboardType="number-pad"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={[styles.input, styles.phoneInput]}
                />
              </View>
              <FieldError message={phoneError} />
            </View>
            <View style={styles.agreementRow}>
              <Pressable
                accessibilityRole="checkbox"
                accessibilityLabel="Agree to the Terms of Service and Privacy Policy"
                accessibilityState={{ checked: isAgreed }}
                hitSlop={10}
                onPress={() => {
                  setTermsTouched(true);
                  setIsAgreed((agreed) => !agreed);
                }}
                style={({ pressed }) => [
                  styles.agreementCheckbox,
                  isAgreed && styles.agreementCheckboxChecked,
                  pressed && styles.agreementCheckboxPressed,
                ]}>
                {isAgreed ? (
                  <SymbolView
                    name={{ ios: 'checkmark', android: 'check', web: 'check' }}
                    size={14}
                    tintColor={colors.gold}
                  />
                ) : null}
              </Pressable>
              <Text style={styles.agreementText}>
                By providing your phone number you agree to the{' '}
                <Text
                  accessibilityRole="link"
                  onPress={openTermsOfService}
                  style={styles.agreementLink}>
                  Terms of Service
                </Text>{' '}
                and{' '}
                <Text
                  accessibilityRole="link"
                  onPress={openPrivacyPolicy}
                  style={styles.agreementLink}>
                  Privacy Policy
                </Text>
                .
              </Text>
            </View>
            <FieldError message={termsError} />
            <View style={styles.submitRow}>
              <FieldError message={signupError} />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Sign up"
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
                    <Text style={styles.submitButtonLabel}>Sign up</Text>
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
          </View>
        </ScrollView>
      </View>
      <CountrySelectorModal
        visible={isCountrySelectorVisible}
        selectedCountry={selectedCountry}
        countries={countries}
        onSelectCountry={selectCountry}
        onClose={closeCountrySelector}
      />
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
  phoneInputContainer: {
    height: 48,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  callingCodePrefix: {
    width: 112,
    paddingHorizontal: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    backgroundColor: colors.phonePrefix,
  },
  callingCodePrefixPressed: {
    opacity: 0.7,
  },
  phoneInputContainerInvalid: {
    borderColor: colors.error,
    backgroundColor: colors.errorBackground,
  },
  callingCodePrefixInvalid: {
    backgroundColor: colors.errorBackground,
  },
  flag: {
    fontSize: 16,
    lineHeight: 20,
  },
  countryCode: {
    ...typography.label,
    fontWeight: fontWeight.bold,
    color: colors.fieldLabel,
  },
  callingCode: {
    ...typography.label,
    color: colors.subtitle,
  },
  phoneInput: {
    paddingHorizontal: 14,
  },
  agreementRow: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  agreementCheckbox: {
    width: 22,
    height: 22,
    marginTop: 1,
    marginRight: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
  },
  agreementCheckboxChecked: {
    borderColor: colors.navy,
    backgroundColor: colors.navy,
  },
  agreementCheckboxPressed: {
    opacity: 0.6,
  },
  agreementText: {
    ...typography.label,
    fontWeight: fontWeight.regular,
    flex: 1,
    color: colors.subtitle,
  },
  agreementLink: {
    color: colors.title,
    fontWeight: fontWeight.semibold,
    textDecorationLine: 'underline',
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
    opacity: 0.7,
  },
  submitButtonSubmitting: {
    opacity: 0.75,
  },
  submitButtonLabel: {
    ...typography.body,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.6,
    color: colors.brandText,
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
