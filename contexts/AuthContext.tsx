import { auth, firestore } from "@/config/firebase";
import { AuthContextType, UserType } from "@/types";
import { useRouter } from "expo-router";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
} from "firebase/auth";
import {
  arrayRemove,
  arrayUnion,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc
} from "firebase/firestore";
import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserType | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await updateUserData(firebaseUser.uid);
        router.replace("/(tabs)");
      } else {
        setUser(null);
        router.replace("/(auth)/welcome");
      }
    });
    return () => unsub();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { success: true };
    } catch (error: any) {
      let msg = error.message;
      if (msg.includes("(auth/invalid-credential)")) msg = "Wrong credentials";
      if (msg.includes("(auth/invalid-email)")) msg = "Please enter a valid email id";
      return { success: false, msg };
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      const response = await createUserWithEmailAndPassword(auth, email, password);
      const uid = response?.user?.uid;

      const userData = {
        name,
        email,
        uid,
        role: "adopter",
        petPostIds: [],
        favorites: [], // * Initialize empty favorites array in DB
        createdAt: serverTimestamp(),
      };

      await setDoc(doc(firestore, "users", uid), userData);
      return { success: true };
    } catch (error: any) {
      let msg = error.message;
      if (msg.includes("(auth/email-already-in-use)")) msg = "This email already exists";
      if (msg.includes("(auth/invalid-email)")) msg = "Please enter a valid email";
      if (msg.includes("auth/weak-password")) msg = "Minimum 6 characters required";
      return { success: false, msg };
    }
  };

  const updateUserData = async (uid: string) => {
    try {
      const docSnap = await getDoc(doc(firestore, "users", uid));
      if (docSnap.exists()) {
        const data = docSnap.data();
        const userData = {
          uid: data?.uid ?? null,
          email: data?.email ?? null,
          name: data?.name ?? null,
          image: data?.image ?? null,
          role: data?.role ?? "adopter",
          petPostIds: data?.petPostIds ?? [],
          favorites: data?.favorites ?? [], // * CRITICAL: Load favorites from DB
          createdAt: data?.createdAt ?? null,
        } as UserType;
        setUser(userData);
      }
    } catch (error: any) {
      console.error("Error updating user data:", error.message);
    }
  };

  const promoteToSeller = async (uid: string) => {
    try {
      const docRef = doc(firestore, "users", uid);
      await updateDoc(docRef, { role: "seller" });
      setUser((prev) => (prev ? { ...prev, role: "seller" } : prev));
    } catch (error: any) {
      console.error("Error promoting user:", error.message);
    }
  };

  const addPetPostId = async (uid: string, petId: string) => {
    try {
      const docRef = doc(firestore, "users", uid);
      await updateDoc(docRef, {
        petPostIds: arrayUnion(petId)
      });
      setUser((prev) => (prev ? { 
        ...prev, 
        petPostIds: [...(prev.petPostIds || []), petId] 
      } : prev));
    } catch (error: any) {
      console.error("Error adding PetPostId:", error.message);
    }
  };

  const removePetPostId = async (uid: string, petId: string) => {
    try {
      const docRef = doc(firestore, "users", uid);
      await updateDoc(docRef, {
        petPostIds: arrayRemove(petId)
      });
      setUser((prev) => (prev ? { 
        ...prev, 
        petPostIds: (prev.petPostIds || []).filter(id => id !== petId) 
      } : prev));
    } catch (error: any) {
      console.error("Error removing PetPostId:", error.message);
    }
  };

  const contextValue = {
    user,
    setUser,
    login,
    register,
    updateUserData,
    promoteToSeller,
    addPetPostId,
    removePetPostId,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be wrapped inside AuthProvider");
  }
  return context;
};