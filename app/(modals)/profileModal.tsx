import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useEffect, useState } from "react";
import ScreenWrapper from "@/components/ScreenWrapper";
import ModalWrapper from "@/components/ModalWrapper";
import Header from "@/components/Header";
import BackButton from "@/components/BackButton";
import { colors, spacingX, spacingY } from "@/constants/themes";
import { Image } from "expo-image";
import { getProfileImage } from "@/services/imageService";
import { scale, verticalScale } from "@/utils/styling";
import * as Icons from "phosphor-react-native";
import Typo from "@/components/Typo";
import Input from "@/components/Input";
import { UserDataType } from "@/types";
import Button from "@/components/Button";
import { useAuth } from "@/contexts/AuthContext";
import { updateUser } from "@/services/userService";
import { useRouter } from "expo-router";
const profileModal = () => {

  const { user, updateUserData } = useAuth();
  const [userData, setUserData] = useState<UserDataType>({
    name: "",
    image: null,
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  useEffect(() => {
    setUserData({
      name: user?.name || "",
      image: user?.image || null,
    })
  }, [user])

  const onSubmit = async () => {
    let { name, image } = userData;
    if (!name.trim()) {
      Alert.alert("User", "Please Fill all the fields")
      return;
    }
    setLoading(true);
    const res = await updateUser(user?.uid as string, userData);
    setLoading(false);
    if (res.success) {
      updateUserData(user?.uid as string);
      router.back()

    } else {
      Alert.alert("User", res.msg)
    }
  }
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
              source={getProfileImage(null)}
              contentFit="cover"
              transition={100}
            />
            <TouchableOpacity style={styles.editIcon}>
              <Icons.Pencil
                size={verticalScale(20)}
                color={colors.background}
              />
            </TouchableOpacity>
          </View>
          <View style={styles.inputContainer}>
            <Typo color={colors.primary}>
              Name
            </Typo>
            <Input
              placeholder="Name"
              value={userData.name}
              onChangeText={(value) =>
                setUserData({ ...userData, name: value })
              }
            />
          </View>
        </ScrollView>
      </View>
      <View style={styles.footer}>
        <Button onPress={onSubmit} style={{ flex: 1 }} loading={loading}>
          <Typo color={colors.background} fontWeight={"700"}>Update</Typo>
        </Button>
      </View>
    </ModalWrapper>
  );
};
export default profileModal;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: spacingY._20,
  },
  avatarContainer: {
    position: "relative",
    alignSelf: "center",
  },
  form: {
    gap: spacingY._30,
    marginTop: spacingY._15,
  },
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
    backgroundColor: colors.primary,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
    padding: spacingY._7,
  },
  inputContainer: {
    gap: spacingY._10,
  },
});
