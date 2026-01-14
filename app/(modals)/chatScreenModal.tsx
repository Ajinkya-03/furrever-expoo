import React, { useEffect, useRef, useState, memo, useMemo } from 'react';
import { 
  FlatList, KeyboardAvoidingView, Platform, StyleSheet, 
  TextInput, TouchableOpacity, View, ActivityIndicator, Alert, Linking, Modal
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { addDoc, collection, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc } from 'firebase/firestore';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { 
  PaperPlaneRight, Image as ImageIcon, 
  MapPin, Camera, FilePlus, X, MagnifyingGlassPlus
} from 'phosphor-react-native';

import ScreenWrapper from '@/components/ScreenWrapper';
import Typo from '@/components/Typo';
import BackButton from '@/components/BackButton';
import { firestore } from '@/config/firebase';
import { colors, spacingX } from '@/constants/themes';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/contexts/chatContext';
import { uploadFileToCloudinary } from '@/services/imageService';
import { UserType, MessageType } from '@/types';

const ChatScreenModal = () => {
  const { roomId, otherUserId, otherUserName } = useLocalSearchParams<{ roomId: string; otherUserId: string; otherUserName: string }>();
  const { user } = useAuth();
  const { markAsRead } = useChat();
  const router = useRouter();
  
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [inputText, setInputText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [otherUser, setOtherUser] = useState<UserType | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  const busyLock = useRef(false);

  // FETCH THE CORRECT USER DATA
  useEffect(() => {
    if (!otherUserId) return;
    const unsub = onSnapshot(doc(firestore, "users", otherUserId), (snap) => {
      if (snap.exists()) setOtherUser(snap.data() as UserType);
    });
    return unsub;
  }, [otherUserId]);

  useEffect(() => {
    if (!roomId) return;
    markAsRead(roomId);
    const q = query(collection(firestore, `chatRooms/${roomId}/messages`), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() } as MessageType)));
    });
    return unsub;
  }, [roomId]);

  const handleSend = async (type: 'text' | 'image' | 'location', content: any) => {
    if (busyLock.current || (type === 'text' && !inputText.trim())) return;
    busyLock.current = true;
    const messageContent = type === 'text' ? inputText.trim() : content;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await Promise.all([
        addDoc(collection(firestore, `chatRooms/${roomId}/messages`), {
          senderId: user?.uid,
          type,
          content: messageContent,
          createdAt: serverTimestamp(),
        }),
        updateDoc(doc(firestore, "chatRooms", roomId!), {
          lastMessage: type === 'text' ? messageContent : `📷 Photo`,
          updatedAt: serverTimestamp(),
          [`lastRead.${user?.uid}`]: serverTimestamp()
        })
      ]);
      setInputText("");
      setShowMenu(false);
    } catch (error) {
      console.error("Chat Action Error:", error);
    } finally {
      setTimeout(() => { busyLock.current = false; }, 400);
    }
  };

  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return Alert.alert("Error", "Camera access denied");
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled) uploadAndSend(result.assets[0]);
  };

  const openGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (!result.canceled) uploadAndSend(result.assets[0]);
  };

  const uploadAndSend = async (asset: any) => {
    setUploading(true);
    const res = await uploadFileToCloudinary(asset, 'chat');
    if (res.success) handleSend('image', res.data);
    setUploading(false);
  };

  const handleLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return Alert.alert("Denied", "Location required");
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    handleSend('location', { lat: loc.coords.latitude, lng: loc.coords.longitude });
  };

  const handleProfilePress = () => {
    if (busyLock.current || !otherUserId) return;
    busyLock.current = true;
    Haptics.selectionAsync();
    router.push({ pathname: "/(modals)/userAnalyticsModal", params: { userId: otherUserId }});
    setTimeout(() => { busyLock.current = false; }, 1000);
  };

  const isInputEmpty = useMemo(() => inputText.trim().length === 0, [inputText]);

  return (
    <ScreenWrapper style={styles.container}>
      <View style={styles.header}>
        <BackButton />
        <TouchableOpacity style={styles.headerInfo} onPress={handleProfilePress} activeOpacity={0.7}>
          <Image source={otherUser?.image ? { uri: otherUser.image } : require('../../assets/Avatar.jpg')} style={styles.headerAvatar} />
          <View>
            <Typo fontWeight="700" size={17}>{otherUser?.name || otherUserName || "..."}</Typo>
            <Typo size={12} color={colors.primary} fontWeight="700">View Profile</Typo>
          </View>
        </TouchableOpacity>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.chatArea}>
            <FlatList
              data={messages}
              inverted
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <MessageBubble item={item} isMine={item.senderId === user?.uid} onImagePress={(uri: string) => setPreviewImage(uri)} />
              )}
            />
        </View>

        <View style={styles.inputSection}>
          {showMenu && (
            <View style={styles.richMenu}>
              <MenuBtn icon={<ImageIcon color={colors.primary} />} label="Gallery" onPress={openGallery} />
              <MenuBtn icon={<Camera color={colors.primary} />} label="Camera" onPress={openCamera} />
              <MenuBtn icon={<MapPin color={colors.primary} />} label="Location" onPress={handleLocation} />
            </View>
          )}
          <View style={styles.inputBar}>
            <TouchableOpacity onPress={() => { Haptics.selectionAsync(); setShowMenu(!showMenu); }}>
              {showMenu ? <X size={28} color={colors.textLight} /> : <FilePlus size={28} color={colors.primary} weight="duotone" />}
            </TouchableOpacity>
            <TextInput value={inputText} onChangeText={setInputText} placeholder="Type message..." style={styles.input} multiline placeholderTextColor={colors.textLighter} />
            <TouchableOpacity disabled={isInputEmpty || uploading || busyLock.current} onPress={() => handleSend('text', inputText)} style={[styles.sendBtn, { backgroundColor: (isInputEmpty || busyLock.current) ? colors.primary + '40' : colors.primary }]}>
              {uploading ? <ActivityIndicator color="white" size="small" /> : <PaperPlaneRight color="white" weight="fill" size={20} />}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      <Modal visible={!!previewImage} transparent={false} animationType="fade">
        <View style={styles.fullScreenPreview}>
          <TouchableOpacity style={styles.closePreview} onPress={() => setPreviewImage(null)}><X size={30} color="white" weight="bold" /></TouchableOpacity>
          <Image source={{ uri: previewImage || '' }} style={styles.previewImage} contentFit="contain" />
        </View>
      </Modal>
    </ScreenWrapper>
  );
};

const MessageBubble = memo(({ item, isMine, onImagePress }: any) => {
    const openMap = () => {
        if (item.type === 'location' && item.content?.lat) {
            const { lat, lng } = item.content;
            Linking.openURL(Platform.select({ ios: `maps:0,0?q=${lat},${lng}`, android: `geo:0,0?q=${lat},${lng}` })!);
        }
    };
    return (
        <View style={[styles.bubble, isMine ? styles.myBubble : styles.theirBubble]}>
            {item.type === 'text' && <Typo color={isMine ? "white" : colors.text} size={15}>{item.content || ""}</Typo>}
            {item.type === 'image' && (
                <TouchableOpacity onPress={() => onImagePress(item.content)} activeOpacity={0.9}>
                    <Image source={{ uri: item.content }} style={styles.msgImg} transition={200} />
                    <View style={styles.zoomIcon}><MagnifyingGlassPlus size={18} color="white" /></View>
                </TouchableOpacity>
            )}
            {item.type === 'location' && (
                <TouchableOpacity style={styles.locationBtn} onPress={openMap}>
                    <MapPin size={22} color={isMine ? "white" : colors.primary} weight="fill" />
                    <View><Typo color={isMine ? "white" : colors.text} fontWeight="700">Location Shared</Typo><Typo color={isMine ? "rgba(255,255,255,0.7)" : colors.textLighter} size={11}>Tap for Maps</Typo></View>
                </TouchableOpacity>
            )}
        </View>
    );
});

const MenuBtn = ({ icon, label, onPress }: any) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <View style={styles.menuIcon}>{icon}</View>
    <Typo size={12} fontWeight="600">{label}</Typo>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.backgroundDark, backgroundColor: colors.background },
  headerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, justifyContent: 'flex-start', paddingLeft: spacingX._15 },
  headerAvatar: { width: 40, height: 40, borderRadius: 200, backgroundColor: colors.backgroundDark },
  chatArea: { flex: 1 },
  listContent: { padding: 20, paddingBottom: 10 },
  bubble: { maxWidth: '85%', padding: 12, borderRadius: 20, marginBottom: 12 },
  myBubble: { alignSelf: 'flex-end', backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  theirBubble: { alignSelf: 'flex-start', backgroundColor: 'white', borderBottomLeftRadius: 4, elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
  msgImg: { width: 220, height: 160, borderRadius: 15 },
  zoomIcon: { position: 'absolute', bottom: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 10, padding: 4 },
  locationBtn: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  inputSection: { backgroundColor: colors.background },
  inputBar: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: colors.background, gap: 12, borderTopWidth: 1, borderTopColor: colors.backgroundDark, paddingBottom: Platform.OS === 'ios' ? 30 : 12 },
  input: { flex: 1, backgroundColor: 'white', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, maxHeight: 100, fontSize: 15, color: colors.text },
  sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  richMenu: { flexDirection: 'row', padding: 20, backgroundColor: colors.background, borderTopWidth: 1, borderTopColor: colors.backgroundDark, justifyContent: 'space-around' },
  menuItem: { alignItems: 'center', gap: 8 },
  menuIcon: { width: 50, height: 50, backgroundColor: 'white', borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  fullScreenPreview: { flex: 1, backgroundColor: 'black', justifyContent: 'center' },
  previewImage: { width: '100%', height: '100%' },
  closePreview: { position: 'absolute', top: 50, right: 20, zIndex: 10 }
});

export default ChatScreenModal;