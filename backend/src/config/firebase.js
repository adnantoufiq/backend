const admin = require('firebase-admin');

let firebaseInitialized = false;

const initializeFirebase = () => {
  // Only initialize if credentials are provided
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    console.warn('Firebase credentials not configured. Push notifications will be disabled.');
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
      console.log('Firebase Admin SDK initialized');
    } catch (error) {
      console.error('Firebase initialization error:', error.message);
      return false;
    }
  }

  return true;
};

const sendPushNotification = async ({ fcmToken, title, body, data = {} }) => {
  if (!firebaseInitialized) {
    console.log(`[FCM Skipped] ${title}: ${body}`);
    return { ok: false, skipped: true, reason: 'not-initialized' };
  }

  if (!fcmToken) {
    console.log('No FCM token for this user, skipping notification');
    return { ok: false, skipped: true, reason: 'missing-token' };
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
    console.log(`FCM notification sent: ${response}`);
    return { ok: true, messageId: response };
  } catch (error) {
    const normalizedMessage = String(error.message || '').toLowerCase();

    if (
      error.code === 'messaging/registration-token-not-registered' ||
      error.code === 'messaging/invalid-registration-token'
    ) {
      console.warn('Invalid or expired FCM token. Clearing token is recommended.');
      return { ok: false, reason: 'invalid-token', code: error.code, message: error.message };
    }

    if (
      error.code === 'messaging/mismatched-credential' ||
      normalizedMessage.includes('senderid mismatch')
    ) {
      console.warn('Sender ID mismatch for FCM token. Clearing token is recommended.');
      return { ok: false, reason: 'sender-id-mismatch', code: error.code, message: error.message };
    }

    console.error('FCM send error:', error.message);
    return { ok: false, reason: 'unknown-error', code: error.code, message: error.message };
  }
};

module.exports = { initializeFirebase, sendPushNotification };
