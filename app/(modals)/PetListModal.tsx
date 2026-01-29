import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { 
  ActivityIndicator, Alert, ScrollView, StyleSheet, 
  TouchableOpacity, View, KeyboardAvoidingView, Platform, 
  InteractionManager, Keyboard 
} from "react-native";
import { useLocalSearchParams, useRouter, useSegments } from "expo-router";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from 'expo-image-manipulator';
import * as Location from "expo-location";
import { Picker } from "@react-native-picker/picker";
import { CheckCircle, MapPinLine, Pencil } from "phosphor-react-native";

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
import UploadModal from "./UploadModal";

const PetListModal = () => {
  const petContext = usePets();
  const { addPet, updatePet, pets } = petContext;
  const { user } = useAuth();
  const router = useRouter();
  const segments = useSegments(); 
  const { id, mode } = useLocalSearchParams();
  
  const isEditMode = mode === 'edit';
  
  // --- CRASH PREVENTION REFS ---
  const isMounted = useRef(true);
  const isSubmitting = useRef(false);
  const navigationLock = useRef(false);

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
  const [isReady, setIsReady] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [locationFetched, setLocationFetched] = useState(false);

  // --- STABLE HANDLERS (CRASH FIX) ---
  // Memoize these so typing doesn't trigger deep re-renders of the form
  const handleNameChange = useCallback((v: string) => setPetData(p => ({ ...p, name: v })), []);
  const handleCategoryChange = useCallback((v: string) => setPetData(p => ({ ...p, category: v })), []);
  const handleBreedChange = useCallback((v: string) => setPetData(p => ({ ...p, breed: v })), []);
  const handleColorChange = useCallback((v: string) => setPetData(p => ({ ...p, color: v })), []);
  const handleAgeChange = useCallback((v: string) => setPetData(p => ({ ...p, age: v })), []);
  const handleDescriptionChange = useCallback((v: string) => setPetData(p => ({ ...p, description: v })), []);

  // --- LIFECYCLE ---
  useEffect(() => {
    isMounted.current = true;
    
    // Interaction Guard
    const task = InteractionManager.runAfterInteractions(async () => {
      if (!isMounted.current) return;

      if (isEditMode && id) {
        const summary = pets.find((p: any) => p.id === id);
        let details: any = undefined;
        if (typeof (petContext as any).getPetDetails === 'function') {
          try {
            details = await (petContext as any).getPetDetails(id as string);
          } catch { details = undefined; }
        }
        
        if (summary && isMounted.current) {
          setPetData({
            name: summary.name,
            category: summary.category,
            breed: summary.breed,
            color: details?.coatcolor || "",
            age: details?.age?.toString() || "",
            description: details?.description || "",
            address: details?.address || "",
            image: summary.image,
          });
          setLocationFetched(!!details?.address);
        }
      }
      setIsReady(true);
    });

    return () => { 
        isMounted.current = false; 
        task.cancel();
    };
  }, [id, mode, isEditMode, petContext]);

  const wordCount = useMemo(() => {
    if (!petData.description) return 0;
    const trimmed = petData.description.trim();
    return trimmed.length > 0 ? trimmed.split(/\s+/).length : 0;
  }, [petData.description]);

  // --- ACTIONS ---
  const processImage = useCallback(async (uri: string) => {
    try {
      return await ImageManipulator.manipulateAsync(
        uri, [{ resize: { width: 800 } }], 
        { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG }
      );
    } catch { return { uri }; }
  }, []);

  const handleCameraPress = useCallback(async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.8 });
      if (!result.canceled && isMounted.current) {
        setLoading(true);
        const processed = await processImage(result.assets[0].uri);
        if (isMounted.current) {
          setPetData(p => ({ ...p, image: processed }));
          setLoading(false);
        }
      }
    } finally { if (isMounted.current) setModalVisible(false); }
  }, [processImage]);

  const handleGalleryPress = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.8 });
      if (!result.canceled && isMounted.current) {
        setLoading(true);
        const processed = await processImage(result.assets[0].uri);
        if (isMounted.current) {
          setPetData(p => ({ ...p, image: processed }));
          setLoading(false);
        }
      }
    } finally { if (isMounted.current) setModalVisible(false); }
  }, [processImage]);

  const handleRemovePress = useCallback(() => setPetData(p => ({ ...p, image: null })), []);

  const handleFetchLocation = useCallback(async () => {
    if (locationLoading || !isMounted.current) return;
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { Alert.alert("Denied", "Location access required."); return; }
      
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const reverse = await Location.reverseGeocodeAsync({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      
      if (reverse.length > 0 && isMounted.current) {
        const item = reverse[0];
        const addr = `${item.name || ''}, ${item.street || ''}, ${item.city}, ${item.region}`.replace(/^, /, "").replace(/, , /g, ", ");
        setPetData(p => ({ ...p, address: addr }));
        setLocationFetched(true);
      }
    } catch { Alert.alert("Error", "Could not fetch location."); } 
    finally { if (isMounted.current) setLocationLoading(false); }
  }, [locationLoading]);

  const onSubmit = useCallback(async () => {
    if (isSubmitting.current || navigationLock.current || !isMounted.current) return;
    
    const { name, category, breed, description, address, image, color, age } = petData;
    
    if (!image) return Alert.alert("Required", "Please upload a pet image");
    if (!name.trim() || !category.trim() || !breed.trim() || !description.trim() || !address.trim()) {
        return Alert.alert("Required", "Please fill all required fields");
    }
    if (wordCount < 5) return Alert.alert("Description", "Minimum 5 words required.");

    try {
        isSubmitting.current = true;
        setLoading(true);
        Keyboard.dismiss();

        const petPayload = {
            name: name.trim(), category, breed: breed.trim(),
            coatcolor: color.trim(), age: age ? Number(age) : undefined,
            description: description.trim(), address: address.trim(),
            ownerId: user?.uid ?? "",
        };

        const res = (isEditMode && id) 
            ? await updatePet(id as string, petPayload, image) 
            : await addPet(petPayload, image);

        if (res.success) {
            navigationLock.current = true;
            InteractionManager.runAfterInteractions(() => {
                if (isMounted.current && router.canGoBack()) router.back();
            });
        } else {
            if (isMounted.current) Alert.alert("Error", res.msg || "Operation failed");
        }
    } catch (err) {
        if (isMounted.current) Alert.alert("Error", "An unexpected error occurred.");
    } finally {
        if (isMounted.current) {
            setLoading(false);
            isSubmitting.current = false;
        }
    }
  }, [petData, isEditMode, id, user, addPet, updatePet, router, wordCount]);

  if (!isReady) return <ModalWrapper style={styles.centered}><ActivityIndicator color={colors.primary} /></ModalWrapper>;

  return (
    <ModalWrapper>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Header title={isEditMode ? "Edit Pet" : "Add Pet"} leftIcon={<BackButton />} style={{ marginBottom: spacingY._10 }} />

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
              <Input placeholder="Pet name" value={petData.name} onChangeText={handleNameChange} />
            </View>

            <View style={styles.inputContainer}>
              <Typo color={colors.text}>Category</Typo>
              <View style={styles.pickerWrapper}>
                <Picker selectedValue={petData.category} onValueChange={handleCategoryChange} style={styles.picker}>
                  <Picker.Item label="Dogs" value="Dogs" /><Picker.Item label="Cats" value="Cats" />
                  <Picker.Item label="Birds" value="Birds" /><Picker.Item label="Others" value="Others" />
                </Picker>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Typo color={colors.text}>Breed</Typo>
              <Input placeholder="e.g. Labrador" value={petData.breed} onChangeText={handleBreedChange} />
            </View>

            <View style={styles.inputContainer}>
              <Typo color={colors.text}>Color</Typo>
              <Input placeholder="e.g. White" value={petData.color} onChangeText={handleColorChange} />
            </View>

            <View style={styles.inputContainer}>
              <Typo color={colors.text}>Age</Typo>
              <Input placeholder="Years" keyboardType="numeric" value={petData.age} onChangeText={handleAgeChange} />
            </View>

            <View style={styles.inputContainer}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Typo color={colors.text}>Description</Typo>
                <Typo size={12} color={wordCount < 5 ? colors.red : colors.green}>{wordCount}/5 words</Typo>
              </View>
              <Input placeholder="Describe your pet..." value={petData.description} multiline containerStyle={styles.textArea} onChangeText={handleDescriptionChange} />
            </View>

            <View style={styles.inputContainer}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typo color={colors.text}>Address</Typo>
                <TouchableOpacity onPress={handleFetchLocation} style={[styles.locationBtn, locationFetched && styles.locationBtnActive]} disabled={locationLoading}>
                  {locationLoading ? <ActivityIndicator size="small" color={colors.primary} /> : (
                    <>
                        {locationFetched ? <CheckCircle size={18} color={colors.green} weight="fill" /> : <MapPinLine size={18} color={colors.primary} weight="bold" />}
                        <Typo size={12} color={locationFetched ? colors.green : colors.primary} fontWeight="600">{locationFetched ? " Location Set" : " Get Location"}</Typo>
                    </>
                  )}
                </TouchableOpacity>
              </View>
              <Input placeholder="Address auto-filled" value={petData.address} editable={false} />
            </View>

            <View style={styles.footer}>
              <Button onPress={onSubmit} style={{ flex: 1 }} loading={loading} disabled={loading || isSubmitting.current}>
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
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  avatarContainer: { position: "relative", alignSelf: "center", marginTop: spacingY._10 },
  form: { gap: spacingY._20, marginTop: spacingY._15 },
  footer: { alignItems: "center", flexDirection: "row", justifyContent: "center", paddingHorizontal: spacingX._20, gap: scale(12), paddingTop: spacingY._15, marginBottom: spacingY._20 },
  avatar: { alignSelf: "center", backgroundColor: colors.backgroundDark, height: verticalScale(135), width: verticalScale(135), borderRadius: 200, borderWidth: 2, borderColor: colors.primary },
  editIcon: { position: "absolute", bottom: spacingY._5, right: spacingY._7, borderRadius: 100, backgroundColor: colors.green, padding: spacingY._7, elevation: 4 },
  inputContainer: { gap: spacingY._10 },
  locationBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary + '15', paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius._10, gap: 4 },
  locationBtnActive: { backgroundColor: colors.green + '15', borderColor: colors.green, borderWidth: 1 },
  pickerWrapper: { borderWidth: 1, borderColor: colors.green, borderRadius: radius._17, overflow: "hidden" },
  picker: { backgroundColor: colors.background, color: colors.primary },
  textArea: { minHeight: verticalScale(80), alignItems: 'flex-start', paddingTop: 10 }
});