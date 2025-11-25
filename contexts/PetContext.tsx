// contexts/PetContext.tsx
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

const PetContext = createContext<PetContextType | undefined>(undefined);
export const PetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [pets, setPets] = useState<PetType[]>([]);

    // ✅ Fetch pets once on mount
    useEffect(() => {
        const fetchPets = async () => {
            try {
                const querySnapshot = await getDocs(collection(firestore, "pets"));
                const petList: PetType[] = querySnapshot.docs.map((docSnap) => ({
                    id: docSnap.id,
                    ...(docSnap.data() as Omit<PetType, "id">),
                }));
                setPets(petList);
            } catch (error: any) {
                console.error("❌ Error fetching pets:", error.message);
            }
        };

        fetchPets();
    }, []);

    // ➕ Add new pet
    const { user, promoteToSeller } = useAuth(); // 👈 get from AuthContext

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
            setPets((prev) => [...prev, newPet]);

            if (user?.role === "adopter" && user.uid) {
                await promoteToSeller(user.uid);
            }
            return { success: true };
        } catch (error: any) {
            console.error("❌ Error adding pet:", error.message);
            return { success: false, msg: error.message };
        }
    };
    const updatePet = async (id: string, updates: Partial<PetType>) => {
        try {
            const docRef = doc(firestore, "pets", id);
            await updateDoc(docRef, updates);
            setPets((prev) =>
                prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
            );
            return { success: true };
        } catch (error: any) {
            console.error("❌ Error updating pet:", error.message);
            return { success: false, msg: error.message };
        }
    };

    // 🗑️ Delete pet
    const deletePet = async (id: string) => {
        try {
            await deleteDoc(doc(firestore, "pets", id));
            setPets((prev) => prev.filter((p) => p.id !== id));
            return { success: true };
        } catch (error: any) {
            console.error("❌ Error deleting pet:", error.message);
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