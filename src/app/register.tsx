import { StatusBar } from 'expo-status-bar';
import { SymbolView } from 'expo-symbols';
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

const appLogo = require('@/assets/images/appLogo.png');

const countries = getAllowedCountries();

const colors = {
  navy: '#0C1C33',
  gold: '#FBBF24',
  brandText: '#F8FAFC',
  tagline: '#CBD5E1',
  surface: '#FFFFFF',
  title: '#0F172A',
  subtitle: '#64748B',
  fieldLabel: '#334155',
  fieldText: '#1E293B',
  placeholder: '#94A3B8',
  border: '#E2E8F0',
  phonePrefix: '#F8FAFC',
  countrySelected: '#FFF8EB',
} as const;

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
  const callingCode = getCallingCode(selectedCountry.isoCode);

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
              <View style={styles.inputContainer}>
                <SymbolView
                  name={{ ios: 'person', android: 'person', web: 'person' }}
                  size={18}
                  tintColor={colors.placeholder}
                  style={styles.leadingIcon}
                />
                <TextInput
                  accessibilityLabel="Full Name"
                  value={name}
                  onChangeText={setName}
                  placeholder="Your name"
                  placeholderTextColor={colors.placeholder}
                  selectionColor={colors.navy}
                  autoCapitalize="words"
                  autoComplete="name"
                  style={styles.input}
                />
              </View>
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Email</Text>
              <View style={styles.inputContainer}>
                <SymbolView
                  name={{ ios: 'envelope', android: 'mail', web: 'mail' }}
                  size={18}
                  tintColor={colors.placeholder}
                  style={styles.leadingIcon}
                />
                <TextInput
                  accessibilityLabel="Email"
                  value={email}
                  onChangeText={setEmail}
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
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Password</Text>
              <View style={[styles.inputContainer, styles.passwordInputContainer]}>
                <SymbolView
                  name={{ ios: 'lock', android: 'lock', web: 'lock' }}
                  size={18}
                  tintColor={colors.placeholder}
                  style={styles.leadingIcon}
                />
                <TextInput
                  accessibilityLabel="Password"
                  value={password}
                  onChangeText={setPassword}
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
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Phone</Text>
              <View style={styles.phoneInputContainer}>
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
                  accessibilityLabel="Phone number"
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="5XXX XXXX"
                  placeholderTextColor={colors.placeholder}
                  selectionColor={colors.navy}
                  keyboardType="number-pad"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={[styles.input, styles.phoneInput]}
                />
              </View>
            </View>
            <View style={styles.agreementRow}>
              <Pressable
                accessibilityRole="checkbox"
                accessibilityLabel="Agree to the Terms of Service and Privacy Policy"
                accessibilityState={{ checked: isAgreed }}
                hitSlop={10}
                onPress={() => setIsAgreed((agreed) => !agreed)}
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
    paddingHorizontal: 24,
  },
  logoPlate: {
    width: 64,
    height: 64,
    borderRadius: 16,
    padding: 8,
    backgroundColor: colors.surface,
  },
  logo: {
    width: 48,
    height: 48,
  },
  brandNameRow: {
    height: 24,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    color: colors.brandText,
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '700',
  },
  brandDivider: {
    color: colors.brandText,
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '700',
  },
  brandNameArabic: {
    color: colors.gold,
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '700',
    writingDirection: 'rtl',
  },
  tagline: {
    marginTop: 4,
    color: colors.tagline,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '400',
  },
  surface: {
    flex: 1,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    backgroundColor: colors.surface,
  },
  formScroll: {
    flex: 1,
  },
  formContent: {
    flexGrow: 1,
    paddingTop: 28,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  form: {
    marginTop: 8,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    marginBottom: 6,
    color: colors.fieldLabel,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
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
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  leadingIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 46,
    padding: 0,
    borderWidth: 0,
    color: colors.fieldText,
    backgroundColor: 'transparent',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
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
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  callingCodePrefix: {
    width: 112,
    paddingHorizontal: 8,
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
  flag: {
    fontSize: 16,
    lineHeight: 20,
  },
  countryCode: {
    color: colors.fieldLabel,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
  callingCode: {
    color: colors.subtitle,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
  phoneInput: {
    paddingHorizontal: 14,
  },
  agreementRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  agreementCheckbox: {
    width: 22,
    height: 22,
    marginTop: 1,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 6,
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
    flex: 1,
    color: colors.subtitle,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
  },
  agreementLink: {
    color: colors.title,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  countryModalBackdrop: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 16,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(12, 28, 51, 0.55)',
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
    paddingTop: 20,
    paddingRight: 20,
    paddingBottom: 20,
    paddingLeft: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: colors.surface,
  },
  countryModalHeader: {
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  countryModalTitle: {
    color: colors.title,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
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
    paddingHorizontal: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.phonePrefix,
  },
  countrySearchInput: {
    flex: 1,
    marginLeft: 8,
    paddingVertical: 0,
    color: colors.fieldText,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '500',
  },
  countryList: {
    maxHeight: 320,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  countryEmptyText: {
    paddingVertical: 24,
    color: colors.subtitle,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  countryOption: {
    minHeight: 64,
    paddingHorizontal: 12,
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
    marginLeft: 12,
  },
  countryOptionName: {
    color: colors.fieldText,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
  },
  countryOptionMeta: {
    marginTop: 2,
    color: colors.subtitle,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
  title: {
    color: colors.title,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 8,
    color: colors.subtitle,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  },
});
