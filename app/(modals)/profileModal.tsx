import {
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useEffect, useState } from "react";
import ModalWrapper from "@/components/ModalWrapper";
import Header from "@/components/Header";
import BackButton from "@/components/BackButton";
import { colors, spacingX, spacingY } from "@/constants/themes";
import { Image } from "expo-image";
import { scale, verticalScale } from "@/utils/styling";
import { Pencil } from "phosphor-react-native";
import Typo from "@/components/Typo";
import Input from "@/components/Input";
import { UserDataType } from "@/types";
import Button from "@/components/Button";
import { useAuth } from "@/contexts/AuthContext";
import { updateUser } from "@/services/userService";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import UploadModal from "./UploadModal";

const ProfileModal = () => {
  const { user, updateUserData } = useAuth();
  const [userData, setUserData] = useState<UserDataType>({
    name: "",
    image: null,
  });
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setUserData({
      name: user?.name || "",
      image: user?.image || null,
    });
  }, [user]);

  const onBackPress = () => setModalVisible(false);

  const onCameraPress = async () => {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    console.log("Camera result:", result);
    if (!result.canceled) {
      setUserData({ ...userData, image: result.assets[0] });
    }
    setModalVisible(false);
  };

  const onGalleryPress = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    console.log("Gallery result:", result);
    if (!result.canceled) {
      setUserData({ ...userData, image: result.assets[0] });
    }
    setModalVisible(false);
  };

  const onRemovePress = () => {
    console.log("Remove image selected");
    setUserData({ ...userData, image: null });
    setModalVisible(false);
  };

  const onSubmit = async () => {
    const { name, image } = userData;

    if (!name.trim()) {
      Alert.alert("User", "Please fill all the fields");
      return;
    }

    console.log("Submitting update:", { name, imageType: typeof image, imageHasUri: (image as any)?.uri });

    setLoading(true);

    const res = await updateUser(user?.uid as string, {
      name,
      image: image || null,
    });

    setLoading(false);

    if (res.success) {
      updateUserData(user?.uid as string);
      router.back();
    } else {
      Alert.alert("User", res.msg);
    }
  };

  return (
    <ModalWrapper>
      <View style={styles.container}>
        <Header
          title="Update Profile"
          leftIcon={<BackButton />}
          style={{ marginBottom: spacingY._10 }}
        />
        <ScrollView contentContainerStyle={styles.form}>
          <View style={styles.avatarContainer}>
            <Image
              style={styles.avatar}
              source={
                typeof userData.image === "string"
                  ? { uri: userData.image }
                  : (userData.image as any)?.uri
                  ? { uri: (userData.image as any).uri }
                  : require("../../assets/Avatar.jpg")
              }
              contentFit="cover"
              transition={100}
            />
            <TouchableOpacity
              onPress={() => setModalVisible(true)}
              style={styles.editIcon}
            >
              <Pencil 
                size={verticalScale(20)} 
                color={colors.background} 
                weight="duotone"
              />
            </TouchableOpacity>
          </View>
          <View style={styles.inputContainer}>
            <Typo color={colors.text}>Name</Typo>
            <Input
              placeholder="Name"
              value={userData.name}
              onChangeText={(value) => setUserData({ ...userData, name: value })}
            />
          </View>
        </ScrollView>
      </View>
      <View style={styles.footer}>
        <Button onPress={onSubmit} style={{ flex: 1 }} loading={loading}>
          <Typo color={colors.background} fontWeight={"700"}>
            Update
          </Typo>
        </Button>
      </View>

      <UploadModal
        modalVisible={modalVisible}
        onBackPress={onBackPress}
        onCameraPress={onCameraPress}
        onGalleryPress={onGalleryPress}
        onRemovePress={onRemovePress}
        isLoading={loading}
      />
    </ModalWrapper>
  );
};

export default ProfileModal;

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "space-between", paddingHorizontal: spacingY._20 },
  avatarContainer: { position: "relative", alignSelf: "center" },
  form: { gap: spacingY._30, marginTop: spacingY._15 },
  footer: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    paddingHorizontal: spacingX._20,
    gap: scale(12),
    paddingTop: spacingY._15,
    marginBottom: spacingY._20,
  },
  avatar: {
    alignSelf: "center",
    backgroundColor: colors.backgroundDark,
    height: verticalScale(135),
    width: verticalScale(135),
    borderRadius: 200,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  editIcon: {
    position: "absolute",
    bottom: spacingY._5,
    right: spacingY._7,
    borderRadius: 100,
    backgroundColor: colors.green,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
    padding: spacingY._7,
  },
  inputContainer: { gap: spacingY._10 },
});