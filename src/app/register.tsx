import { StatusBar } from 'expo-status-bar';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const appLogo = require('@/assets/images/appLogo.png');

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
} as const;

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

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
