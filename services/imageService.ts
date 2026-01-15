import { ResponseType } from "@/types";
import axios from "axios";

const API_URL = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "signed_preset";
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${API_URL}/image/upload`;

export const uploadFileToCloudinary = async (
  file: { uri?: string } | string,
  folderName: string
): Promise<ResponseType> => {
  try {
    if (typeof file === "string") return { success: true, data: file };

    if (file && file.uri) {
      const formData = new FormData();
      formData.append("file", {
        uri: file.uri,
        type: "image/jpeg",
        name: file.uri.split("/").pop() || "file.jpg",
      } as any);
      formData.append("upload_preset", UPLOAD_PRESET);
      formData.append("folder", folderName);

      const response = await axios.post(CLOUDINARY_UPLOAD_URL, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      return { success: true, data: response.data.secure_url };
    }

    return { success: true };
  } catch (error: any) {
    console.error("Cloudinary upload error:", error?.response?.data || error);
    return { success: false, msg: error.message || "Could not upload file" };
  }
};

export const getProfileImage = (file: any) => {
  if (typeof file === "string") return { uri: file };
  if (file && file.uri) return { uri: file.uri };
  return require("../assets/Avatar.jpg");
};

export const getPetImage = (file: any) => {
  if (typeof file === "string") return { uri: file };
  if (file && file.uri) return { uri: file.uri };
  return require("../assets/Logo.png");
};