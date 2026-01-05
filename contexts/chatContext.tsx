import { firestore } from "@/config/firebase";
import { ChatRoomType } from "@/types";
import { addDoc, collection, getDocs, onSnapshot, query, serverTimestamp, where } from "firebase/firestore";
import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";

type ChatContextType = {
    getOrCreateChatRoom: (targetUserId: string) => Promise<string | null>;
    rooms: ChatRoomType[];
    loadingRooms: boolean;
};

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [rooms, setRooms] = useState<ChatRoomType[]>([]);
    const [loadingRooms, setLoadingRooms] = useState(true);

    useEffect(() => {
        if (!user?.uid) {
            setRooms([]);
            setLoadingRooms(false);
            return;
        }

        // * FIX: Remove where/orderBy to prevent index errors
        const q = collection(firestore, "chatRooms");

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const allRooms = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                updatedAt: doc.data().updatedAt?.toDate ? doc.data().updatedAt.toDate() : new Date(),
            })) as ChatRoomType[];

            //  Manual Filter: Only rooms where user is a participant
            const myRooms = allRooms.filter(room => room.participants.includes(user.uid!));

            //  Manual Sort: Recent chats at the top
            const sorted = myRooms.sort((a, b) => {
                const timeA = a.updatedAt instanceof Date ? a.updatedAt.getTime() : 0;
                const timeB = b.updatedAt instanceof Date ? b.updatedAt.getTime() : 0;
                return timeB - timeA;
            });

            setRooms(sorted);
            setLoadingRooms(false);
        });

        return () => unsubscribe();
    }, [user?.uid]);

    const getOrCreateChatRoom = async (targetUserId: string) => {
        if (!user?.uid) return null;
        try {
            const q = query(
                collection(firestore, "chatRooms"),
                where("participants", "array-contains", user.uid)
            );

            const querySnapshot = await getDocs(q);
            let existingRoomId = null;

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                if (data.participants.includes(targetUserId)) {
                    existingRoomId = doc.id;
                }
            });

            if (existingRoomId) return existingRoomId;

            const docRef = await addDoc(collection(firestore, "chatRooms"), {
                participants: [user.uid, targetUserId],
                lastMessage: "Started a conversation",
                updatedAt: serverTimestamp(),
            });
            return docRef.id;
        } catch (error) {
            console.error("Error with chatroom:", error);
            return null;
        }
    };

    return (
        <ChatContext.Provider value={{ getOrCreateChatRoom, rooms, loadingRooms }}>
            {children}
        </ChatContext.Provider>
    );
};

export const useChat = () => {
    const context = useContext(ChatContext);
    if (!context) throw new Error("useChat must be used within ChatProvider");
    return context;
};