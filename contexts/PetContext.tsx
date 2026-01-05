import { firestore } from "@/config/firebase";
import { uploadFileToCloudinary } from "@/services/imageService";
import { CloudinaryResponse, PetContextType, PetType } from "@/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";

const PetContext = createContext<PetContextType | undefined>(undefined);

// --- Caching Helpers ---
const savePetsToCache = async (pets: PetType[]) => {
  try {
    await AsyncStorage.setItem("cachedPets", JSON.stringify(pets));
  } catch (err) {
    console.error("Cache Save Error:", err);
  }
};

const loadPetsFromCache = async (): Promise<PetType[] | null> => {
  try {
    const cached = await AsyncStorage.getItem("cachedPets");
    return cached ? JSON.parse(cached) : null;
  } catch (err) {
    return null;
  }
};

export const PetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pets, setPets] = useState<PetType[]>([]);
  const { user, setUser, promoteToSeller, addPetPostId, removePetPostId } = useAuth();

  useEffect(() => {
    const fetchPets = async () => {
      // Load cache first for instant UI
      const cached = await loadPetsFromCache();
      if (cached) setPets(cached);

      try {
        const petsQuery = query(collection(firestore, "pets"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(petsQuery);
        
        const petList: PetType[] = querySnapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            ...data,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
            deletedAt: data.deletedAt?.toDate ? data.deletedAt.toDate() : data.deletedAt,
          } as PetType;
        });

        setPets(petList);
        savePetsToCache(petList);
      } catch (error: any) {
        console.error("Fetch Error:", error.message);
      }
    };

    fetchPets();
  }, [user?.uid]);

  // * Toggle Favorite Logic
  const toggleFavorite = async (petId: string) => {
    if (!user?.uid) return;
    const petRef = doc(firestore, "pets", petId);
    const userRef = doc(firestore, "users", user.uid);
    const pet = pets.find((p) => p.id === petId);
    if (!pet) return;

    const isCurrentlyFav = pet.favoredBy?.includes(user.uid);

    // Optimistic UI Update
    const updatedPets = pets.map((p) => {
      if (p.id === petId) {
        const currentFavs = (p.favoredBy || []).filter((id) => id !== undefined);
        return {
          ...p,
          favoredBy: isCurrentlyFav
            ? currentFavs.filter((id) => id !== user.uid)
            : [...currentFavs, user.uid],
        } as PetType;
      }
      return p;
    });
    setPets(updatedPets);

    try {
      await updateDoc(petRef, {
        favoredBy: isCurrentlyFav ? arrayRemove(user.uid) : arrayUnion(user.uid),
      });
      await updateDoc(userRef, {
        favorites: isCurrentlyFav ? arrayRemove(petId) : arrayUnion(petId),
      });
      
      setUser((prev: any) => ({
        ...prev,
        favorites: isCurrentlyFav
          ? prev.favorites?.filter((id: string) => id !== petId)
          : [...(prev.favorites || []), petId]
      }));
    } catch (error: any) {
      console.error("Favorite Sync Error:", error.message);
    }
  };

  // * Add Pet Logic
  const addPet = async (petData: any, imageFile: any): Promise<CloudinaryResponse> => {
    try {
      let imageUrl = imageFile;

      if (imageFile && typeof imageFile !== "string") {
        const uploadRes = await uploadFileToCloudinary(imageFile, "pets");
        if (!uploadRes.success) throw new Error(uploadRes.msg);
        imageUrl = typeof uploadRes.data === "string" ? uploadRes.data : uploadRes.data.url;
      }

      const docRef = doc(collection(firestore, "pets"));
      const newPet: PetType = {
        ...petData,
        id: docRef.id,
        image: imageUrl,
        favoredBy: [],
        status: 'available',
        isDeleted: false,
        createdAt: new Date(), // Local date for immediate state update
      };

      await setDoc(docRef, { 
        ...newPet, 
        createdAt: serverTimestamp() 
      });

      setPets((prev): PetType[] => {
        const updated = [newPet, ...prev] as PetType[];
        savePetsToCache(updated);
        return updated;
      });

      if (user?.role === "adopter" && user.uid) await promoteToSeller(user.uid);
      if (user?.uid) await addPetPostId(user.uid, newPet.id);

      return { success: true };
    } catch (error: any) {
      return { success: false, msg: error.message };
    }
  };

  // * Update Pet Logic
  const updatePet = async (id: string, updates: Partial<PetType>): Promise<CloudinaryResponse> => {
    try {
      const docRef = doc(firestore, "pets", id);
      await updateDoc(docRef, updates);
      
      setPets((prev): PetType[] => {
        const updated = prev.map((p) => (p.id === id ? { ...p, ...updates } : p)) as PetType[];
        savePetsToCache(updated);
        return updated;
      });
      return { success: true };
    } catch (error: any) {
      return { success: false, msg: error.message };
    }
  };

  // * Mark as Sold Logic (Triggered by Adoption Approval)
  const markAsSold = async (id: string): Promise<CloudinaryResponse> => {
    try {
      const docRef = doc(firestore, "pets", id);
      await updateDoc(docRef, { status: 'sold' });

      setPets((prev): PetType[] => {
        const updated = prev.map((p) =>
          p.id === id ? { ...p, status: 'sold' as PetType['status'] } : p
        ) as PetType[];
        savePetsToCache(updated);
        return updated;
      });
      return { success: true };
    } catch (error: any) {
      return { success: false, msg: error.message };
    }
  };

  // * Soft Delete Logic
  const deletePet = async (id: string): Promise<CloudinaryResponse> => {
    try {
      const docRef = doc(firestore, "pets", id);
      await updateDoc(docRef, { 
        isDeleted: true, 
        deletedAt: serverTimestamp() 
      });

      setPets((prev): PetType[] => {
        const updated = prev.map((p) => (p.id === id ? { ...p, isDeleted: true } : p)) as PetType[];
        savePetsToCache(updated);
        return updated;
      });

      if (user?.uid) await removePetPostId(user.uid, id);
      return { success: true };
    } catch (error: any) {
      return { success: false, msg: error.message };
    }
  };

  return (
    <PetContext.Provider value={{ pets, addPet, updatePet, deletePet, toggleFavorite, markAsSold }}>
      {children}
    </PetContext.Provider>
  );
};

export const usePets = () => {
  const context = useContext(PetContext);
  if (!context) throw new Error("usePets must be wrapped inside PetProvider");
  return context;
};