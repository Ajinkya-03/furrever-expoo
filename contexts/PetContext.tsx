import React, { createContext, useContext, useEffect, useState, useRef, useMemo, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { 
  collection, doc, getDocs, query, serverTimestamp, 
  setDoc, updateDoc, writeBatch, arrayUnion, arrayRemove 
} from "firebase/firestore";
import { Alert } from "react-native";
import { firestore } from "@/config/firebase";
import { uploadFileToCloudinary } from "@/services/imageService";
import { PetContextType, PetType, CloudinaryResponse, CreatePetDTO } from "@/types";
import { useAuth } from "./AuthContext";

const PetContext = createContext<PetContextType | undefined>(undefined);
const CACHE_KEY = "cached_pets_list";

export const PetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pets, setPets] = useState<PetType[]>([]);
  const { user, setUser, promoteToSeller, addPetPostId } = useAuth();
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const syncPetsData = useCallback((newPets: PetType[]) => {
    if (!isMounted.current) return;
    setPets(newPets);
    AsyncStorage.setItem(CACHE_KEY, JSON.stringify(newPets)).catch(() => null);
  }, []);

  useEffect(() => {
    const fetchPets = async () => {
      if (!user) {
        const cached = await AsyncStorage.getItem(CACHE_KEY);
        if (cached && isMounted.current) setPets(JSON.parse(cached));
        return;
      }
      try {
        const q = query(collection(firestore, "pets")); 
        const snap = await getDocs(q);
        if (!isMounted.current) return;
        const petList = snap.docs.map(d => ({ 
            ...d.data(), 
            id: d.id, 
            createdAt: d.data().createdAt?.toDate?.()?.toISOString() || d.data().createdAt 
        })) as PetType[];
        syncPetsData(petList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      } catch (e: any) { console.error(e); }
    };
    fetchPets();
  }, [user?.uid, syncPetsData]);

  // Handle Add Pet
  const addPet = useCallback(async (petData: CreatePetDTO, imageFile: any): Promise<CloudinaryResponse> => {
    try {
      let imageUrl = imageFile;
      if (imageFile?.uri) {
        const res = await uploadFileToCloudinary(imageFile, "pets");
        if (!res.success) throw new Error(res.msg);
        imageUrl = res.data;
      }
      const docRef = doc(collection(firestore, "pets"));
      const newPet: PetType = { ...petData, id: docRef.id, image: imageUrl, favoredBy: [], status: 'available', isDeleted: false, createdAt: new Date().toISOString() };
      await setDoc(docRef, { ...newPet, createdAt: serverTimestamp() });
      syncPetsData([newPet, ...pets]);
      if (user?.role === "adopter" && user.uid) await promoteToSeller(user.uid);
      if (user?.uid) await addPetPostId(user.uid, docRef.id);
      return { success: true };
    } catch (e: any) { return { success: false, msg: e.message }; }
  }, [pets, user, promoteToSeller, addPetPostId, syncPetsData]);

  // --- CRITICAL: Updated updatePet to handle Image Uploads ---
  const updatePet = useCallback(async (id: string, updates: Partial<PetType>, imageFile?: any): Promise<CloudinaryResponse> => {
    try {
        let finalUpdates = { ...updates };

        // If a new image file is provided (uri exists), upload it
        if (imageFile?.uri) {
            const res = await uploadFileToCloudinary(imageFile, "pets");
            if (!res.success) throw new Error(res.msg);
            finalUpdates.image = res.data; // Update the image URL in the payload
        }

        await updateDoc(doc(firestore, "pets", id), { 
            ...finalUpdates, 
            updatedAt: serverTimestamp() 
        });

        // Update local state with new object reference to trigger UI refresh
        setPets(prev => prev.map(p => p.id === id ? { ...p, ...finalUpdates } : p));
        
        return { success: true };
    } catch (e: any) { return { success: false, msg: e.message }; }
  }, []);

  const deletePet = useCallback(async (id: string): Promise<CloudinaryResponse> => {
    try {
        await updateDoc(doc(firestore, "pets", id), { isDeleted: true, deletedAt: serverTimestamp() });
        setPets(prev => prev.map(p => p.id === id ? { ...p, isDeleted: true } : p));
        return { success: true };
    } catch (e: any) { return { success: false, msg: e.message }; }
  }, []);

  const markAsSold = useCallback(async (petId: string, adopterId: string): Promise<CloudinaryResponse> => {
    try {
      await updateDoc(doc(firestore, "pets", petId), { status: 'sold', adoptedBy: adopterId, updatedAt: serverTimestamp() });
      setPets(prev => prev.map(p => p.id === petId ? { ...p, status: 'sold', adoptedBy: adopterId } : p));
      return { success: true };
    } catch (e: any) { return { success: false, msg: e.message }; }
  }, []);

const toggleFavorite = useCallback(async (petId: string) => {
    if (!user?.uid) return;

    // 1. Identify current state
    const pet = pets.find(p => p.id === petId);
    if (!pet || pet.ownerId === user.uid) return;
    
    // Check if currently favorited using the User object from Auth
    const isFav = user.favorites?.includes(petId);

    // 2. OPTIMISTIC UPDATE: Update local Pets state instantly
    setPets(prev => prev.map(p => p.id === petId ? { 
        ...p, 
        favoredBy: isFav ? p.favoredBy.filter(u => u !== user.uid) : [...p.favoredBy, user.uid] 
    } : p));

    // 3. OPTIMISTIC UPDATE: Update local User favorites array instantly
    // This makes the Favourites.tsx tab react immediately
    setUser((prev: any) => ({
        ...prev,
        favorites: isFav 
            ? prev.favorites.filter((id: string) => id !== petId) 
            : [...(prev.favorites || []), petId]
    }));

    // 4. PERSISTENT UPDATE: Sync with Firestore
    try {
        const batch = writeBatch(firestore);
        batch.update(doc(firestore, "pets", petId), { 
            favoredBy: isFav ? arrayRemove(user.uid) : arrayUnion(user.uid) 
        });
        batch.update(doc(firestore, "users", user.uid), { 
            favorites: isFav ? arrayRemove(petId) : arrayUnion(petId) 
        });
        await batch.commit();
    } catch (e) {
        console.error("Database sync failed:", e);
        // Rollback can be implemented here if needed
    }
}, [pets, user, setUser]);

  return <PetContext.Provider value={{ pets, addPet, updatePet, deletePet, toggleFavorite, markAsSold }}>{children}</PetContext.Provider>;
};

export const usePets = () => useContext(PetContext)!;