const admin = require('firebase-admin');

let firebaseInitialized = false;

const initializeFirebase = () => {
  // Only initialize if credentials are provided
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    console.warn('⚠️  Firebase credentials not configured. Push notifications will be disabled.');
    return false;
  }

  if (!admin.apps.length) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID,
          privateKey: privateKey.replace(/\\n/g, '\n'),
          clientEmail,
          clientId: process.env.FIREBASE_CLIENT_ID,
        }),
      });
      firebaseInitialized = true;
      console.log('✅ Firebase Admin SDK initialized');
    } catch (error) {
      console.error('❌ Firebase initialization error:', error.message);
      return false;
    }
  }

  return true;
};

const sendPushNotification = async ({ fcmToken, title, body, data = {} }) => {
  if (!firebaseInitialized) {
    console.log(`📵 [FCM Skipped] ${title}: ${body}`);
    return null;
  }

  if (!fcmToken) {
    console.log('📵 No FCM token for this user, skipping notification');
    return null;
  }

  try {
    const message = {
      token: fcmToken,
      notification: { title, body },
      data: { ...data, clickAction: 'OPEN_FEED' },
      android: {
        priority: 'high',
        notification: { sound: 'default', channelId: 'default' },
      },
      apns: {
        payload: { aps: { sound: 'default', badge: 1 } },
      },
    };

    const response = await admin.messaging().send(message);
    console.log(`✅ FCM notification sent: ${response}`);
    return response;
  } catch (error) {
    if (error.code === 'messaging/registration-token-not-registered') {
      console.warn('⚠️  Invalid or expired FCM token. Consider clearing it from the user profile.');
      return null;
    }
    console.error('❌ FCM send error:', error.message);
    return null;
  }
};

module.exports = { initializeFirebase, sendPushNotification };
