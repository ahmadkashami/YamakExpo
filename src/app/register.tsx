import { StatusBar } from 'expo-status-bar';
import { SymbolView } from 'expo-symbols';
import { parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js';
import { useMemo, useState } from 'react';
import {
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
  const callingCode = getCallingCode(selectedCountry.isoCode);

  const nameError = nameTouched ? getNameError(name) : null;
  const emailError = emailTouched ? getEmailError(email) : null;
  const passwordError = passwordTouched ? getPasswordError(password) : null;
  const termsError = termsTouched && !isAgreed ? 'You must agree to the Terms and Privacy Policy' : null;

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

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />
      <View style={styles.brand}>
        <View style={styles.logoPlate}>
          <Image source={appLogo} style={styles.logo} resizeMode="contain" />
        </View>
        <View style={styles.brandNameRow}>
          <Text style={styles.brandName}>YAMAK</Text>
          <Text style={styles.brandDivider}>•</Text>
          <Text style={styles.brandNameArabic}>يمك</Text>
        </View>
        <Text style={styles.tagline}>Kuwait’s road &amp; mobility partner</Text>
      </View>
      <View style={styles.surface}>
        <ScrollView
          style={styles.formScroll}
          contentContainerStyle={styles.formContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}>
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
  brand: {
    alignItems: 'center',
    paddingTop: 28,
    paddingBottom: 32,
    paddingHorizontal: spacing.xxl,
  },
  logoPlate: {
    width: 100,
    height: 100,
    borderRadius: radius.lg,
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  logo: {
    width: 76,
    height: 76,
  },
  brandNameRow: {
    height: 24,
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    color: colors.brandText,
    ...typography.brand,
  },
  brandDivider: {
    color: colors.brandText,
    ...typography.brand,
  },
  brandNameArabic: {
    color: colors.gold,
    ...typography.brand,
    writingDirection: 'rtl',
  },
  tagline: {
    marginTop: spacing.xs,
    color: colors.tagline,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: fontWeight.regular,
  },
  surface: {
    flex: 1,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    backgroundColor: colors.surface,
  },
  formScroll: {
    flex: 1,
  },
  formContent: {
    flexGrow: 1,
    paddingTop: 28,
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
