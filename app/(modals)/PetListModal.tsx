import BackButton from "@/components/BackButton";
import Button from "@/components/Button";
import Header from "@/components/Header";
import Input from "@/components/Input";
import ModalWrapper from "@/components/ModalWrapper";
import Typo from "@/components/Typo";
import { colors, radius, spacingX, spacingY } from "@/constants/themes";
import { useAuth } from "@/contexts/AuthContext";
import { usePets } from "@/contexts/PetContext";
import { getPetImage } from "@/services/imageService";
import { scale, verticalScale } from "@/utils/styling";
import { Picker } from "@react-native-picker/picker";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from 'expo-image-manipulator';
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import { CheckCircle, MapPinLine, Pencil } from "phosphor-react-native";
import React, { useEffect, useState, useMemo } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, TouchableOpacity, View, KeyboardAvoidingView, Platform } from "react-native";
import UploadModal from "./UploadModal";

const PetListModal = () => {
  const { addPet, updatePet, pets } = usePets();
  const { user } = useAuth();
  const router = useRouter();
  const { id, mode } = useLocalSearchParams();

  const isEditMode = mode === 'edit';

  const [petData, setPetData] = useState({
    name: "",
    category: "Dogs",
    breed: "",
    color: "",
    age: "",
    description: "",
    address: "",
    image: null as any,
  });

  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [locationFetched, setLocationFetched] = useState(false);
  
  const wordCount = useMemo(() => {
    const trimmed = petData.description.trim();
    return trimmed.length > 0 ? trimmed.split(/\s+/).length : 0;
  }, [petData.description]);

  useEffect(() => {
    if (isEditMode && id) {
      const petToEdit = pets.find((p: any) => p.id === id);
      if (petToEdit) {
        setPetData({
          name: petToEdit.name,
          category: petToEdit.category,
          breed: petToEdit.breed,
          color: petToEdit.coatcolor || "",
          age: petToEdit.age?.toString() || "",
          description: petToEdit.description || "",
          address: petToEdit.address || "",
          image: petToEdit.image,
        });
        setLocationFetched(!!petToEdit.address);
      }
    }
  }, [id, mode, pets]);

  const processImage = async (uri: string) => {
    try {
      const result = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1000 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );
      return result;
    } catch (e) {
      return { uri };
    }
  };

  const handleCameraPress = async () => {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true, aspect: [1, 1], quality: 0.8,
    });
    if (!result.canceled) {
      setLoading(true);
      const processed = await processImage(result.assets[0].uri);
      setPetData({ ...petData, image: processed });
      setLoading(false);
    }
    setModalVisible(false);
  };

  const handleGalleryPress = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true, aspect: [1, 1], quality: 0.8,
    });
    if (!result.canceled) {
      setLoading(true);
      const processed = await processImage(result.assets[0].uri);
      setPetData({ ...petData, image: processed });
      setLoading(false);
    }
    setModalVisible(false);
  };

  const handleRemovePress = () => {
    setPetData({ ...petData, image: null });
    setModalVisible(false);
  };

  const handleFetchLocation = async () => {
    setLocationLoading(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permission Denied", "Allow location access to auto-fill address.");
        return;
      }
      let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      let reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude, longitude: location.coords.longitude
      });
      if (reverseGeocode.length > 0) {
        let item = reverseGeocode[0];
        let addressStr = `${item.name || ''}, ${item.street || ''}, ${item.city}, ${item.region}`;
        addressStr = addressStr.replace(/^, /, "").replace(/, , /g, ", ");
        setPetData(prev => ({ ...prev, address: addressStr }));
        setLocationFetched(true);
      }
    } catch (error) {
      Alert.alert("Location Error", "Could not fetch location.");
    } finally {
      setLocationLoading(false);
    }
  };

  const onSubmit = async () => {
    const { name, category, breed, color, age, description, address, image } = petData;

    // Strict Validation
    if (!image) return Alert.alert("Required", "Please upload a pet image");
    if (!name.trim() || !category.trim() || !breed.trim() || !description.trim() || !address.trim()) {
      Alert.alert("Pet", "Please fill all required fields");
      return;
    }
    if (wordCount < 5) return Alert.alert("Description", "Minimum 5 words required.");

    setLoading(true);

    const petPayload = {
      name: name.trim(),
      category,
      breed: breed.trim(),
      coatcolor: color.trim(),
      age: age ? Number(age) : undefined,
      description: description.trim(),
      address: address.trim(),
      ownerId: user?.uid ?? "",
    };

    try {
      let res;
      if (isEditMode && id) {

        res = await updatePet(id as string, petPayload, image);
      } else {
        res = await addPet(petPayload, image);
      }

      if (res.success) {
        if (isEditMode) Alert.alert("Success", "Listing updated!");
        router.back();
      } else {
        Alert.alert("Error", res.msg || "Operation failed");
      }
    } catch (err) {
      Alert.alert("Error", "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <ModalWrapper>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <Header
            title={isEditMode ? "Edit Pet" : "Add Pet"}
            leftIcon={<BackButton />}
            style={{ marginBottom: spacingY._10 }}
          />

          <View style={styles.avatarContainer}>
            <Image
              style={[styles.avatar, !petData.image && { borderColor: colors.red, borderWidth: 2 }]}
              source={getPetImage(petData.image)}
              contentFit="cover"
              transition={100}
            />
            <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.editIcon}>
              <Pencil size={verticalScale(20)} color={colors.background} weight="duotone" />
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Typo color={colors.text}>Name</Typo>
              <Input placeholder="Pet name" value={petData.name} onChangeText={(v) => setPetData({ ...petData, name: v })} />
            </View>

            <View style={styles.inputContainer}>
              <Typo color={colors.text}>Category</Typo>
              <View style={styles.pickerWrapper}>
                <Picker selectedValue={petData.category} onValueChange={(v) => setPetData({ ...petData, category: v })} style={styles.picker}>
                  <Picker.Item label="Dogs" value="Dogs" />
                  <Picker.Item label="Cats" value="Cats" />
                  <Picker.Item label="Birds" value="Birds" />
                  <Picker.Item label="Others" value="Others" />
                </Picker>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Typo color={colors.text}>Breed</Typo>
              <Input placeholder="e.g. Labrador / Persian Cat" value={petData.breed} onChangeText={(v) => setPetData({ ...petData, breed: v })} />
            </View>

            <View style={styles.inputContainer}>
              <Typo color={colors.text}>Color</Typo>
              <Input placeholder="e.g. White / Brown" value={petData.color} onChangeText={(v) => setPetData({ ...petData, color: v })} />
            </View>

            <View style={styles.inputContainer}>
              <Typo color={colors.text}>Age</Typo>
              <Input placeholder="Age in years" keyboardType="numeric" value={petData.age} onChangeText={(v) => setPetData({ ...petData, age: v })} />
            </View>

            <View style={styles.inputContainer}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Typo color={colors.text}>Description</Typo>
                <Typo size={12} color={wordCount < 5 ? colors.red : colors.green}>
                  {wordCount}/5 words
                </Typo>
              </View>
              <Input placeholder="Describe your pet..." value={petData.description} multiline containerStyle={{ minHeight: verticalScale(80), alignItems: 'flex-start', paddingTop: 10 }} onChangeText={(v) => setPetData({ ...petData, description: v })} />
            </View>

            <View style={styles.inputContainer}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typo color={colors.text}>Address</Typo>
                <TouchableOpacity
                  onPress={handleFetchLocation}
                  style={[
                    styles.locationBtn,
                    locationFetched && { backgroundColor: colors.green + '15', borderColor: colors.green, borderWidth: 1 }
                  ]}
                  disabled={locationLoading}
                >
                  {locationLoading ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <>
                      {locationFetched ? (
                        <CheckCircle size={18} color={colors.green} weight="fill" />
                      ) : (
                        <MapPinLine size={18} color={colors.primary} weight="bold" />
                      )}
                      <Typo size={12} color={locationFetched ? colors.green : colors.primary} fontWeight="600">
                        {locationFetched ? (isEditMode ? " Update Location" : " Location Set") : " Get Location"}
                      </Typo>
                    </>
                  )}
                </TouchableOpacity>
              </View>
              <Input placeholder="Address auto-filled" value={petData.address} editable={false} />
            </View>

            <View style={styles.footer}>
              <Button onPress={onSubmit} style={{ flex: 1 }} loading={loading}>
                <Typo color={colors.background} fontWeight={"700"}>{isEditMode ? "Update Pet" : "Save Pet"}</Typo>
              </Button>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <UploadModal modalVisible={modalVisible} onBackPress={() => setModalVisible(false)} onCameraPress={handleCameraPress} onGalleryPress={handleGalleryPress} onRemovePress={handleRemovePress} isLoading={loading} />
    </ModalWrapper>
  );
};

export default PetListModal;

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacingX._20, paddingBottom: spacingY._30 },
  avatarContainer: { position: "relative", alignSelf: "center", marginTop: spacingY._10 },
  form: { gap: spacingY._20, marginTop: spacingY._15 },
  footer: { alignItems: "center", flexDirection: "row", justifyContent: "center", paddingHorizontal: spacingX._20, gap: scale(12), paddingTop: spacingY._15, marginBottom: spacingY._20 },
  avatar: { alignSelf: "center", backgroundColor: colors.backgroundDark, height: verticalScale(135), width: verticalScale(135), borderRadius: 200, borderWidth: 2, borderColor: colors.primary },
  editIcon: { position: "absolute", bottom: spacingY._5, right: spacingY._7, borderRadius: 100, backgroundColor: colors.green, padding: spacingY._7, elevation: 4 },
  inputContainer: { gap: spacingY._10 },
  locationBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary + '15', paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius._10, gap: 4 },
  pickerWrapper: { borderWidth: 1, borderColor: colors.green, borderRadius: radius._17, overflow: "hidden" },
  picker: { backgroundColor: colors.background, color: colors.primary },
});