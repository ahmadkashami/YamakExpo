import { StatusBar } from 'expo-status-bar';
import { SymbolView } from 'expo-symbols';
import { parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js';
import { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Keyboard,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Path,
  Stop,
} from 'react-native-svg';

import { ApiError, registerUser, type RegisterResponse } from '@/api';
import {
  defaultCountry,
  getAllowedCountries,
  getCallingCode,
  type Country,
} from '@/data/allowed-countries';
import { colors, fontWeight, radius, spacing, typography } from '@/theme';

const appLogo = require('@/assets/images/appLogo.png');

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
  const [countrySearchQuery, setCountrySearchQuery] = useState('');
  const [phone, setPhone] = useState('');
  const [isAgreed, setIsAgreed] = useState(false);
  const [nameTouched, setNameTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [termsTouched, setTermsTouched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);
  const [signupResult, setSignupResult] = useState<RegisterResponse | null>(null);
  const isSubmittingRef = useRef(false);
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

  const visibleCountries = useMemo(() => {
    const query = countrySearchQuery.trim().toLowerCase();

    if (query.length === 0) {
      return countries;
    }

    return countries.filter((country) => {
      return (
        country.name.toLowerCase().includes(query) ||
        country.isoCode.toLowerCase().includes(query) ||
        getCallingCode(country.isoCode).includes(query)
      );
    });
  }, [countrySearchQuery]);

  function selectCountry(country: Country) {
    setSelectedCountry(country);
    closeCountrySelector();
  }

  function closeCountrySelector() {
    setCountrySearchQuery('');
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
    const e164 = phoneValidation.e164;
    const isFormValid = nextErrors.every((error) => error === null);

    if (!isFormValid || e164 === null) {
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);

    void (async () => {
      try {
        const response = await registerUser({ name, email, password, phone: e164 });

        if (response.success && response.data?.user !== undefined) {
          setSignupResult(response);
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
      <View style={styles.hero}>
        <Svg
          style={styles.heroRoute}
          width="100%"
          height="100%"
          viewBox="0 0 430 260"
          preserveAspectRatio="xMidYMid slice"
          fill="none"
          pointerEvents="none"
          opacity={0.22}>
          <Defs>
            <LinearGradient id="yamakRouteGlow" x1="0%" y1="100%" x2="100%" y2="0%">
              <Stop offset="0" stopColor={colors.routeBlue} stopOpacity={0.15} />
              <Stop offset="0.5" stopColor={colors.routeGold} stopOpacity={0.7} />
              <Stop offset="1" stopColor={colors.routeGold} stopOpacity={0.15} />
            </LinearGradient>
          </Defs>
          <Path
            d="M-20,185 C75,170 120,65 215,95 C285,120 345,70 450,48"
            fill="none"
            stroke="url(#yamakRouteGlow)"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeDasharray="4 6"
          />
          <Path
            d="M-30,215 C85,200 135,95 235,118 C320,138 370,95 460,70"
            fill="none"
            stroke={colors.routeGold}
            strokeOpacity={0.2}
            strokeWidth={1}
            strokeLinecap="round"
          />
          <Circle cx={172} cy={80} r={3.5} fill={colors.routeGold} fillOpacity={0.95} />
          <Circle
            cx={172}
            cy={80}
            r={7}
            fill="none"
            stroke={colors.routeGold}
            strokeOpacity={0.4}
            strokeWidth={1.2}
          />
          <Circle cx={278} cy={112} r={3} fill={colors.routeBlue} fillOpacity={0.75} />
          <Circle
            cx={278}
            cy={112}
            r={5.5}
            fill="none"
            stroke={colors.routeBlue}
            strokeOpacity={0.3}
            strokeWidth={1}
          />
        </Svg>
        <View style={styles.settingsRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Settings"
            hitSlop={6}
            style={({ pressed }) => [
              styles.settingsButton,
              pressed && styles.settingsButtonPressed,
            ]}>
            <SymbolView
              name={{ ios: 'gearshape', android: 'settings', web: 'settings' }}
              size={16}
              tintColor={colors.border}
            />
          </Pressable>
        </View>
        <View style={styles.brandGroup}>
          <View style={styles.logoPlate}>
            <Image source={appLogo} style={styles.logo} resizeMode="contain" />
          </View>
          <View style={styles.brandNameRow}>
            <Text style={styles.brandName}>YAMAK</Text>
            <Text style={styles.brandDivider}>·</Text>
            <Text style={styles.brandNameArabic}>يمك</Text>
          </View>
          <Text style={styles.tagline}>Your road &amp; mobility partner</Text>
        </View>
      </View>
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
      <Modal
        visible={isCountrySelectorVisible}
        transparent
        animationType="slide"
        onRequestClose={closeCountrySelector}>
        <View style={styles.countryModalBackdrop}>
          <Pressable
            accessible={false}
            style={styles.countryModalDismissArea}
            onPress={closeCountrySelector}
          />
          <View style={styles.countryModalCard}>
            <View style={styles.countryModalHeader}>
              <Text style={styles.countryModalTitle}>Select country</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close country selector"
                onPress={closeCountrySelector}
                style={({ pressed }) => [
                  styles.countryModalClose,
                  pressed && styles.countryModalClosePressed,
                ]}>
                <SymbolView
                  name={{ ios: 'xmark', android: 'close', web: 'close' }}
                  size={18}
                  tintColor={colors.fieldLabel}
                />
              </Pressable>
            </View>
            <View style={styles.countrySearch}>
              <SymbolView
                name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
                size={16}
                tintColor={colors.subtitle}
              />
              <TextInput
                value={countrySearchQuery}
                onChangeText={setCountrySearchQuery}
                placeholder="Search country"
                placeholderTextColor={colors.placeholder}
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.countrySearchInput}
                accessibilityLabel="Search country"
              />
            </View>
            <FlatList
              data={visibleCountries}
              keyExtractor={(country) => country.isoCode}
              keyboardShouldPersistTaps="handled"
              style={styles.countryList}
              renderItem={({ item: country }) => {
                const isSelected = country.isoCode === selectedCountry.isoCode;

                return (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`${country.name}, ${country.isoCode}, ${getCallingCode(country.isoCode)}`}
                    accessibilityState={{ selected: isSelected }}
                    onPress={() => selectCountry(country)}
                    style={({ pressed }) => [
                      styles.countryOption,
                      isSelected && styles.countryOptionSelected,
                      pressed && styles.countryOptionPressed,
                    ]}>
                    <Text style={styles.countryOptionFlag}>{country.flag}</Text>
                    <View style={styles.countryOptionText}>
                      <Text style={styles.countryOptionName}>{country.name}</Text>
                      <Text style={styles.countryOptionMeta}>
                        {country.isoCode} · {getCallingCode(country.isoCode)}
                      </Text>
                    </View>
                    {isSelected ? (
                      <SymbolView
                        name={{ ios: 'checkmark', android: 'check', web: 'check' }}
                        size={18}
                        tintColor={colors.navy}
                      />
                    ) : null}
                  </Pressable>
                );
              }}
              ListEmptyComponent={
                <Text style={styles.countryEmptyText}>No matching country</Text>
              }
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.navy,
  },
  hero: {
    alignItems: 'center',
    overflow: 'hidden',
    paddingTop: spacing.sm,
    paddingBottom: 36,
    paddingHorizontal: spacing.xxl,
    backgroundColor: colors.navy,
  },
  heroRoute: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  settingsRow: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.xs,
    paddingBottom: spacing.sm,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glass,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.15)',
  },
  settingsButtonPressed: {
    transform: [{ scale: 0.985 }],
  },
  brandGroup: {
    alignItems: 'center',
  },
  logoPlate: {
    width: 80,
    height: 80,
    marginBottom: spacing.md,
    borderRadius: radius.heroPlate,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    backgroundColor: colors.surface,
    boxShadow:
      '0px 12px 28px rgba(6, 19, 34, 0.32), 0px 2px 8px rgba(233, 163, 25, 0.16)',
  },
  logo: {
    width: 56,
    height: 56,
  },
  brandNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  brandName: {
    color: colors.brandText,
    fontSize: 22,
    lineHeight: 22,
    fontWeight: fontWeight.black,
    letterSpacing: 1,
  },
  brandDivider: {
    color: colors.wordmark,
    fontSize: 20,
    lineHeight: 22,
    fontWeight: fontWeight.bold,
  },
  brandNameArabic: {
    color: colors.wordmark,
    fontSize: 22,
    lineHeight: 22,
    fontWeight: fontWeight.bold,
    writingDirection: 'rtl',
  },
  tagline: {
    marginTop: 6,
    color: colors.tagline,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: fontWeight.medium,
    letterSpacing: 0.2,
    textAlign: 'center',
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
  countryModalBackdrop: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    justifyContent: 'flex-end',
    backgroundColor: colors.scrim,
  },
  countryModalDismissArea: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  countryModalCard: {
    width: '100%',
    paddingTop: spacing.xl,
    paddingRight: spacing.xl,
    paddingBottom: spacing.xl,
    paddingLeft: spacing.xl,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  countryModalHeader: {
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  countryModalTitle: {
    color: colors.title,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: fontWeight.bold,
  },
  countryModalClose: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  countryModalClosePressed: {
    backgroundColor: colors.phonePrefix,
  },
  countrySearch: {
    height: 44,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.phonePrefix,
  },
  countrySearchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    paddingVertical: 0,
    color: colors.fieldText,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: fontWeight.medium,
  },
  countryList: {
    maxHeight: 320,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  countryEmptyText: {
    paddingVertical: spacing.xxl,
    color: colors.subtitle,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  countryOption: {
    minHeight: 64,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  countryOptionSelected: {
    backgroundColor: colors.countrySelected,
  },
  countryOptionPressed: {
    opacity: 0.7,
  },
  countryOptionFlag: {
    fontSize: 24,
    lineHeight: 30,
  },
  countryOptionText: {
    flex: 1,
    marginLeft: spacing.md,
  },
  countryOptionName: {
    color: colors.fieldText,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: fontWeight.semibold,
  },
  countryOptionMeta: {
    ...typography.caption,
    marginTop: 2,
    color: colors.subtitle,
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
