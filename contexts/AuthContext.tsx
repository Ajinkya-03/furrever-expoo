import React, { createContext, useContext, useEffect, useState, useMemo, useRef } from "react";
import { useRouter, useSegments } from "expo-router";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import {
  doc,
  onSnapshot,
  collection,
  query,
  where,
  getDocs,
  Unsubscribe,
  updateDoc,
  arrayUnion,
  arrayRemove,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, firestore } from "@/config/firebase";
import { AuthContextType, UserType, ResponseType } from "@/types";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserType | null>(null);
  const [initialized, setInitialized] = useState(false);
  const router = useRouter();
  const segments = useSegments();
  const unsubscribeFirestoreRef = useRef<Unsubscribe | null>(null);

  // --- AUTO-LOGIN & SESSION LISTENER ---
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (unsubscribeFirestoreRef.current) {
        unsubscribeFirestoreRef.current();
        unsubscribeFirestoreRef.current = null;
      }

      if (firebaseUser) {
        const uid = firebaseUser.uid;
        const userDocRef = doc(firestore, "users", uid);
        
        unsubscribeFirestoreRef.current = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setUser({ ...docSnap.data(), uid } as UserType);
          }
          setInitialized(true); 
        });
      } else {
        setUser(null);
        setInitialized(true); 
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeFirestoreRef.current) unsubscribeFirestoreRef.current();
    };
  }, []);

  // --- NAVIGATION GUARD ---
  useEffect(() => {
    if (!initialized) return;
    const inAuthGroup = segments[0] === "(auth)";
    if (user && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [user, segments, initialized]);

  const login = async (email: string, password: string): Promise<ResponseType> => {
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      return { success: true };
    } catch (error: any) {
      return { success: false, msg: error.code || error.message };
    }
  };

  const register = async (email: string, password: string, name: string): Promise<ResponseType> => {
    try {
      const response = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const uid = response.user.uid;
      const userData = {
        name,
        email: email.trim(),
        uid,
        role: "adopter",
        petPostIds: [],
        favorites: [],
        adoptedPets: [],
        image: null,
        createdAt: serverTimestamp(),
      };
      await setDoc(doc(firestore, "users", uid), userData);
      return { success: true };
    } catch (error: any) {
      return { success: false, msg: error.message };
    }
  };

  const resetPassword = async (email: string): Promise<ResponseType> => {
    try {
      const trimmedEmail = email.trim().toLowerCase();
      const usersRef = collection(firestore, "users");
      const userSnap = await getDocs(query(usersRef, where("email", "==", trimmedEmail)));
      
      if (userSnap.empty) return { success: false, msg: "user-not-found" };

      await sendPasswordResetEmail(auth, trimmedEmail);
      return { success: true };
    } catch (error: any) {
      return { success: false, msg: error.code || "error" };
    }
  };

  const logout = async () => {
    try {
      if (unsubscribeFirestoreRef.current) unsubscribeFirestoreRef.current();
      await signOut(auth);
      setUser(null);
      router.replace("/(auth)/welcome");
      return { success: true };
    } catch (e: any) { return { success: false, msg: e.message }; }
  };

  const updateLocalAndRemote = async (field: string, value: any, isArray = false, type: "union" | "remove" = "union") => {
    if (!user?.uid) return;
    const docRef = doc(firestore, "users", user.uid);
    const payload = isArray ? { [field]: type === "union" ? arrayUnion(value) : arrayRemove(value) } : { [field]: value };
    await updateDoc(docRef, payload);
  };

  const contextValue: AuthContextType = useMemo(() => ({
    user, setUser, login, logout, resetPassword, register,
    updateUserData: async () => {},
    promoteToSeller: () => updateLocalAndRemote("role", "seller"),
    addPetPostId: (petId: string) => updateLocalAndRemote("petPostIds", petId, true, "union"),
    removePetPostId: (petId: string) => updateLocalAndRemote("petPostIds", petId, true, "remove"),
  }), [user]);

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};