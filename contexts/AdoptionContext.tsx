import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { 
  collection, addDoc, doc, updateDoc, serverTimestamp, 
  onSnapshot, arrayUnion, query, where, getDocs 
} from "firebase/firestore";
import { firestore } from "@/config/firebase";
import { useAuth } from "./AuthContext";
import { usePets } from "./PetContext";
import { AdoptionType, AdoptionContextType, ResponseType } from "@/types";
import * as Haptics from 'expo-haptics';

const AdoptionContext = createContext<AdoptionContextType | undefined>(undefined);

export const AdoptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [applications, setApplications] = useState<AdoptionType[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { markAsSold } = usePets();

  useEffect(() => {
    if (!user?.uid) {
      setApplications([]);
      return;
    }

    const q = collection(firestore, "adoptions");
    
    return onSnapshot(q, (snap) => {
      const allApps = snap.docs.map(d => ({ 
        id: d.id, 
        ...d.data(),
        createdAt: d.data().createdAt?.toDate?.() || d.data().createdAt 
      } as AdoptionType));

      const filtered = allApps
        .filter(app => 
            (app.adopterId === user.uid || app.ownerId === user.uid) && 
            app.status !== 'cancelled'
        )
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setApplications(filtered);
    });
  }, [user?.uid]);

  const sendApplication = async (pet: any): Promise<ResponseType> => {
    if (!user?.uid) return { success: false, msg: "Login required" };

    setLoading(true);
    try {
      const q = query(
        collection(firestore, "adoptions"), 
        where("petId", "==", pet.id), 
        where("adopterId", "==", user.uid)
      );
      const snap = await getDocs(q);

      if (!snap.empty) {
        const existingDoc = snap.docs[0];
        const currentStatus = existingDoc.data().status;

        if (currentStatus === 'pending') return { success: false, msg: "Already applied!" };
        if (currentStatus === 'approved') return { success: false, msg: "Already approved!" };

        await updateDoc(doc(firestore, "adoptions", existingDoc.id), {
          status: 'pending',
          createdAt: serverTimestamp()
        });
        return { success: true };
      }

      await addDoc(collection(firestore, "adoptions"), {
        petId: pet.id,
        petName: pet.name,
        petImage: pet.image,
        adopterId: user.uid,
        adopterName: user.name,
        ownerId: pet.ownerId,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      
      return { success: true };
    } catch (e: any) {
      return { success: false, msg: e.message };
    } finally {
      setLoading(false);
    }
  };

  const cancelApplication = async (appId: string): Promise<ResponseType> => {
    setLoading(true);
    try {
      await updateDoc(doc(firestore, "adoptions", appId), { 
        status: 'cancelled',
        updatedAt: serverTimestamp() 
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return { success: true };
    } catch (e: any) {
      return { success: false, msg: e.message };
    } finally {
      setLoading(false);
    }
  };

  const updateApplicationStatus = async (appId: string, petId: string, status: 'approved' | 'rejected') => {
    setLoading(true);
    try {
      const app = applications.find(a => a.id === appId);
      if (!app) throw new Error("Application not found");

      await updateDoc(doc(firestore, "adoptions", appId), { status });
      
      if (status === 'approved') {
        // FIX: Now passing both petId AND adopterId to markAsSold
        await markAsSold(petId, app.adopterId); 
        
        await updateDoc(doc(firestore, "users", app.adopterId), { 
          adoptedPets: arrayUnion(petId) 
        });
      }
      
      await addDoc(collection(firestore, "notifications"), {
        receiverId: app.adopterId,
        title: status === 'approved' ? "Adoption Approved! 🎉" : "Application Update",
        message: `Your request for ${app.petName} was ${status} by the owner.`,
        isRead: false, 
        createdAt: serverTimestamp()
      });

      return { success: true };
    } catch (e: any) {
      return { success: false, msg: e.message };
    } finally {
      setLoading(false);
    }
  };

  const value = useMemo(() => ({ 
    applications, 
    sendApplication, 
    cancelApplication, 
    updateApplicationStatus, 
    loading 
  }), [applications, loading]);

  return <AdoptionContext.Provider value={value}>{children}</AdoptionContext.Provider>;
};

export const useAdoption = () => {
  const context = useContext(AdoptionContext);
  if (!context) throw new Error("useAdoption must be used within AdoptionProvider");
  return context;
};