import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { 
    addDoc, collection, onSnapshot, query, serverTimestamp, 
    where, doc, updateDoc, Timestamp 
} from "firebase/firestore";
import { firestore } from "@/config/firebase";
import { useAuth } from "./AuthContext";
import { ChatRoomType, ChatContextType } from "@/types";

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [rooms, setRooms] = useState<ChatRoomType[]>([]);
    const [loadingRooms, setLoadingRooms] = useState(true);

    // --- 1. REAL-TIME ROOM SYNC ---
    useEffect(() => {
        if (!user?.uid) {
            setRooms([]);
            setLoadingRooms(false);
            return;
        }

        // Listener is strictly scoped to the current user's participation
        const q = query(
            collection(firestore, "chatRooms"), 
            where("participants", "array-contains", user.uid)
        );

        const unsub = onSnapshot(q, (snap) => {
            const myRooms = snap.docs.map(d => {
                const data = d.data();
                return {
                    id: d.id,
                    ...data,
                    // Safely convert Firestore timestamp to JS Date
                    updatedAt: data.updatedAt?.toDate?.() || new Date(),
                } as ChatRoomType;
            });

            // Sort locally by most recent message to keep the Inbox snappy
            setRooms(myRooms.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()));
            setLoadingRooms(false);
        }, (error) => {
            console.error("[ChatContext]: Sync Error", error);
            setLoadingRooms(false);
        });

        return unsub;
    }, [user?.uid]);

    // --- 2. MARK AS READ (Optimized Background Op) ---
    const markAsRead = useCallback(async (roomId: string) => {
        if (!user?.uid) return;
        try {
            // No need to await this if we want instant UI response
            updateDoc(doc(firestore, "chatRooms", roomId), {
                [`lastRead.${user.uid}`]: serverTimestamp()
            });
        } catch (e) {
            /* Fail silently to avoid blocking message viewing */
        }
    }, [user?.uid]);

    // --- 3. GET OR CREATE ROOM (Zero Redundant Calls) ---
    const getOrCreateChatRoom = async (targetUserId: string, targetName: string, targetImage: string) => {
        if (!user?.uid || !targetUserId) return null;
        
        // 1. TRUST THE CACHE: onSnapshot already ensures 'rooms' has all relevant data.
        // If it's not in the local array, it doesn't exist for this user.
        const existing = rooms.find(r => r.participants.includes(targetUserId));
        if (existing) return existing.id;

        // 2. CREATE IF MISSING (Skip the extra getDocs server call)
        try {
            const res = await addDoc(collection(firestore, "chatRooms"), {
                participants: [user.uid, targetUserId],
                participantMetadata: {
                    [user.uid]: { name: user.name || "User", image: user.image || "" },
                    [targetUserId]: { name: targetName || "Pet Owner", image: targetImage || "" }
                },
                lastMessage: "Started a conversation",
                updatedAt: serverTimestamp(),
                lastRead: { 
                    [user.uid]: serverTimestamp(), 
                    // Use a standardized Firestore Timestamp for the initial "unread" state
                    [targetUserId]: Timestamp.fromDate(new Date(0)) 
                }
            });
            return res.id;
        } catch (error) {
            console.error("[ChatContext]: Creation Error", error);
            return null;
        }
    };

    const value = useMemo(() => ({ 
        getOrCreateChatRoom, 
        markAsRead, 
        rooms, 
        loadingRooms 
    }), [rooms, loadingRooms, markAsRead]);

    return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = () => {
    const context = useContext(ChatContext);
    if (!context) throw new Error("useChat must be used within ChatProvider");
    return context;
};