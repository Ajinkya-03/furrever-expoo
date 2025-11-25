import { createContext, useContext, useEffect, useState } from "react";
import { firestore } from "@/config/firebase";
import {
  doc,
  setDoc,
  getDocs,
  collection,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { PetType, PetContextType } from "@/types";
import { uploadFileToCloudinary } from "@/services/imageService";
import { useAuth } from "./AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

const PetContext = createContext<PetContextType | undefined>(undefined);

// Helpers for caching
const savePetsToCache = async (pets: PetType[]) => {
  try {
    await AsyncStorage.setItem("cachedPets", JSON.stringify(pets));
  } catch (err) {
    console.error("Failed to cache pets:", err);
  }
};

const loadPetsFromCache = async (): Promise<PetType[] | null> => {
  try {
    const cached = await AsyncStorage.getItem("cachedPets");
    return cached ? JSON.parse(cached) : null;
  } catch (err) {
    console.error(" Failed to load cached pets:", err);
    return null;
  }
};

export const PetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pets, setPets] = useState<PetType[]>([]);

  // Get functions from AuthContext
  const { user, promoteToSeller, addPetPostId, removePetPostId } = useAuth();

  // Fetch pets with caching
  useEffect(() => {
    const fetchPets = async () => {
      // Load cached pets immediately
      const cached = await loadPetsFromCache();
      if (cached) {
        setPets(cached);
      }

      // Fetch fresh pets from Firestore
      try {
        const querySnapshot = await getDocs(collection(firestore, "pets"));
        const petList: PetType[] = querySnapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<PetType, "id">),
        }));

        setPets(petList);
        savePetsToCache(petList); // Update cache
      } catch (error: any) {
        // console.error(" Error fetching pets:", error.message);
      }
    };

    fetchPets();
  }, [user]); // refetch when user changes (logout/login)

  // Add new pet
  const addPet = async (
    petData: Omit<PetType, "id" | "image" | "createdAt">,
    imageFile: any
  ) => {
    try {
      let imageUrl: string | null = null;

      if (imageFile) {
        const uploadRes = await uploadFileToCloudinary(imageFile, "pets");
        if (!uploadRes.success) throw new Error(uploadRes.msg);
        imageUrl = uploadRes.data;
      }

      const docRef = doc(collection(firestore, "pets"));
      const newPet: PetType = {
        id: docRef.id,
        ...petData,
        image: imageUrl ?? undefined,
        createdAt: new Date(),
      };

      await setDoc(docRef, newPet);
      setPets((prev) => {
        const updated = [...prev, newPet];
        savePetsToCache(updated); // update cache
        return updated;
      });

      // promote adopter to seller
      if (user?.role === "adopter" && user.uid) {
        await promoteToSeller(user.uid);
      }

      // add petId to user record
      if (user?.uid) {
        await addPetPostId(user.uid, newPet.id);
      }

      return { success: true };
    } catch (error: any) {
      console.error(" Error adding pet:", error.message);
      return { success: false, msg: error.message };
    }
  };

  // Update pet
  const updatePet = async (id: string, updates: Partial<PetType>) => {
    try {
      const docRef = doc(firestore, "pets", id);
      await updateDoc(docRef, updates);
      setPets((prev) => {
        const updated = prev.map((p) => (p.id === id ? { ...p, ...updates } : p));
        savePetsToCache(updated); // update cache
        return updated;
      });
      return { success: true };
    } catch (error: any) {
      console.error("Error updating pet:", error.message);
      return { success: false, msg: error.message };
    }
  };

  // Delete pet
  const deletePet = async (id: string) => {
    try {
      await deleteDoc(doc(firestore, "pets", id));
      setPets((prev) => {
        const updated = prev.filter((p) => p.id !== id);
        savePetsToCache(updated); // update cache
        return updated;
      });

      // remove petId from user record
      if (user?.uid) {
        await removePetPostId(user.uid, id);
      }

      return { success: true };
    } catch (error: any) {
      console.error("Error deleting pet:", error.message);
      return { success: false, msg: error.message };
    }
  };

  const contextValue: PetContextType = {
    pets,
    addPet,
    updatePet,
    deletePet,
  };

  return (
    <PetContext.Provider value={contextValue}>
      {children}
    </PetContext.Provider>
  );
};

export const usePets = (): PetContextType => {
  const context = useContext(PetContext);
  if (!context) {
    throw new Error("usePets must be wrapped inside PetProvider");
  }
  return context;
};
