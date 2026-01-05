import BackButton from '@/components/BackButton';
import ScreenWrapper from '@/components/ScreenWrapper';
import Typo from '@/components/Typo';
import { firestore } from '@/config/firebase';
import { colors } from '@/constants/themes';
import { useAuth } from '@/contexts/AuthContext';
import { uploadFileToCloudinary } from '@/services/imageService';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { addDoc, collection, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc } from 'firebase/firestore';
import { CaretRight, Image as ImageIcon, PaperPlaneRight } from 'phosphor-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

const ChatScreenModal = () => {
  const { roomId, otherUserName, otherUserImage, otherUserId } = useLocalSearchParams();
  const { user } = useAuth();
  const router = useRouter();
  
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [uploading, setUploading] = useState(false);
  
  const isNavigating = useRef(false); // Throttle guard

  useEffect(() => {
    const q = query(collection(firestore, `chatRooms/${roomId}/messages`), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snapshot) => {
      const newMsgs = snapshot.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
      if (newMsgs.length > 0 && (newMsgs[0] as any).senderId !== user?.uid) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      setMessages(newMsgs);
    });
  }, [roomId]);

  const sendMessage = async (imgUrl?: string) => {
    if (!inputText.trim() && !imgUrl) return;
    const textToSend = inputText.trim();
    setInputText("");

    await addDoc(collection(firestore, `chatRooms/${roomId}/messages`), {
      text: imgUrl ? "" : textToSend,
      image: imgUrl || null,
      type: imgUrl ? "image" : "text",
      senderId: user?.uid,
      createdAt: serverTimestamp()
    });

    await updateDoc(doc(firestore, "chatRooms", roomId as string), {
      lastMessage: imgUrl ? "📷 Photo" : textToSend,
      updatedAt: serverTimestamp(),
      [`lastRead.${user?.uid}`]: serverTimestamp()
    });
  };

  const handlePickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.6,
    });

    if (!result.canceled) {
      setUploading(true);
      const res = await uploadFileToCloudinary(result.assets[0], 'chat_messages');
      if (res.success) await sendMessage(res.data);
      setUploading(false);
    }
  };

  const handleOpenAnalytics = () => {
    if (isNavigating.current) return; // * Limit click to once
    isNavigating.current = true;
    router.push({ pathname: "/(modals)/userAnalyticsModal", params: { userId: otherUserId } });
    setTimeout(() => { isNavigating.current = false; }, 800);
  };

  return (
    <ScreenWrapper style={styles.container}>
      <View style={styles.header}>
        <BackButton />
        <TouchableOpacity style={styles.headerProfile} onPress={handleOpenAnalytics} activeOpacity={0.7}>
          <Image source={otherUserImage ? { uri: otherUserImage } : require('../../assets/Avatar.jpg')} style={styles.avatar} />
          <View style={{ flex: 1 }}>
            <Typo fontWeight="700" size={16}>{otherUserName}</Typo>
            <Typo size={12} color={colors.primary}>Tap for exact details</Typo>
          </View>
          <CaretRight size={18} color={colors.textLighter} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={messages}
        inverted
        contentContainerStyle={{ padding: 20 }}
        renderItem={({ item }) => {
          const isMine = item.senderId === user?.uid;
          return (
            <View style={[styles.bubble, isMine ? styles.myBubble : styles.theirBubble]}>
              {item.type === 'image' ? (
                <Image source={{ uri: item.image }} style={styles.msgImg} contentFit="cover" />
              ) : (
                <Typo color={isMine ? "white" : colors.text}>{item.text}</Typo>
              )}
            </View>
          );
        }}
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.inputContainer}>
          <TouchableOpacity onPress={handlePickImage} disabled={uploading}>
            <ImageIcon size={28} color={uploading ? colors.textLighter : colors.primary} weight="fill" />
          </TouchableOpacity>
          <TextInput value={inputText} onChangeText={setInputText} placeholder="Type message..." style={styles.input} />
          <TouchableOpacity onPress={() => sendMessage()} style={styles.sendBtn}>
            <PaperPlaneRight size={22} color="white" weight="fill" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
};

export default ChatScreenModal;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: colors.backgroundDark, gap: 10 },
  headerProfile: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 45, height: 45, borderRadius: 22 },
  bubble: { maxWidth: '75%', padding: 12, borderRadius: 18, marginBottom: 10 },
  myBubble: { alignSelf: 'flex-end', backgroundColor: colors.primary, borderBottomRightRadius: 2 },
  theirBubble: { alignSelf: 'flex-start', backgroundColor: colors.backgroundDark, borderBottomLeftRadius: 2 },
  msgImg: { width: 220, height: 160, borderRadius: 12 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: 'white', gap: 12 },
  input: { flex: 1, backgroundColor: colors.backgroundDark, height: 44, borderRadius: 22, paddingHorizontal: 15 },
  sendBtn: { backgroundColor: colors.primary, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' }
});