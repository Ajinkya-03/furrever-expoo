import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "expo-router";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
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
import { auth, firestore } from "@/config/firebase";
import { AuthContextType, UserType, ResponseType } from "@/types";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserType | null>(null);
  const router = useRouter();

  const updateUserData = useCallback(async (uid: string) => {
    if (!uid) return;
    try {
      const docSnap = await getDoc(doc(firestore, "users", uid));
      if (docSnap.exists()) {
        const data = docSnap.data();
        // FORCE NEW REFERENCE: Creates a brand new object in memory
        // This is critical for index.tsx to detect the change
        setUser({ ...data } as UserType);
      }
    } catch (error: any) {
      if (!error.message.includes("permission-denied")) {
        console.error("[Auth Fetch Error]:", error.message);
      }
    }
  }, []);

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
    return unsub;
  }, [updateUserData]);

  const login = async (email: string, password: string): Promise<ResponseType> => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { success: true };
    } catch (error: any) {
      let msg = error.message;
      if (msg.includes("invalid-credential")) msg = "Wrong email or password";
      return { success: false, msg };
    }
  };

  const register = async (email: string, password: string, name: string): Promise<ResponseType> => {
    try {
      const response = await createUserWithEmailAndPassword(auth, email, password);
      const uid = response.user.uid;
      const userData = {
        name, email, uid,
        role: "adopter",
        petPostIds: [],
        favorites: [],
        adoptedPets: [],
        createdAt: serverTimestamp(),
      };
      await setDoc(doc(firestore, "users", uid), userData);
      return { success: true };
    } catch (error: any) {
      return { success: false, msg: error.message };
    }
  };

  const logout = async () => {
    setUser(null);
    await signOut(auth);
    return { success: true };
  };

  // Helper for remote/local updates (Optimistic UI)
  const updateLocalAndRemote = async (field: string, value: any, isArray: boolean = false, type: 'union' | 'remove' = 'union') => {
    if (!user?.uid) return;
    const docRef = doc(firestore, "users", user.uid);
    const updatePayload = isArray 
      ? { [field]: type === 'union' ? arrayUnion(value) : arrayRemove(value) }
      : { [field]: value };
    
    await updateDoc(docRef, updatePayload);
    
    setUser(prev => {
      if (!prev) return null;
      if (!isArray) return { ...prev, [field]: value };
      const currentArr = (prev as any)[field] || [];
      return { 
        ...prev, 
        [field]: type === 'union' ? [...currentArr, value] : currentArr.filter((id: any) => id !== value) 
      };
    });
  };

  const contextValue: AuthContextType = useMemo(() => ({
    user,
    setUser,
    login,
    register,
    logout,
    updateUserData,
    promoteToSeller: () => updateLocalAndRemote("role", "seller"),
    addPetPostId: (petId: string) => updateLocalAndRemote("petPostIds", petId, true, 'union'),
    removePetPostId: (petId: string) => updateLocalAndRemote("petPostIds", petId, true, 'remove'),
  }), [user, updateUserData]);

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};