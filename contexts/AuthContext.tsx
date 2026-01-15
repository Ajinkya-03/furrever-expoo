import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import { useRouter, useSegments } from "expo-router";
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
  onSnapshot, // <--- 1. REAL-TIME LISTENER
  serverTimestamp,
  setDoc,
  updateDoc,
  Unsubscribe
} from "firebase/firestore";
import { auth, firestore } from "@/config/firebase";
import { AuthContextType, UserType, ResponseType } from "@/types";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserType | null>(null);
  const [initialized, setInitialized] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  // --- 1. REAL-TIME DATA ENGINE (Runs Once) ---
  useEffect(() => {
    let unsubscribeFirestore: Unsubscribe | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // --- USER LOGGED IN ---
        const uid = firebaseUser.uid;
        const userDocRef = doc(firestore, "users", uid);
        
        // [REAL-TIME SYNC]
        // This listener fires whenever the database changes (Name OR Image).
        // It updates Device A and Device B instantly.
        unsubscribeFirestore = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setUser({ ...docSnap.data(), uid } as UserType);
          }
        }, (error) => console.error("Auth Sync Error:", error));

      } else {
        // --- GUEST / LOGGED OUT ---
        setUser(null);
        if (unsubscribeFirestore) {
          unsubscribeFirestore();
          unsubscribeFirestore = null;
        }
      }
      setInitialized(true);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeFirestore) unsubscribeFirestore();
    };
  }, []);

  // --- 2. NAVIGATION GUARD (Guest Friendly) ---
  useEffect(() => {
    if (!initialized) return;

    const inAuthGroup = segments[0] === "(auth)";
    
    // Only redirect if LOGGED IN and on Login/Welcome screen
    if (user && inAuthGroup) {
      router.replace("/(tabs)");
    }
    
    // [FIX] Removed the "else if (!user)" block.
    // This allows Guests to click "Skip" and stay on the Home screen.

  }, [user, segments, initialized]);

  // --- ACTIONS ---

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
        image: null,
        createdAt: serverTimestamp(),
      };
      await setDoc(doc(firestore, "users", uid), userData);
      return { success: true };
    } catch (error: any) {
      return { success: false, msg: error.message };
    }
  };

  const logout = async () => {
    try {
        await signOut(auth);
        setUser(null);
        // Manually redirect to Welcome since we removed the auto-guard
        router.replace("/(auth)/welcome");
        return { success: true };
    } catch (e: any) {
        return { success: false, msg: e.message };
    }
  };

  const updateUserData = async () => {}; // Listener handles this now

  const updateLocalAndRemote = async (field: string, value: any, isArray: boolean = false, type: 'union' | 'remove' = 'union') => {
    if (!user?.uid) return;
    const docRef = doc(firestore, "users", user.uid);
    const payload = isArray 
      ? { [field]: type === 'union' ? arrayUnion(value) : arrayRemove(value) }
      : { [field]: value };
    updateDoc(docRef, payload).catch(e => console.error("Remote update failed", e));
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
  }), [user]);

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};