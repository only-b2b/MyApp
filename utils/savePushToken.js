// customer app - utils/savePushToken.js

import messaging from "@react-native-firebase/messaging";
import { API_BASE_URL } from "../config";

export const saveUserFCMToken = async (firebaseUid) => {
  try {
    // Request permission
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (!enabled) {
      console.log("Push permission denied");
      return;
    }

    // Get FCM token
    const token = await messaging().getToken();
    if (!token) return;

    // Save to backend
    await fetch(`${API_BASE_URL}/users/save-token`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firebase_uid: firebaseUid,
        push_token:   token,
      }),
    });

    console.log("✅ User FCM token saved");

    // Listen for token refresh
    return messaging().onTokenRefresh(async (newToken) => {
      await fetch(`${API_BASE_URL}/users/save-token`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firebase_uid: firebaseUid,
          push_token:   newToken,
        }),
      });
    });
  } catch (err) {
    console.error("Save FCM token error:", err.message);
  }
};