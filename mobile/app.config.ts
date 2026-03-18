import { ExpoConfig, ConfigContext } from 'expo/config';
import fs from 'fs';
import path from 'path';

const hasFile = (p: string) => fs.existsSync(path.resolve(__dirname, p));

export default ({ config }: ConfigContext): ExpoConfig => {
  const iconPath = './assets/icon.png';
  const splashPath = './assets/splash.png';
  const adaptiveIconPath = './assets/adaptive-icon.png';
  const notificationIconPath = './assets/notification-icon.png';
  const googleServicesPath = './google-services.json';

  return {
    ...config,
    name: 'Mini Social Feed',
    slug: 'mini-social-feed',
    version: '1.0.0',
    orientation: 'portrait',
    ...(hasFile(iconPath) ? { icon: iconPath } : {}),
    userInterfaceStyle: 'light',
    ...(hasFile(splashPath)
      ? {
          splash: {
            image: splashPath,
            resizeMode: 'contain',
            backgroundColor: '#6C63FF',
          },
        }
      : {}),
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.minisocialfeed.app',
    },
    android: {
      ...(hasFile(adaptiveIconPath)
        ? {
            adaptiveIcon: {
              foregroundImage: adaptiveIconPath,
              backgroundColor: '#6C63FF',
            },
          }
        : {}),
      package: 'com.minisocialfeed.app',
      ...(hasFile(googleServicesPath) ? { googleServicesFile: googleServicesPath } : {}),
      permissions: ['RECEIVE_BOOT_COMPLETED', 'VIBRATE'],
    },
    plugins: [
      'expo-router',
      [
        'expo-notifications',
        {
          ...(hasFile(notificationIconPath) ? { icon: notificationIconPath } : {}),
          color: '#6C63FF',
          defaultChannel: 'default',
          sounds: [],
        },
      ],
    ],
    scheme: 'minisocialfeed',
    extra: {
      API_BASE_URL: process.env.API_BASE_URL || 'http://192.168.0.110:5000/api',
      eas: { projectId: 'your-eas-project-id' },
    },
  };
};
