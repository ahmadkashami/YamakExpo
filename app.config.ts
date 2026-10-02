import type { ConfigContext } from 'expo/config';

/**
 * Dynamic Expo config — the ONLY responsibility is to add the
 * `react-native-maps` config plugin, fed from environment variables.
 *
 * `app.json` remains the static source of truth for every other value:
 * Expo evaluates this file with `config` set to the resolved `app.json`
 * content, and we re-emit it wholesale (spread), so all existing keys —
 * name, slug, version, orientation, icon, scheme, userInterfaceStyle,
 * ios/android/web settings, plugins, experiments, location permissions,
 * splash config — are preserved byte-for-byte via the spread.
 *
 * No key is ever hardcoded here: when an env var is absent the option is
 * `undefined`, and the react-native-maps plugin treats falsy options as
 * "not set" (safe no-op) for the platform that has no key.
 */
const mapsPlugin = [
  'react-native-maps',
  {
    androidGoogleMapsApiKey: process.env.GOOGLE_MAPS_ANDROID_API_KEY,
    iosGoogleMapsApiKey: process.env.GOOGLE_MAPS_IOS_API_KEY,
  },
] as [string, { androidGoogleMapsApiKey?: string; iosGoogleMapsApiKey?: string }];

export default ({ config }: ConfigContext) => ({
  ...config,
  plugins: [...(config.plugins ?? []), mapsPlugin],
});