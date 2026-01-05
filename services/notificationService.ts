// @/services/notificationService.ts
import { firestore } from "@/config/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export const createNotification = async (userId: string, title: string, message: string, data?: any) => {
  try {
    await addDoc(collection(firestore, "notifications"), {
      receiverId: userId,
      title,
      message,
      data: data || {},
      isRead: false,
      createdAt: serverTimestamp(),
    });
  } catch (e) {
    console.error("Notification Error:", e);
  }
};