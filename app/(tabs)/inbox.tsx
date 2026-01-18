import React, { memo, useCallback, useRef, useState, useEffect, useMemo } from 'react';
import { 
  FlatList, StyleSheet, TouchableOpacity, View, 
  ActivityIndicator, TextInput 
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { doc, onSnapshot } from 'firebase/firestore';
import { formatDistanceToNowStrict } from 'date-fns';
import { 
  ChatTeardropDots, MagnifyingGlass, 
  ChatCircleText, XCircle 
} from 'phosphor-react-native';

import ScreenWrapper from '@/components/ScreenWrapper';
import Typo from '@/components/Typo';
import { useChat } from '@/contexts/chatContext';
import { useAuth } from '@/contexts/AuthContext';
import { firestore } from '@/config/firebase';
import { colors, radius, spacingX, spacingY } from '@/constants/themes';
import { ChatRoomType, UserType } from '@/types';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

const Inbox = () => {
  const { rooms, loadingRooms } = useChat();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);
  const isNavigating = useRef(false);

  // --- GUEST MODE ---
  if (!user) {
    return (
      <ScreenWrapper style={styles.container}>
        <View style={styles.header}><Typo size={28} fontWeight="800">Messages</Typo></View>
        <View style={styles.guestContainer}>
          <View style={styles.iconCircle}>
            <ChatCircleText size={40} color={colors.textLighter} weight="duotone" />
          </View>
          <Typo size={20} fontWeight="700" color={colors.text}>No conversations yet</Typo>
          <Typo color={colors.textLight} style={styles.guestSub}>
            You'll see all your messages and adoption inquiries here once you start a conversation.
          </Typo>
        </View>
      </ScreenWrapper>
    );
  }

  // --- PRECISION METADATA SEARCH ---
  const filteredRooms = useMemo(() => {
    const cleanSearch = debouncedSearch.trim().toLowerCase();
    if (!cleanSearch) return rooms;

    return rooms.filter((room) => {
      const metadata = room.participantMetadata || {};
      
      // We check all participants in the metadata for a name match
      // This ensures we find the "other user" regardless of array order
      return Object.entries(metadata).some(([uid, data]: [string, any]) => {
        // Don't match the current user's own name in the search
        if (uid === user.uid) return false;
        
        const participantName = data?.name?.toLowerCase() || "";
        return participantName.includes(cleanSearch);
      });
    });
  }, [debouncedSearch, rooms, user.uid]);

  const renderItem = useCallback(({ item }: { item: ChatRoomType }) => (
    <ChatListItem room={item} currentUserId={user.uid} isNavigating={isNavigating} />
  ), [user.uid]);

  return (
    <ScreenWrapper style={styles.container}>
      <View style={styles.header}>
        <Typo size={28} fontWeight="800">Messages</Typo>
        <View style={styles.searchBarContainer}>
          <MagnifyingGlass size={20} color={colors.textLighter} />
          <TextInput
            placeholder="Search by name..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={colors.textLighter}
            style={styles.searchInput}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <XCircle size={18} color={colors.textLighter} weight="fill" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loadingRooms ? (
        <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : (
        <FlatList
          data={filteredRooms}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={renderItem}
          initialNumToRender={10}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={<EmptyInbox isSearching={!!searchQuery} />}
        />
      )}
    </ScreenWrapper>
  );
};

const ChatListItem = memo(({ room, currentUserId, isNavigating }: any) => {
  const router = useRouter();
  const [otherUser, setOtherUser] = useState<UserType | null>(null);
  const otherId = room.participants.find((id: string) => id !== currentUserId);

  useEffect(() => {
    if (!otherId) return;
    return onSnapshot(doc(firestore, "users", otherId), (snap) => {
      if (snap.exists()) setOtherUser(snap.data() as UserType);
    });
  }, [otherId]);

  const updatedAt = room.updatedAt?.toDate ? room.updatedAt.toDate() : new Date(room.updatedAt || 0);
  const lastRead = room.lastRead?.[currentUserId]?.toDate?.() || new Date(0);
  const isUnread = updatedAt > lastRead;

  const handlePress = () => {
    if (isNavigating.current) return;
    isNavigating.current = true;
    router.push({
      pathname: "/(modals)/chatScreenModal",
      params: { 
        roomId: room.id, 
        otherUserId: otherId, 
        otherUserName: otherUser?.name || room.participantMetadata?.[otherId!]?.name 
      }
    });
    setTimeout(() => { isNavigating.current = false; }, 800);
  };

  return (
    <TouchableOpacity 
      activeOpacity={0.7} 
      style={[styles.roomItem, isUnread && styles.unreadContainer]} 
      onPress={handlePress}
    >
      {isUnread && <View style={styles.unreadIndicatorBar} />}
      
      <View style={styles.avatarWrapper}>
        <Image 
          source={otherUser?.image ? { uri: otherUser.image } : (room.participantMetadata?.[otherId!]?.image ? { uri: room.participantMetadata[otherId!].image } : require('../../assets/Avatar.jpg'))} 
          style={styles.avatar} 
          contentFit="cover" 
        />
        {isUnread && <View style={styles.unreadPulse} />}
      </View>

      <View style={styles.content}>
        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 10, height: 22, overflow: 'hidden' }}>
            <Typo fontWeight="700" size={17}>{otherUser?.name || room.participantMetadata?.[otherId!]?.name || "..."}</Typo>
          </View>
          <Typo size={12} color={isUnread ? colors.primary : colors.textLighter}>
            {updatedAt.getTime() > 0 ? formatDistanceToNowStrict(updatedAt) : ""}
          </Typo>
        </View>
        <View style={{ height: 20, overflow: 'hidden' }}>
          <Typo size={14} color={isUnread ? colors.text : colors.textLight} style={isUnread ? { fontWeight: '700' } : {}}>
            {room.lastMessage || "Start a conversation"}
          </Typo>
        </View>
      </View>
    </TouchableOpacity>
  );
});

const EmptyInbox = ({ isSearching }: { isSearching: boolean }) => (
  <View style={styles.empty}>
    <ChatTeardropDots size={64} color={colors.backgroundDark} weight="duotone" />
    <Typo color={colors.textLight} fontWeight="600">
      {isSearching ? "No buddies found" : "Your inbox is empty"}
    </Typo>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: spacingX._20, gap: spacingY._15 },
  searchBarContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: colors.backgroundDark, 
    borderRadius: radius._15, 
    paddingHorizontal: spacingX._15, 
    height: 50 
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16, color: colors.text },
  listContent: { paddingHorizontal: spacingX._20, paddingBottom: 100 },
  center: { flex: 1, justifyContent: 'center' },
  roomItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 16, 
    borderRadius: radius._20, 
    backgroundColor: colors.white, 
    marginBottom: 12, 
    borderWidth: 1, 
    borderColor: colors.backgroundDark, 
    overflow: 'hidden' 
  },
  unreadContainer: { backgroundColor: colors.primary + '08', borderColor: colors.primary + '30' },
  unreadIndicatorBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: colors.primary },
  avatarWrapper: { position: 'relative' },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.backgroundDark },
  unreadPulse: { 
    position: 'absolute', 
    right: 0, 
    top: 0, 
    width: 14, 
    height: 14, 
    borderRadius: 7, 
    backgroundColor: colors.primary, 
    borderWidth: 2, 
    borderColor: 'white' 
  },
  content: { flex: 1, marginLeft: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  empty: { flex: 1, alignItems: 'center', marginTop: 120, gap: 12 },
  guestContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  iconCircle: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    backgroundColor: colors.backgroundDark, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 20 
  },
  guestSub: { textAlign: 'center', marginTop: 10, lineHeight: 22 },
});

export default Inbox;