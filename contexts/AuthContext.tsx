import React, { createContext, useContext, useEffect, useState, useMemo, useRef } from "react";
import { useRouter, useSegments } from "expo-router";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
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
  getDoc,
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
  const isMounted = useRef(true); // Stress-testing guard: Prevents state updates on unmounted components

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const fetchUserData = (uid: string) => {
    const userDocRef = doc(firestore, "users", uid);
    
    // Clean up any existing listener before starting a new one
    if (unsubscribeFirestoreRef.current) {
      unsubscribeFirestoreRef.current();
      unsubscribeFirestoreRef.current = null;
    }

    unsubscribeFirestoreRef.current = onSnapshot(userDocRef, 
      (docSnap) => {
        if (!isMounted.current) return; // Prevent crash if component is unmounted

        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data) {
            setUser({ 
              ...data, 
              uid, 
              emailVerified: !!auth.currentUser?.emailVerified 
            } as UserType);
          }
        } else if (auth.currentUser) {
          // Deferred Write Mode: Provide temp state for Gateway
          setUser({
            uid,
            email: auth.currentUser.email || "",
            name: auth.currentUser.displayName || "User",
            role: 'adopter',
            petPostIds: [], favorites: [], adoptedPets: [],
            emailVerified: false,
            createdAt: null
          } as UserType);
        }
        setInitialized(true);
      },
      (error) => {
        if (!isMounted.current) return;
        if (error.code === 'permission-denied') {
          setInitialized(true); 
        } else {
          console.error("Firestore Listener Error:", error);
        }
      }
    );
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        fetchUserData(firebaseUser.uid);
      } else {
        if (unsubscribeFirestoreRef.current) {
          unsubscribeFirestoreRef.current();
          unsubscribeFirestoreRef.current = null;
        }
        if (isMounted.current) {
          setUser(null);
          setInitialized(true);
        }
      }
    });
    return () => {
      unsubscribeAuth();
      if (unsubscribeFirestoreRef.current) unsubscribeFirestoreRef.current();
    };
  }, []);

  useEffect(() => {
    if (!initialized || !isMounted.current) return;
    const inAuthGroup = segments[0] === "(auth)";
    if (user?.emailVerified && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [user, initialized]);

  const updateLocalAndRemote = async (field: string, value: any, isArray = false, type: "union" | "remove" = "union") => {
    if (!auth.currentUser || !isMounted.current) return;
    const docRef = doc(firestore, "users", auth.currentUser.uid);
    const payload = isArray 
      ? { [field]: type === "union" ? arrayUnion(value) : arrayRemove(value) } 
      : { [field]: value };
    
    try {
      await updateDoc(docRef, payload);
    } catch (e) {
      console.error(`Error updating ${field}:`, e);
    }
  };

  const register = async (email: string, password: string, name: string): Promise<ResponseType> => {
    try {
      const res = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(res.user, { displayName: name.trim() });
      await sendEmailVerification(res.user);
      return { success: true };
    } catch (error: any) {
      return { success: false, msg: error.message };
    }
  };

  const reloadUser = async () => {
    if (!auth.currentUser || !isMounted.current) return;
    await auth.currentUser.reload();
    const isVerified = !!auth.currentUser.emailVerified;

    if (isVerified) {
      const userRef = doc(firestore, "users", auth.currentUser.uid);
      const docSnap = await getDoc(userRef);

      if (!docSnap.exists()) {
        const userData = {
          name: auth.currentUser.displayName || "User",
          email: auth.currentUser.email,
          uid: auth.currentUser.uid,
          role: "adopter",
          petPostIds: [], favorites: [], adoptedPets: [],
          image: null,
          emailVerified: true,
          createdAt: serverTimestamp(),
        };
        await setDoc(userRef, userData);
      } else {
        await updateDoc(userRef, { emailVerified: true });
      }
    }
    if (isMounted.current) {
      setUser(prev => prev ? { ...prev, emailVerified: isVerified } : null);
    }
  };

  const logout = async () => {
    try {
      if (unsubscribeFirestoreRef.current) unsubscribeFirestoreRef.current();
      await signOut(auth);
      if (isMounted.current) setUser(null);
      router.replace("/(auth)/welcome");
      return { success: true };
    } catch (e: any) { return { success: false, msg: e.message }; }
  };

  const contextValue: AuthContextType = useMemo(() => ({
    user, setUser, initialized,
    login: async (e, p) => {
      try { await signInWithEmailAndPassword(auth, e.trim(), p); return { success: true }; }
      catch (err: any) { return { success: false, msg: err.code }; }
    },
    register, logout, reloadUser,
    sendVerification: async () => {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
        return { success: true };
      }
      return { success: false };
    },
    resetPassword: async (email) => {
      const trimmedEmail = email.trim().toLowerCase();
      const userSnap = await getDocs(query(collection(firestore, "users"), where("email", "==", trimmedEmail)));
      if (userSnap.empty) return { success: false, msg: "user-not-found" };
      await sendPasswordResetEmail(auth, trimmedEmail);
      return { success: true };
    },
    updateUserData: async () => {},
    promoteToSeller: async () => updateLocalAndRemote("role", "seller"),
    addPetPostId: async (uid: string, petId: string) => updateLocalAndRemote("petPostIds", petId, true, "union"),
    removePetPostId: async (uid: string, petId: string) => updateLocalAndRemote("petPostIds", petId, true, "remove"),
  }), [user, initialized]);

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};