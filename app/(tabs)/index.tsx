import Button from "@/components/Button";
import Category from "@/components/Category";
import CategoryCard from "@/components/CategoryCard";
import ScreenWrapper from "@/components/ScreenWrapper";
import Sliders from "@/components/Sliders";
import Typo from "@/components/Typo";
import { colors, spacingX, spacingY } from "@/constants/themes";
import { useAdoption } from "@/contexts/AdoptionContext";
import { useAuth } from "@/contexts/AuthContext";
import { usePets } from "@/contexts/PetContext";
import { verticalScale } from "@/utils/styling";
import * as Haptics from 'expo-haptics'; // * Added Haptics
import { useRouter } from "expo-router";
import { BellSimple } from "phosphor-react-native";
import React, { useEffect, useRef, useState } from "react";
import { FlatList, Image, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const DEFAULT_AVATAR = require("../../assets/Avatar.jpg");

const Home: React.FC = () => {
  const { user } = useAuth();
  const { pets, toggleFavorite } = usePets(); 
  const { applications } = useAdoption(); 
  const router = useRouter();

  // * NAVIGATION LOCK: Prevents multiple modals from opening
  const isNavigating = useRef(false);

  const avatarSource = user?.image ? { uri: user.image } : DEFAULT_AVATAR;

  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [visiblePets, setVisiblePets] = useState<any[]>([]);
  const [page, setPage] = useState(1);

  // * CALCULATE PENDING COUNT
  const pendingCount = applications.filter(
    app => app.ownerId === user?.uid && app.status === 'pending'
  ).length;

  const getFilteredPets = () => {
    const activePets = pets.filter((p: any) => !p.isDeleted && p.status !== 'sold');
    if (selectedCategory === "All") return activePets;
    if (selectedCategory === "Others") {
      return activePets.filter((p: any) => p.category !== "Dogs" && p.category !== "Cats" && p.category !== "Birds");
    }
    return activePets.filter((p: any) => p.category === selectedCategory);
  };

  useEffect(() => {
    const filtered = getFilteredPets();
    setVisiblePets(filtered.slice(0, 10));
    setPage(1);
  }, [pets, selectedCategory]);

  // * THROTTLED NAVIGATION HELPER
  const navigateOnce = (pathname: string, params?: any) => {
    if (isNavigating.current) return;
    isNavigating.current = true;
    
    // Light haptic on button press
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    router.push({ pathname: pathname as any, params });

    setTimeout(() => {
      isNavigating.current = false;
    }, 800);
  };

  const handleFavorite = (id: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    toggleFavorite(id);
  };

  const loadMorePets = () => {
    const filtered = getFilteredPets();
    const nextPets = filtered.slice(page * 10, page * 10 + 10);
    if (nextPets.length > 0) {
      setVisiblePets((prev) => [...prev, ...nextPets]);
      setPage((prev) => prev + 1);
    }
  };

  const renderHeader = () => (
    <View>
      <View style={styles.header}>
        <View style={{ gap: 4 }}>
          <Typo size={16} color={colors.text} fontWeight={"700"}>Hey! Pet lover,</Typo>
          <Typo size={20} color={colors.textLighter} fontWeight={"700"}>{user?.name || "Guest"}</Typo>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity 
            onPress={() => navigateOnce("/(modals)/applicationsModal")}
            style={styles.iconBtn}
          >
            <BellSimple size={28} color={colors.text} weight="duotone" />
            {pendingCount > 0 && (
              <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>
                    {pendingCount > 9 ? '9+' : pendingCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => navigateOnce("/(tabs)/profile")}
            style={styles.avatarContainer}
          >
            <Image source={avatarSource} style={styles.avatarImage} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.imageSlider}>
        <Sliders />
      </View>

      <View style={styles.buttonRow}>
        <Button
          style={{ width: "48%" }}
          onPress={() => navigateOnce("/(modals)/PetListModal")}
        >
          <Typo size={14} fontWeight={"700"} color={colors.background}>Add Pet</Typo>
        </Button>

        <Button 
            style={{ width: "48%" }}
            onPress={() => navigateOnce("/(modals)/myPetsModal")}
        >
          <Typo size={14} fontWeight={"700"} color={colors.background}>My Pets</Typo>
        </Button>
      </View>

      <View style={{ marginBottom: spacingY._5 }}>
        <Category onCategorySelect={setSelectedCategory} />
      </View>
    </View>
  );

  return (
    <ScreenWrapper>
      <FlatList
        data={visiblePets}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => navigateOnce("/(modals)/petDetailsModal", { id: item.id })}
          >
            <CategoryCard
              pet={item}
              isFavorite={item.favoredBy?.includes(user?.uid || "") ?? false}
              onFavoritePress={() => handleFavorite(item.id)}
            />
          </Pressable>
        )}
        onEndReached={loadMorePets}
        onEndReachedThreshold={0.8}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={
          <Text style={styles.footer}>
            {visiblePets.length < getFilteredPets().length ? "Loading more..." : "No more pets"}
          </Text>
        }
        contentContainerStyle={{ paddingBottom: spacingY._20 }}
      />
    </ScreenWrapper>
  );
};

export default Home;

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacingX._20, flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: spacingY._20 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: spacingX._15 },
  iconBtn: { padding: 4, position: 'relative' },
  badgeContainer: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: colors.red,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.background,
    paddingHorizontal: 2
  },
  badgeText: { color: 'white', fontSize: 9, fontWeight: '800', textAlign: 'center' },
  avatarContainer: { width: verticalScale(50), height: verticalScale(50), borderRadius: verticalScale(25), overflow: "hidden", backgroundColor: colors.primary, borderWidth: 1, borderColor: colors.primary },
  avatarImage: { width: "100%", height: "100%", resizeMode: "cover" },
  imageSlider: { paddingVertical: spacingY._20 },
  buttonRow: { flexDirection: "row", gap: spacingX._10, alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacingX._20, marginBottom: spacingY._20 },
  footer: { textAlign: "center", padding: 20, color: colors.textLighter, fontSize: 12 },
});