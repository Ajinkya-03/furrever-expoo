import {
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useState } from "react";
import ModalWrapper from "@/components/ModalWrapper";
import Header from "@/components/Header";
import BackButton from "@/components/BackButton";
import { colors, spacingX, spacingY } from "@/constants/themes";
import { Image } from "expo-image";
import { scale, verticalScale } from "@/utils/styling";
import { Pencil } from "phosphor-react-native";
import Typo from "@/components/Typo";
import Input from "@/components/Input";
import Button from "@/components/Button";
import { usePets } from "@/contexts/PetContext";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import UploadModal from "./UploadModal";

const PetListModal = () => {
  const { addPet } = usePets();
  const { user } = useAuth();
  const router = useRouter();

  const [petData, setPetData] = useState({
    name: "",
    category: "",
    age: "",
    description: "",
    address: "",
    image: null as any,
  });

  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const onBackPress = () => setModalVisible(false);

  const onCameraPress = async () => {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled) {
      setPetData({ ...petData, image: result.assets[0] });
    }
    setModalVisible(false);
  };

  const onGalleryPress = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled) {
      setPetData({ ...petData, image: result.assets[0] });
    }
    setModalVisible(false);
  };

  const onRemovePress = () => {
    setPetData({ ...petData, image: null });
    setModalVisible(false);
  };

  const onSubmit = async () => {
    const { name, category, age, description, address, image } = petData;

    if (!name.trim() || !category.trim() || !description.trim() || !address.trim()) {
      Alert.alert("Pet", "Please fill all required fields");
      return;
    }

    if (!image || !(image as any)?.uri) {
      Alert.alert("Pet", "Please add an authentic image for your pet.");
      return;
    }

    setLoading(true);

    const res = await addPet(
      {
        name,
        category,
        age: age ? Number(age) : undefined,
        description,
        address,
        ownerId: user?.uid,
      },
      image
    );

    setLoading(false);

    if (res.success) {
      router.back();
    } else {
      Alert.alert("Pet", res.msg || "Could not add pet");
    }
  };

  return (
    <ModalWrapper>
      <ScrollView contentContainerStyle={styles.container}>
        <Header
          title="Add Pet"
          leftIcon={<BackButton />}
          style={{ marginBottom: spacingY._10 }}
        />

        {/* Pet Image */}
        <View style={styles.avatarContainer}>
          <Image
            style={styles.avatar}
            source={
              typeof petData.image === "string"
                ? { uri: petData.image }
                : (petData.image as any)?.uri
                ? { uri: (petData.image as any).uri }
                : require("../../assets/Logo.png")
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

        {/* Inputs */}
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Typo color={colors.text}>Name</Typo>
            <Input
              placeholder="Pet name"
              value={petData.name}
              onChangeText={(value) => setPetData({ ...petData, name: value })}
            />
          </View>

          <View style={styles.inputContainer}>
            <Typo color={colors.text}>Category</Typo>
            <Input
              placeholder="Dog, Cat, etc."
              value={petData.category}
              onChangeText={(value) => setPetData({ ...petData, category: value })}
            />
          </View>

          <View style={styles.inputContainer}>
            <Typo color={colors.text}>Age</Typo>
            <Input
              placeholder="Age in years"
              keyboardType="numeric"
              value={petData.age}
              onChangeText={(value) => setPetData({ ...petData, age: value })}
            />
          </View>

          <View style={styles.inputContainer}>
            <Typo color={colors.text}>Description</Typo>
            <Input
              placeholder="Describe your pet"
              value={petData.description}
              onChangeText={(value) => setPetData({ ...petData, description: value })}
            />
          </View>

          <View style={styles.inputContainer}>
            <Typo color={colors.text}>Address</Typo>
            <Input
              placeholder="Your address"
              value={petData.address}
              onChangeText={(value) => setPetData({ ...petData, address: value })}
            />
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Button onPress={onSubmit} style={{ flex: 1 }} loading={loading}>
              <Typo color={colors.background} fontWeight={"700"}>
                Save Pet
              </Typo>
            </Button>
          </View>
        </View>
      </ScrollView>

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

export default PetListModal;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacingY._20,
    paddingBottom: spacingY._30,
  },
  avatarContainer: {
    position: "relative",
    alignSelf: "center",
    marginTop: spacingY._10,
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
    backgroundColor: colors.green,
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
