import React, { ReactNode } from "react";
import {
  TextInput,
  TextInputProps,
  TextProps,
  TextStyle,
  TouchableOpacityProps,
  ViewStyle,
} from "react-native";

// --- General UI Component Types ---
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

// --- Data Types ---

export type UserType = {
  uid?: string;
  email?: string | null;
  name: string | null;
  image?: any;
  role?: "adopter" | "seller";
  petPostIds?: string[];
  favorites?: string[];
  createdAt?: any;
} | null;

export type PetType = {
  id: string;
  name: string;
  category: string;
  coatcolor?: string;
  breed: string;
  age?: number;
  description?: string;
  address?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  image?: string;
  ownerId: string; // Required for applications
  favoredBy?: string[];
  createdAt?: any;
  status: 'available' | 'sold';
  isDeleted: boolean;
  deletedAt?: any;
};

// * New: Adoption Application Type
export type AdoptionType = {
  id: string;
  petId: string;
  petName: string;
  petImage: string;
  adopterId: string;
  adopterName: string;
  ownerId: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: any;
};

// --- Context & Response Types ---

export type CloudinaryResponse = {
  success: boolean;
  data?: any;
  msg?: string;
};

export type ResponseType = {
  success: boolean;
  data?: any;
  msg?: string;
};

export type AuthContextType = {
  user: UserType;
  setUser: React.Dispatch<React.SetStateAction<UserType>>;
  login: (email: string, password: string) => Promise<ResponseType>;
  register: (email: string, password: string, name: string) => Promise<ResponseType>;
  updateUserData: (userId: string) => Promise<void>;
  promoteToSeller: (uid: string) => Promise<void>;
  addPetPostId: (uid: string, petId: string) => Promise<void>;
  removePetPostId: (uid: string, petId: string) => Promise<void>;
};

export type PetContextType = {
  pets: PetType[];
  addPet: (
    petData: Omit<PetType, "id" | "image" | "createdAt" | "favoredBy" | "status" | "isDeleted">,
    imageFile: any
  ) => Promise<CloudinaryResponse>;
  updatePet: (id: string, updates: Partial<PetType>) => Promise<CloudinaryResponse>;
  deletePet: (id: string) => Promise<CloudinaryResponse>;
  markAsSold: (id: string) => Promise<CloudinaryResponse>;
  toggleFavorite: (petId: string) => Promise<void>;
};

export type AdoptionContextType = {
  applications: AdoptionType[];
  loading: boolean;
  sendApplication: (pet: any) => Promise<ResponseType>;
  cancelApplication: (appId: string) => Promise<ResponseType>; // * Added
  updateApplicationStatus: (appId: string, petId: string, status: 'approved' | 'rejected') => Promise<ResponseType>;
};

// --- Other Props ---
export type SliderProps = {
  id: string;
  imageUrl: string;
  title?: string;
};

export type CategoryTypeProps = {
  type: string;
  imageUrl: string;
  id: string;
};

export type ChatRoomType = {
  id: string;
  participants: string[]; // [uid1, uid2]
  lastMessage: string;
  updatedAt: any;
  petId?: string; // Optional: Link chat to a specific pet
};

export type MessageType = {
  id: string;
  text: string;
  senderId: string;
  createdAt: any;
};