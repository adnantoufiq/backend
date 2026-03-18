import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { authService } from './auth.service';

// Configure how notifications behave when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const notificationService = {
  /**
   * Request permission and register for push notifications.
   * Returns the Expo push token (or FCM token on Android).
   */
  registerForPushNotifications: async (): Promise<string | null> => {
    // Check/request permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('📵 Push notification permission denied');
      return null;
    }

    // Android requires a notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#6C63FF',
        sound: 'default',
      });
    }

    try {
      // Get device push token (Expo push token)
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: 'your-eas-project-id', // Replace with your EAS project ID
      });
      const token = tokenData.data;
      console.log('📱 Push token:', token);
      return token;
    } catch (error) {
      console.error('❌ Failed to get push token:', error);
      return null;
    }
  },

  /**
   * Register device token and sync with backend
   */
  syncTokenWithBackend: async (): Promise<void> => {
    try {
      const token = await notificationService.registerForPushNotifications();
      if (token) {
        await authService.updateFcmToken(token);
        console.log('✅ FCM token synced with backend');
      }
    } catch (error) {
      console.error('❌ Failed to sync FCM token:', error);
    }
  },

  /**
   * Add a listener for notification received while app is foregrounded
   */
  addNotificationReceivedListener: (
    handler: (notification: Notifications.Notification) => void
  ) => {
    return Notifications.addNotificationReceivedListener(handler);
  },

  /**
   * Add a listener for when user taps a notification
   */
  addNotificationResponseListener: (
    handler: (response: Notifications.NotificationResponse) => void
  ) => {
    return Notifications.addNotificationResponseReceivedListener(handler);
  },

  /**
   * Get last notification response (app opened via notification)
   */
  getLastNotificationResponse: () => {
    return Notifications.getLastNotificationResponseAsync();
  },

  /**
   * Clear badge count
   */
  clearBadge: async () => {
    await Notifications.setBadgeCountAsync(0);
  },
};
