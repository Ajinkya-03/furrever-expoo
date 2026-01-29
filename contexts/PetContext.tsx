
import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { InteractionManager } from 'react-native';
import { 
  collection, doc, onSnapshot, query, serverTimestamp, 
  setDoc, updateDoc, writeBatch, arrayUnion, arrayRemove, 
  orderBy, where 
} from "firebase/firestore";
import { firestore } from "@/config/firebase";
import { uploadFileToCloudinary } from "@/services/imageService";
import { PetContextType, PetType, CloudinaryResponse, CreatePetDTO } from "@/types";
import { useAuth } from "./AuthContext";

const PetContext = createContext<PetContextType | undefined>(undefined);
const CACHE_KEY = "cached_pets_list";

export const PetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pets, setPets] = useState<PetType[]>([]);
  const { user, promoteToSeller, addPetPostId } = useAuth();
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    const loadCache = async () => {
      try {
        const cached = await AsyncStorage.getItem(CACHE_KEY);
        if (cached && isMounted.current && pets.length === 0) {
          setPets(JSON.parse(cached));
        }
      } catch (e) {
        console.error("Cache Load Error", e);
      }
    };
    loadCache();

    const q = query(
      collection(firestore, "pets"),
      where("isDeleted", "==", false),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const petList = snapshot.docs.map(d => {
        const data = d.data();
        return {
          ...data,
          id: d.id,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString() 
        };
      }) as PetType[];

      if (isMounted.current) {
        setPets(petList);
        
        InteractionManager.runAfterInteractions(() => {
          AsyncStorage.setItem(CACHE_KEY, JSON.stringify(petList)).catch(() => null);
        });
      }
    }, (error) => {
      if (error.code === 'permission-denied') {
        console.warn("Guest View Restricted: Pet list hidden by security rules.");
      } else {
        console.error("Pet Stream Sync Error:", error);
      }
    });

    return () => unsubscribe();
    
  }, [user?.uid]); 


  const addPet = useCallback(async (petData: CreatePetDTO, imageFile: any): Promise<CloudinaryResponse> => {
    try {
      let imageUrl = imageFile;
      if (imageFile?.uri) {
        const res = await uploadFileToCloudinary(imageFile, "pets");
        if (!res.success) throw new Error(res.msg);
        imageUrl = res.data;
      }

      const docRef = doc(collection(firestore, "pets"));
      const newPetData = { 
        ...petData, 
        id: docRef.id, 
        image: imageUrl, 
        favoredBy: [], 
        status: 'available', 
        isDeleted: false, 
        createdAt: serverTimestamp() 
      };

      await setDoc(docRef, newPetData);

      if (user?.role === "adopter" && user.uid) await promoteToSeller(user.uid);
      if (user?.uid) await addPetPostId(user.uid, docRef.id);

      return { success: true };
    } catch (e: any) {
      return { success: false, msg: e.message };
    }
  }, [user?.uid, user?.role, promoteToSeller, addPetPostId]);

  const updatePet = useCallback(async (id: string, updates: Partial<PetType>, imageFile?: any): Promise<CloudinaryResponse> => {
    try {
      let finalUpdates = { ...updates };
      if (imageFile?.uri) {
        const res = await uploadFileToCloudinary(imageFile, "pets");
        if (!res.success) throw new Error(res.msg);
        finalUpdates.image = res.data;
      }
      await updateDoc(doc(firestore, "pets", id), { ...finalUpdates, updatedAt: serverTimestamp() });
      return { success: true };
    } catch (e: any) {
      return { success: false, msg: e.message };
    }
  }, []);

  const deletePet = useCallback(async (id: string): Promise<CloudinaryResponse> => {
    try {
      await updateDoc(doc(firestore, "pets", id), { isDeleted: true, deletedAt: serverTimestamp() });
      return { success: true };
    } catch (e: any) {
      return { success: false, msg: e.message };
    }
  }, []);

  const markAsSold = useCallback(async (petId: string, adopterId: string): Promise<CloudinaryResponse> => {
    try {
      await updateDoc(doc(firestore, "pets", petId), { status: 'sold', adoptedBy: adopterId, updatedAt: serverTimestamp() });
      return { success: true };
    } catch (e: any) {
      return { success: false, msg: e.message };
    }
  }, []);

  const toggleFavorite = useCallback(async (petId: string) => {
    if (!user?.uid) return;

    const petIndex = pets.findIndex(p => p.id === petId);
    if (petIndex === -1) return;
    
    const isCurrentlyFav = pets[petIndex].favoredBy.includes(user.uid);
    
    const optimisticPets = [...pets];
    if (isCurrentlyFav) {
      optimisticPets[petIndex].favoredBy = optimisticPets[petIndex].favoredBy.filter(id => id !== user.uid);
    } else {
      optimisticPets[petIndex].favoredBy.push(user.uid);
    }
    setPets(optimisticPets);

    try {
      const batch = writeBatch(firestore);
      const petRef = doc(firestore, "pets", petId);
      const userRef = doc(firestore, "users", user.uid);

      if (isCurrentlyFav) {
        batch.update(petRef, { favoredBy: arrayRemove(user.uid) });
        batch.update(userRef, { favorites: arrayRemove(petId) });
      } else {
        batch.update(petRef, { favoredBy: arrayUnion(user.uid) });
        batch.update(userRef, { favorites: arrayUnion(petId) });
      }
      await batch.commit();
    } catch (e) {
      console.error("Favorite Sync Error:", e);
    }
  }, [pets, user?.uid]);

  return (
    <PetContext.Provider value={{ pets, addPet, updatePet, deletePet, toggleFavorite, markAsSold }}>
      {children}
    </PetContext.Provider>
  );
};

export const usePets = () => {
  const context = useContext(PetContext);
  if (!context) throw new Error("usePets must be used within PetProvider");
  return context;
};
