import { firestore } from "@/config/firebase";
import { ResponseType, UserDataType } from "@/types";
import { doc, updateDoc, deleteField } from "firebase/firestore";
import { uploadFileToCloudinary } from "./imageService";

export const updateUser = async (
  uid: string,
  updatedData: UserDataType
): Promise<ResponseType> => {
  try {
    console.log("updateUser received:", { uid, imageType: typeof updatedData.image, hasUri: (updatedData as any).image?.uri });

    if (updatedData.image && (updatedData as any).image?.uri) {
      const uploadRes = await uploadFileToCloudinary((updatedData as any).image, "users");
      console.log("Cloudinary upload result:", uploadRes);

      if (!uploadRes.success) {
        return { success: false, msg: uploadRes.msg || "Failed to upload image" };
      }
      updatedData.image = uploadRes.data as string;
    }

    if (updatedData.image === null) {
      const userRef = doc(firestore, "users", uid);
      await updateDoc(userRef, { image: deleteField() });
      return { success: true, msg: "User image removed successfully" };
    }

    const userRef = doc(firestore, "users", uid);
    await updateDoc(userRef, updatedData);
    console.log("Firestore update success for:", uid);

    return { success: true, msg: "User Updated successfully" };
  } catch (error: any) {
    console.error("Error updating user:", error);
    return { success: false, msg: error?.message };
  }
};
