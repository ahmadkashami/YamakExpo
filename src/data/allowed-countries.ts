import { getCountryCallingCode, type CountryCode } from 'libphonenumber-js';

export type Country = {
  isoCode: CountryCode;
  name: string;
  flag: string;
};

type AllowedCountryConfig = {
  isoCode: CountryCode;
  name: string;
};

const allowedCountryConfig: readonly AllowedCountryConfig[] = [
  { isoCode: 'KW', name: 'Kuwait' },
  { isoCode: 'SA', name: 'Saudi Arabia' },
  { isoCode: 'AE', name: 'United Arab Emirates' },
  { isoCode: 'QA', name: 'Qatar' },
  { isoCode: 'BH', name: 'Bahrain' },
  { isoCode: 'OM', name: 'Oman' },
  { isoCode: 'SY', name: 'Syria' },
  { isoCode: 'JO', name: 'Jordan' },
];

const defaultCountryIsoCode: CountryCode = 'KW';

const regionalIndicatorOffset = 0x1f1e6;
const uppercaseLetterA = 65;

function getFlag(isoCode: string): string {
  return Array.from(isoCode.toUpperCase())
    .map((character) =>
      String.fromCodePoint(regionalIndicatorOffset + character.charCodeAt(0) - uppercaseLetterA),
    )
    .join('');
}

function toCountry(country: AllowedCountryConfig): Country {
  return {
    isoCode: country.isoCode,
    name: country.name,
    flag: getFlag(country.isoCode),
  };
}

export function getCallingCode(isoCode: CountryCode): string {
  return `+${getCountryCallingCode(isoCode)}`;
}

export function getAllowedCountries(): Country[] {
  return allowedCountryConfig.map(toCountry);
}

const defaultCountryConfig =
  allowedCountryConfig.find((country) => country.isoCode === defaultCountryIsoCode) ??
  allowedCountryConfig[0];

export const defaultCountry: Country = toCountry(defaultCountryConfig);
