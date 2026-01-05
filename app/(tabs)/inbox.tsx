import React, { useEffect, useState, useRef } from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import ScreenWrapper from '@/components/ScreenWrapper';
import Typo from '@/components/Typo';
import { useChat } from '@/contexts/chatContext';
import { useAuth } from '@/contexts/AuthContext';
import { colors, radius, spacingX, spacingY } from '@/constants/themes';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { CaretRight, ChatTeardropDots } from 'phosphor-react-native';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '@/config/firebase';

const Inbox = () => {
  const { rooms, loadingRooms } = useChat();
  const { user } = useAuth();
  const isNavigating = useRef(false);

  return (
    <ScreenWrapper style={styles.container}>
      <View style={styles.header}>
        <Typo size={28} fontWeight="700">Messages</Typo>
      </View>

      {loadingRooms ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={rooms}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <ChatListItem 
              room={item} 
              currentUserId={user?.uid!} 
              isNavigating={isNavigating} 
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              {/* ✅ FIXED: Changed <div> to <View> */}
              <View style={styles.emptyIconContainer}>
                <ChatTeardropDots size={80} color={colors.primary} weight="duotone" />
              </View>
              <Typo size={20} fontWeight="700">No messages yet</Typo>
              <Typo color={colors.textLighter}>Contact sellers to start chatting!</Typo>
            </View>
          }
        />
      )}
    </ScreenWrapper>
  );
};

const ChatListItem = ({ room, currentUserId, isNavigating }: any) => {
  const router = useRouter();
  const [otherUser, setOtherUser] = useState<any>(null);
  const [otherId, setOtherId] = useState<string | null>(null);

  const lastRead = room.lastRead?.[currentUserId]?.toDate?.() || new Date(0);
  const updatedAt = room.updatedAt instanceof Date ? room.updatedAt : room.updatedAt?.toDate?.() || new Date();
  const isUnread = updatedAt > lastRead;

  useEffect(() => {
    const id = room.participants.find((id: string) => id !== currentUserId);
    if (id) {
      setOtherId(id);
      getDoc(doc(firestore, "users", id)).then(d => setOtherUser(d.data()));
    }
  }, [room.participants]);

  const handleChatPress = () => {
    if (isNavigating.current) return;
    isNavigating.current = true;
    router.push({
      pathname: "/(modals)/chatScreenModal",
      params: { roomId: room.id, otherUserName: otherUser?.name || "User" }
    });
    setTimeout(() => { isNavigating.current = false; }, 1000);
  };

  // ✨Added: Navigate to User Analytics
  const handleAvatarPress = () => {
    if (isNavigating.current || !otherId) return;
    isNavigating.current = true;
    router.push({
      pathname: "/(modals)/userAnalyticsModal",
      params: { userId: otherId} 
    });
    setTimeout(() => { isNavigating.current = false; }, 1000);
  };

  return (
    <TouchableOpacity 
      activeOpacity={0.7}
      style={[styles.roomItem, isUnread && styles.unreadBg]}
      onPress={handleChatPress}
    >
      <TouchableOpacity onPress={handleAvatarPress}>
        <View style={styles.avatarContainer}>
          <Image 
            source={otherUser?.image ? { uri: otherUser.image } : require('../../assets/Avatar.jpg')} 
            style={styles.avatar} 
          />
          {isUnread && <View style={styles.unreadDot} />}
        </View>
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.row}>
          <Typo fontWeight={isUnread ? "800" : "700"} size={17}>{otherUser?.name || "Loading..."}</Typo>
          <Typo size={12} color={isUnread ? colors.primary : colors.textLighter}>
            {updatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Typo>
        </View>
        <Typo size={14} color={isUnread ? colors.text : colors.textLight} textProps={{ numberOfLines: 1 }}>
          {room.lastMessage || "No messages yet"}
        </Typo>
      </View>
      <CaretRight size={16} color={colors.textLighter} />
    </TouchableOpacity>
  );
};
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacingX._20, paddingVertical: spacingY._20 },
  listContent: { paddingHorizontal: spacingX._20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  roomItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 10,
    borderRadius: radius._15,
    borderBottomWidth: 1,
    borderBottomColor: colors.backgroundDark,
  },
  unreadBg: {
    backgroundColor: colors.primary + '08', 
  },
  avatarContainer: { position: 'relative' },
  avatar: { width: 60, height: 60, borderRadius: radius._20, backgroundColor: colors.backgroundDark },
  unreadDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.white
  },
  content: { flex: 1, marginLeft: 16, justifyContent: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  lastMsgRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  lastMessage: { flex: 1, paddingRight: 10 },
  newBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100, paddingHorizontal: 40 },
  emptyIconContainer: { 
    width: 120, height: 120, borderRadius: 60, 
    backgroundColor: colors.primary + '15', 
    alignItems: 'center', justifyContent: 'center', 
    marginBottom: 20 
  }
});

export default Inbox;