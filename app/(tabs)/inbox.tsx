import React, { memo, useCallback, useRef, useState, useEffect } from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View, ActivityIndicator, Platform } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { doc, onSnapshot } from 'firebase/firestore';
import { formatDistanceToNowStrict } from 'date-fns';
import { CaretRight, ChatTeardropDots, MagnifyingGlass } from 'phosphor-react-native';

import ScreenWrapper from '@/components/ScreenWrapper';
import Typo from '@/components/Typo';
import { useChat } from '@/contexts/chatContext';
import { useAuth } from '@/contexts/AuthContext';
import { firestore } from '@/config/firebase';
import { colors, radius, spacingX, spacingY } from '@/constants/themes';
import { ChatRoomType, UserType } from '@/types';

const Inbox = () => {
  const { rooms, loadingRooms } = useChat();
  const { user } = useAuth();
  const isNavigating = useRef(false);

  const renderItem = useCallback(({ item }: { item: ChatRoomType }) => (
    <ChatListItem 
      room={item} 
      currentUserId={user?.uid!} 
      isNavigating={isNavigating} 
    />
  ), [user?.uid]);

  if (!user) return null;

  return (
    <ScreenWrapper style={styles.container}>
      <View style={styles.header}>
        <Typo size={28} fontWeight="800">Messages</Typo>
        <TouchableOpacity style={styles.searchBtn}>
          <MagnifyingGlass size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      {loadingRooms ? (
        <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : (
        <FlatList
          data={rooms}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={renderItem}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          ListEmptyComponent={<EmptyInbox />}
        />
      )}
    </ScreenWrapper>
  );
};

const ChatListItem = memo(({ room, currentUserId, isNavigating }: any) => {
  const router = useRouter();
  const [otherUser, setOtherUser] = useState<UserType | null>(null);
  
  const otherId = room.participants.find((id: string) => id !== currentUserId);

  // REAL-TIME USER SYNC: Fetch name/image dynamically
  useEffect(() => {
    if (!otherId) return;
    const unsub = onSnapshot(doc(firestore, "users", otherId), (docSnap) => {
      if (docSnap.exists()) setOtherUser(docSnap.data() as UserType);
    });
    return unsub; // Cancel API call on unmount
  }, [otherId]);

  const updatedAt = room.updatedAt?.toDate ? room.updatedAt.toDate() : new Date(room.updatedAt || 0);
  const lastRead = room.lastRead?.[currentUserId]?.toDate?.() || new Date(0);
  const isUnread = updatedAt > lastRead;

  const handlePress = () => {
    if (isNavigating.current) return;
    isNavigating.current = true;
    router.push({
      pathname: "/(modals)/chatScreenModal",
      params: { roomId: room.id, otherUserId: otherId }
    });
    setTimeout(() => { isNavigating.current = false; }, 800);
  };

  return (
    <TouchableOpacity 
      activeOpacity={0.8} 
      style={[styles.roomItem, isUnread && styles.unreadBg]} 
      onPress={handlePress}
    >
      <Image 
        source={otherUser?.image ? { uri: otherUser.image } : require('../../assets/Avatar.jpg')} 
        style={styles.avatar}
        transition={200}
      />
      <View style={styles.content}>
        <View style={styles.row}>
          <Typo fontWeight="700" size={17}>{otherUser?.name || "Loading..."}</Typo>
          <Typo size={12} color={colors.textLighter}>
            {updatedAt > 0 ? formatDistanceToNowStrict(updatedAt) : ""}
          </Typo>
        </View>
        <Typo size={14} color={isUnread ? colors.text : colors.textLight} style={{ flex: 1 }}>
          {room.lastMessage || "Start a conversation"}
        </Typo>
      </View>
      {isUnread && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
});

const EmptyInbox = () => (
  <View style={styles.empty}>
    <ChatTeardropDots size={60} color={colors.textLighter} weight="duotone" />
    <Typo color={colors.textLighter}>No conversations yet</Typo>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20 },
  listContent: { paddingHorizontal: 20, paddingBottom: 20 },
  center: { flex: 1, justifyContent: 'center' },
  roomItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 20, backgroundColor: 'white', marginBottom: 12, elevation: 2 },
  unreadBg: { backgroundColor: colors.primary + '08' },
  avatar: { width: 55, height: 55, borderRadius: 200, backgroundColor: colors.backgroundDark },
  content: { flex: 1, marginLeft: 15 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  searchBtn: { backgroundColor: 'white', padding: 10, borderRadius: 12 },
  empty: { flex: 1, alignItems: 'center', marginTop: 100, gap: 10 }
});

export default Inbox;