import { firestore } from "@/config/firebase";
import { 
  collection, addDoc, doc, updateDoc, 
  serverTimestamp, onSnapshot, deleteDoc 
} from "firebase/firestore";
import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { usePets } from "./PetContext";
import { AdoptionType, AdoptionContextType, ResponseType } from "@/types";

// Create the context
const AdoptionContext = createContext<AdoptionContextType | undefined>(undefined);

//
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
    const unsubscribe = onSnapshot(q, (snap) => {
      const allApps = snap.docs.map(d => ({ 
        id: d.id, 
        ...d.data(),
        createdAt: d.data().createdAt?.toDate ? d.data().createdAt.toDate() : d.data().createdAt
      } as AdoptionType));

      // Filter: User is either the one who sent it or the one receiving it
      const myApps = allApps.filter(app => 
        app.adopterId === user.uid || app.ownerId === user.uid
      );

      // Sort: Newest first
      const sorted = myApps.sort((a, b) => {
        const timeA = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
        const timeB = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
        return timeB - timeA;
      });

      setApplications(sorted);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Helper: Create a notification document in Firestore for the UI to pick up
  const createNotification = async (receiverId: string, title: string, message: string) => {
    try {
      await addDoc(collection(firestore, "notifications"), {
        receiverId,
        title,
        message,
        isRead: false,
        createdAt: serverTimestamp()
      });
    } catch (e) {
      console.error("Failed to create notification:", e);
    }
  };

  const sendApplication = async (pet: any): Promise<ResponseType> => {
    try {
      if (!user?.uid) return { success: false, msg: "Please login first" };
      
      const exists = applications.some(a => a.petId === pet.id && a.adopterId === user.uid);
      if (exists) return { success: false, msg: "Application already sent!" };

      setLoading(true);
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
    try {
      setLoading(true);
      await deleteDoc(doc(firestore, "adoptions", appId));
      return { success: true };
    } catch (e: any) {
      return { success: false, msg: e.message };
    } finally {
      setLoading(false);
    }
  };

  const updateApplicationStatus = async (appId: string, petId: string, status: 'approved' | 'rejected') => {
    try {
      setLoading(true);
      const appData = applications.find(a => a.id === appId);
      if (!appData) throw new Error("Application not found");

      await updateDoc(doc(firestore, "adoptions", appId), { status });
      
      // Notify the Adopter about the status change
      const title = status === 'approved' ? "Application Approved! 🎉" : "Application Update";
      const message = status === 'approved' 
        ? `Your request to adopt ${appData.petName} has been approved.` 
        : `Your request to adopt ${appData.petName} was declined.`;
      
      await createNotification(appData.adopterId, title, message);

      if (status === 'approved') {
        const res = await markAsSold(petId);
        if (!res.success) throw new Error(res.msg);
      }
      return { success: true };
    } catch (e: any) {
      return { success: false, msg: e.message };
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdoptionContext.Provider value={{ 
      applications, 
      sendApplication, 
      cancelApplication, 
      updateApplicationStatus, 
      loading 
    }}>
      {children}
    </AdoptionContext.Provider>
  );
};

export const useAdoption = () => {
  const context = useContext(AdoptionContext);
  if (!context) throw new Error("useAdoption must be wrapped in AdoptionProvider");
  return context;
};