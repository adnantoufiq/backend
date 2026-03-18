import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Mini Social Feed',
  slug: 'mini-social-feed',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#6C63FF',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.minisocialfeed.app',
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#6C63FF',
    },
    package: 'com.minisocialfeed.app',
    googleServicesFile: './google-services.json',
    permissions: ['RECEIVE_BOOT_COMPLETED', 'VIBRATE'],
  },
  plugins: [
    'expo-router',
    [
      'expo-notifications',
      {
        icon: './assets/notification-icon.png',
        color: '#6C63FF',
        defaultChannel: 'default',
        sounds: [],
      },
    ],
  ],
  scheme: 'minisocialfeed',
  extra: {
    API_BASE_URL: process.env.API_BASE_URL || 'http://10.0.2.2:5000/api',
    eas: { projectId: 'your-eas-project-id' },
  },
});
