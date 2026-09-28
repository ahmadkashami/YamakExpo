import { SymbolView } from 'expo-symbols';
import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { getCallingCode, type Country } from '@/data/allowed-countries';
import {
  colors,
  fontWeight,
  interactionOpacity,
  radius,
  spacing,
  typography,
} from '@/theme';

type CountrySelectorModalProps = {
  visible: boolean;
  selectedCountry: Country;
  countries: Country[];
  onSelectCountry: (country: Country) => void;
  onClose: () => void;
};

export function CountrySelectorModal({
  visible,
  selectedCountry,
  countries,
  onSelectCountry,
  onClose,
}: CountrySelectorModalProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const visibleCountries = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

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
  }, [countries, searchQuery]);

  function closeModal() {
    setSearchQuery('');
    onClose();
  }

  function selectCountry(country: Country) {
    onSelectCountry(country);
    closeModal();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={closeModal}>
      <View style={styles.countryModalBackdrop}>
        <Pressable
          accessible={false}
          style={styles.countryModalDismissArea}
          onPress={closeModal}
        />
        <View style={styles.countryModalCard}>
          <View style={styles.countryModalHeader}>
            <Text style={styles.countryModalTitle}>Select country</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close country selector"
              onPress={closeModal}
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
              value={searchQuery}
              onChangeText={setSearchQuery}
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
  );
}

const styles = StyleSheet.create({
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
    opacity: interactionOpacity.pressed,
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
});
