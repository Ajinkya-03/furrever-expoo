import { firestore } from "@/config/firebase";
import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { Platform } from "react-native";

// --- TYPES ---
export interface NotificationPayload {
  userId: string;       // Recipient ID
  title: string;        // Bold text
  message: string;      // Body text
  data?: object;        // Extra data for navigation (e.g., { petId: '123' })
  type?: 'adoption' | 'chat' | 'system';
}

/**
 * PRODUCTION NOTIFICATION SERVICE
 * Handles both database logging and real-time device push notifications.
 */

// 1. Fetch User's Push Token from Firestore
const getUserPushToken = async (userId: string): Promise<string | null> => {
  try {
    const userSnap = await getDoc(doc(firestore, "users", userId));
    if (userSnap.exists()) {
      return userSnap.data().pushToken || null;
    }
    return null;
  } catch (error) {
    console.error("Error fetching push token:", error);
    return null;
  }
};

// 2. Send Actual Push Notification via Expo API
export const sendExternalPush = async (expoPushToken: string, title: string, body: string, data: any) => {
  const message = {
    to: expoPushToken,
    sound: 'default',
    title,
    body,
    data: data || {},
    _displayInForeground: true, // Show alert even if app is open
  };

  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });
  } catch (e) {
    console.error("Expo Push API Error:", e);
  }
};

// 3. Main Production Function
export const createNotification = async ({
  userId,
  title,
  message,
  data = {},
  type = 'system'
}: NotificationPayload) => {
  if (!userId) return { success: false, msg: "No recipient ID provided" };

  try {
    // A. Log to Firestore (In-app history)
    // We do this first so the user has a record even if the push fails
    const notificationRef = await addDoc(collection(firestore, "notifications"), {
      receiverId: userId,
      title,
      message,
      data,
      type,
      isRead: false,
      createdAt: serverTimestamp(),
    });

    // B. Attempt to send Real Push Notification
    const pushToken = await getUserPushToken(userId);
    if (pushToken) {
      await sendExternalPush(pushToken, title, message, data);
    }

    return { success: true, id: notificationRef.id };
  } catch (error: any) {
    console.error("Production Notification Error:", error);
    return { success: false, msg: error.message };
  }
};