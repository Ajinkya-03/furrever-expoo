import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { 
    addDoc, collection, onSnapshot, query, serverTimestamp, 
    where, doc, updateDoc, getDocs 
} from "firebase/firestore";
import { firestore } from "@/config/firebase";
import { useAuth } from "./AuthContext";
import { ChatRoomType, ChatContextType } from "@/types";

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

        const q = query(collection(firestore, "chatRooms"), where("participants", "array-contains", user.uid));
        const unsub = onSnapshot(q, (snap) => {
            const myRooms = snap.docs.map(d => ({
                id: d.id,
                ...d.data(),
                updatedAt: d.data().updatedAt?.toDate?.() || new Date(),
            })) as ChatRoomType[];

            setRooms(myRooms.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()));
            setLoadingRooms(false);
        });

        return unsub;
    }, [user?.uid]);

    // Simplified to only update on meaningful sends/closes
    const markAsRead = useCallback(async (roomId: string) => {
        if (!user?.uid) return;
        try {
            await updateDoc(doc(firestore, "chatRooms", roomId), {
                [`lastRead.${user.uid}`]: serverTimestamp()
            });
        } catch (e) { /* silent fail for background ops */ }
    }, [user?.uid]);

    const getOrCreateChatRoom = async (targetUserId: string, targetName: string, targetImage: string) => {
        if (!user?.uid || !targetUserId) return null;
        
        const safeTargetName = targetName || "Pet Owner";
        const safeTargetImage = targetImage || "";
        const safeUserName = user.name || "User";
        const safeUserImage = user.image || "";

        const existing = rooms.find(r => r.participants.includes(targetUserId));
        if (existing) return existing.id;

        const q = query(collection(firestore, "chatRooms"), where("participants", "array-contains", user.uid));
        const snap = await getDocs(q);
        let foundId = null;
        snap.forEach(d => { 
            if (d.data().participants.includes(targetUserId)) foundId = d.id;
        });

        if (foundId) return foundId;

        try {
            const res = await addDoc(collection(firestore, "chatRooms"), {
                participants: [user.uid, targetUserId],
                participantMetadata: {
                    [user.uid]: { name: safeUserName, image: safeUserImage },
                    [targetUserId]: { name: safeTargetName, image: safeTargetImage }
                },
                lastMessage: "Started a conversation",
                updatedAt: serverTimestamp(),
                // Start with past dates so new messages trigger "unread" UI in Inbox
                lastRead: { 
                    [user.uid]: serverTimestamp(), 
                    [targetUserId]: new Date(0) 
                }
            });
            return res.id;
        } catch (error) {
            console.error("[ChatContext]: Error creating room", error);
            return null;
        }
    };

    const value = useMemo(() => ({ 
        getOrCreateChatRoom, markAsRead, rooms, loadingRooms 
    }), [rooms, loadingRooms, markAsRead]);

    return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = () => {
    const context = useContext(ChatContext);
    if (!context) throw new Error("useChat must be used within ChatProvider");
    return context;
};
