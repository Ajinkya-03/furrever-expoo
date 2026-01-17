import { firestore } from "@/config/firebase";
import { ResponseType, UserDataType } from "@/types";
import { doc, updateDoc, deleteField } from "firebase/firestore";
import { uploadFileToCloudinary } from "./imageService";

export const updateUser = async (
  uid: string,
  updatedData: UserDataType
): Promise<ResponseType> => {
  try {
    const userRef = doc(firestore, "users", uid);
    const updates: any = { name: updatedData.name };

    // --- SCENARIO 1: New Image Upload ---
    // Check if the image property contains a new file object from the picker
    if (updatedData.image && typeof updatedData.image === 'object' && updatedData.image.uri) {
      const uploadRes = await uploadFileToCloudinary(updatedData.image, "users");

      if (!uploadRes.success) {
        return { success: false, msg: uploadRes.msg || "Failed to upload image" };
      }
      // Set the Cloudinary URL to the Firestore payload
      updates.image = uploadRes.data as string;
    } 
    
    // --- SCENARIO 2: Image Removal ---
    else if (updatedData.image === null) {
      updates.image = deleteField();
    }
    else if (typeof updatedData.image === 'string') {
        updates.image = updatedData.image;
    }

    // Perform the atomic update
    await updateDoc(userRef, updates);

    return { success: true, msg: "Profile updated successfully" };
  } catch (error: any) {
    console.error("Error updating user profile:", error);
    return { 
      success: false, 
      msg: error?.message || "An unexpected error occurred while updating profile." 
    };
  }
};