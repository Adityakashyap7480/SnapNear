import type { ConfigContext, ExpoConfig } from 'expo/config';

const env = process.env;

const INTER_WEIGHTS = { 300: 'Light', 400: 'Regular', 500: 'Medium', 600: 'SemiBold', 700: 'Bold', 800: 'ExtraBold', 900: 'Black' };
const OUTFIT_WEIGHTS = { 400: 'Regular', 500: 'Medium', 600: 'SemiBold', 700: 'Bold', 800: 'ExtraBold', 900: 'Black' };

const fontFiles = (pkg: string, family: string, weights: Record<number, string>) =>
  Object.entries(weights).map(([weight, name]) => ({
    path: `./node_modules/@expo-google-fonts/${pkg}/${weight}${name}/${family}_${weight}${name}.ttf`,
    weight: Number(weight),
  }));

const inter = fontFiles('inter', 'Inter', INTER_WEIGHTS);
const outfit = fontFiles('outfit', 'Outfit', OUTFIT_WEIGHTS);

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: env.APP_NAME || 'SnapNear',
  slug: env.EXPO_SLUG || 'snapnear',
  owner: env.EXPO_OWNER || 'aditya0804',
  // snapnear = deep links; in.snapnear.app = Google OAuth redirect (Application.applicationId:/oauthredirect)
  scheme: ['snapnear', 'in.snapnear.app'],
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  backgroundColor: '#f8fafc',
  ios: {
    bundleIdentifier: env.IOS_BUNDLE_ID || 'in.snapnear.app',
    supportsTablet: true,
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        'SnapNear uses your location to match customers and photographers within 10 km.',
    },
  },
  android: {
    package: env.ANDROID_PACKAGE || 'in.snapnear.app',
    adaptiveIcon: {
      // Matches brand logo gradient base so launcher icon is yellow→orange, not flat orange
      backgroundColor: '#ffb347',
      backgroundImage: './assets/android-icon-background.png',
      foregroundImage: './assets/android-icon-foreground.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    permissions: [
      'VIBRATE',
      'RECEIVE_BOOT_COMPLETED',
      'POST_NOTIFICATIONS',
      'ACCESS_COARSE_LOCATION',
      'ACCESS_FINE_LOCATION',
    ],
    predictiveBackGestureEnabled: false,
  },
  web: {
    bundler: 'metro',
    output: 'single',
    favicon: './assets/favicon.png',
    name: 'SnapNear | Book a Photographer at Your Doorstep',
    description: 'SnapNear - Book verified photographers & videographers at your doorstep in minutes.',
    themeColor: '#0F172A',
  },
  plugins: [
    'expo-router',
    'expo-asset',
    'expo-web-browser',
    'expo-secure-store',
    [
      'expo-notifications',
      {
        icon: './assets/android-icon-foreground.png',
        color: '#ff8008',
        defaultChannel: 'shoots',
      },
    ],
    [
      'expo-location',
      {
        locationWhenInUsePermission:
          'Allow SnapNear to use your location to match shoots within 10 km.',
      },
    ],
    ['expo-audio', { microphonePermission: false, recordAudioAndroid: false }],
    '@react-native-community/datetimepicker',
    [
      'expo-font',
      {
        android: {
          fonts: [
            { fontFamily: 'Inter', fontDefinitions: inter },
            { fontFamily: 'Outfit', fontDefinitions: outfit },
          ],
        },
        ios: { fonts: [...inter, ...outfit].map((f) => f.path) },
      },
    ],
    [
      'expo-splash-screen',
      { backgroundColor: '#0f172a', image: './assets/splash-icon.png', imageWidth: 160 },
    ],
  ],
  experiments: { typedRoutes: false },
  extra: {
    eas: {
      projectId: env.EAS_PROJECT_ID || '7283d540-c50a-4a52-9ac6-d1c394306092',
    },
  },
});
