
import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import {
  collection, addDoc, doc, updateDoc, serverTimestamp,
  onSnapshot, arrayUnion, query, where, getDocs, getDoc, or, writeBatch
} from "firebase/firestore";
import { firestore } from "@/config/firebase";
import { useAuth } from "./AuthContext";
import { usePets } from "./PetContext";
import { AdoptionType, AdoptionContextType, ResponseType, PetType } from "@/types";
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

    const q = query(
      collection(firestore, "adoptions"),
      or(
        where("adopterId", "==", user.uid),
        where("ownerId", "==", user.uid)
      )
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const filteredApps = snap.docs
        .map(d => {
          const data = d.data();
          return {
            id: d.id,
            ...data,
            isRead: (data as any).isRead ?? false,
            createdAt: data.createdAt?.toDate?.() || data.createdAt
          } as AdoptionType;
        })
        .filter(app => app.status !== 'cancelled')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setApplications(filteredApps);
    }, (error) => {
      console.error("Adoption Sync Error:", error);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const sendApplication = async (pet: PetType): Promise<ResponseType> => {
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

      const batch = writeBatch(firestore);

      // 1. Fetch fresh pet details to "freeze" them into the record
      const petSnap = await getDoc(doc(firestore, "pets", petId));
      const petData = petSnap.data() as PetType;

      // 2. Prepare the Approved/Rejected update for THIS specific application
      const mainAppRef = doc(firestore, "adoptions", appId);
      batch.update(mainAppRef, {
        status,
        petBreed: petData?.breed || "Purebreed",
        petCategory: petData?.category || "Pet",
        petColor: petData?.coatcolor || "Standard",
        petAge: petData?.age || "N/A",
        updatedAt: serverTimestamp()
      });

      if (status === 'approved') {
        const otherAppsQuery = query(
          collection(firestore, "adoptions"),
          where("petId", "==", petId),
          where("status", "==", "pending")
        );
        const otherAppsSnap = await getDocs(otherAppsQuery);

        otherAppsSnap.docs.forEach((otherDoc) => {
          if (otherDoc.id !== appId) {
            batch.update(doc(firestore, "adoptions", otherDoc.id), {
              status: 'rejected',
              updatedAt: serverTimestamp(),
              rejectionReason: "Pet adopted by another member"
            });
          }
        });
        await markAsSold(petId, app.adopterId);

        const adopterUserRef = doc(firestore, "users", app.adopterId);
        batch.update(adopterUserRef, {
          adoptedPets: arrayUnion(petId)
        });
      }

      await batch.commit();

      await addDoc(collection(firestore, "notifications"), {
        receiverId: app.adopterId,
        title: status === 'approved' ? "Adoption Approved! 🎉" : "Application Update",
        message: `Your request for ${app.petName} was ${status} by the owner.`,
        isRead: false,
        createdAt: serverTimestamp()
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return { success: true };
    } catch (e: any) {
      console.error("Status Update Error:", e);
      return { success: false, msg: e.message };
    } finally {
      setLoading(false);
    }
  };

  const value = useMemo(() => ({
    applications,
    loading,
    sendApplication,
    cancelApplication,
    updateApplicationStatus,
  }), [applications, loading]);

  return <AdoptionContext.Provider value={value}>{children}</AdoptionContext.Provider>;
};

export const useAdoption = () => {
  const context = useContext(AdoptionContext);
  if (!context) throw new Error("useAdoption must be used within AdoptionProvider");
  return context;
};
