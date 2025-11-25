import React, { useState, useEffect } from "react";
import { StyleSheet, View, Image, Text, FlatList } from "react-native";
import Typo from "@/components/Typo";
import ScreenWrapper from "@/components/ScreenWrapper";
import Sliders from "@/components/Sliders";
import { useAuth } from "@/contexts/AuthContext";
import { usePets } from "@/contexts/PetContext";
import { colors, spacingX, spacingY } from "@/constants/themes";
import { verticalScale } from "@/utils/styling";
import Category from "@/components/Category";
import CategoryCard from "@/components/CategoryCard";
import Button from "@/components/Button";
import { useRouter } from "expo-router";

const DEFAULT_AVATAR = require("../../assets/Avatar.jpg");

const Home: React.FC = () => {
  const { user } = useAuth();
  const { pets } = usePets();
  const router = useRouter();

  const avatarSource = user?.image ? { uri: user.image } : DEFAULT_AVATAR;

  // Category filter state
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  // Pagination state
  const [visiblePets, setVisiblePets] = useState(pets.slice(0, 10));
  const [page, setPage] = useState(1);

  // Filter pets by category
  const getFilteredPets = () => {
    if (selectedCategory === "All") return pets;
    if (selectedCategory === "Others") {
      return pets.filter(
        (p) =>
          p.category !== "Dogs" &&
          p.category !== "Cats" &&
          p.category !== "Birds"
      );
    }
    return pets.filter((p) => p.category === selectedCategory);
  };

  // Reset visible pets when category changes
  useEffect(() => {
    const filtered = getFilteredPets();
    setVisiblePets(filtered.slice(0, 10));
    setPage(1);
  }, [pets, selectedCategory]);

  // Load more pets when scrolling
  const loadMorePets = () => {
    const filtered = getFilteredPets();
    const nextPets = filtered.slice(page * 10, page * 10 + 10);
    if (nextPets.length > 0) {
      setVisiblePets((prev) => [...prev, ...nextPets]);
      setPage((prev) => prev + 1);
    }
  };

  //  Header + Sliders + Buttons + Category as FlatList header
  const renderHeader = () => (
    <View>
      {/* --- HEADER CONTENT --- */}
      <View style={styles.header}>
        <View style={{ gap: 4 }}>
          <Typo size={16} color={colors.text} fontWeight={"700"}>
            Hey! Pet lover,
          </Typo>
          <Typo size={20} color={colors.textLighter} fontWeight={"700"}>
            {user?.name || "Guest"}
          </Typo>
        </View>

        {/* --- AVATAR RENDERING --- */}
        <View style={styles.avatarContainer}>
          <Image
            source={avatarSource}
            style={styles.avatarImage}
            accessibilityLabel="User profile picture"
          />
        </View>
      </View>

      {/* --- SLIDERS --- */}
      <View style={styles.imageSlider}>
        <Sliders />
      </View>

      {/* --- Add Pet and My Pets buttons --- */}
      <View
        style={{
          flexDirection: "row",
          gap: spacingX._10,
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: spacingX._20,
          marginBottom: spacingY._20,
        }}
      >
        <Button
          style={{ width: "50%" }}
          onPress={() => router.push("/(modals)/PetListModal")}
        >
          <Typo size={14} fontWeight={"700"} color={colors.background}>
            Add Pet
          </Typo>
        </Button>

        <Button style={{ width: "50%" }}>
          <Typo size={14} fontWeight={"700"} color={colors.background}>
            My Pets
          </Typo>
        </Button>
      </View>

      {/* --- CATEGORY FILTER --- */}
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
        renderItem={({ item }) => <CategoryCard pet={item} />}
        onEndReached={loadMorePets}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={renderHeader} //  scrolls with list
        ListFooterComponent={
          <Text style={styles.footer}>
            {visiblePets.length < getFilteredPets().length
              ? "Loading more..."
              : "No more pets"}
          </Text>
        }
      />
    </ScreenWrapper>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacingX._20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacingY._20,
  },
  avatarContainer: {
    width: verticalScale(50),
    height: verticalScale(50),
    borderRadius: verticalScale(25),
    overflow: "hidden",
    backgroundColor: colors.primary,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  imageSlider: {
    paddingVertical: spacingY._20,
  },
  footer: {
    textAlign: "center",
    padding: 10,
    color: colors.textLighter,
  },
});
