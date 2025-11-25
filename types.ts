import React, { ReactNode } from "react";
import {
  TextInput,
  TextInputProps,
  TextProps,
  TextStyle,
  TouchableOpacityProps,
  ViewStyle,
} from "react-native";

export type ScreenWrapperProps = {
  style?: ViewStyle;
  children: React.ReactNode;
};

export type TypoProps = {
  size?: number;
  color?: string;
  fontWeight?: TextStyle["fontWeight"];
  children: React.ReactNode;
  style?: TextStyle | TextStyle[];
  textProps?: TextProps;
};

export type accountOptionType = {
  title: string;
  icon: React.ReactNode;
  bgColor: string;
  routeName?: any;
};

export type IconComponent = React.ComponentType<{
  height?: number;
  width?: number;
  strokeWidth?: number;
  color?: string;
  fill?: string;
}>;

export type IconProps = {
  name: string;
  color?: string;
  size?: number;
  strokeWidth?: number;
  fill?: string;
};

export type HeaderProps = {
  title?: string;
  style?: ViewStyle;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
};

export type BackButtonProps = {
  style?: ViewStyle;
  iconSize?: number;
};

export interface InputProps extends TextInputProps {
  icon?: React.ReactNode;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  inputRef?: React.RefObject<TextInput>;
}

export interface CustomButtonProps extends TouchableOpacityProps {
  style?: ViewStyle;
  onPress?: () => void;
  loading?: boolean;
  children: React.ReactNode;
}

export type ImageUploadProps = {
  file?: any;
  onSelect: (file: any) => void;
  onClear: () => void;
  containerStyle?: ViewStyle;
  imageStyle?: ViewStyle;
  placeholder?: string;
};

export type SliderProps = {
  id: string;
  imageUrl: string;
  title?: string;
};

/**
 * 🔧 Updated UserType
 * - Removed noOfPosts
 * - Added petPostIds (string of comma-separated IDs)
 */
export type UserType = {
  uid?: string;
  email?: string | null;
  name: string | null;
  image?: any;
  role?: "adopter" | "seller";
  petPostIds?: string; // 👈 new field
} | null;

export type UserDataType = {
  name: string;
  image?: any;
};

export type AuthContextType = {
  user: UserType;
  setUser: Function;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; msg?: string }>;
  register: (
    email: string,
    password: string,
    name: string
  ) => Promise<{ success: boolean; msg?: string }>;
  updateUserData: (userId: string) => Promise<void>;
  promoteToSeller: (uid: string) => Promise<void>;
  addPetPostId: (uid: string, petId: string) => Promise<void>;   // 👈 new
  removePetPostId: (uid: string, petId: string) => Promise<void>; // 👈 new
};

export type PetType = {
  id: string; // Firestore doc ID
  name: string; // Pet name
  category: string; // e.g. "Dog", "Cat"
  age?: number; // optional
  description?: string; 
  address?: string; 
  image?: string; 
  createdAt?: Date;
  ownerId?: string; 
};

export type PetContextType = {
  pets: PetType[];
  addPet: (
    petData: Omit<PetType, "id" | "image" | "createdAt">,
    imageFile: any
  ) => Promise<{ success: boolean; msg?: string }>;
  updatePet: (
    id: string,
    updates: Partial<PetType>
  ) => Promise<{ success: boolean; msg?: string }>;
  deletePet: (id: string) => Promise<{ success: boolean; msg?: string }>;
};

export type ResponseType = {
  success: boolean;
  data?: any;
  msg?: string;
};

export type ModalWrapperProps = {
  style?: ViewStyle;
  children: React.ReactNode;
  bg?: string;
};

export type UploadModalProps = {
  modalVisible: boolean;
  onBackPress: () => void;
  onCameraPress: () => void;
  onGalleryPress: () => void;
  onRemovePress: () => void;
  isLoading?: boolean;
};

export type CategoryTypeProps = {
  type: string;
  imageUrl: string;
  id: string;
};
