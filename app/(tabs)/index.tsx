import React, {
  useRef,
  useState,
  useCallback,
  useMemo,
  memo,
  useEffect,
} from "react";
import {
  FlatList,
  StyleSheet,
  View,
  Alert,
  TouchableOpacity,
  Text,
  RefreshControl,
  Animated,
} from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { BellSimple, Plus, PawPrint } from "phosphor-react-native";
import { Image } from "expo-image";
import {
  writeBatch,
  doc,
} from "firebase/firestore";

import ScreenWrapper from "@/components/ScreenWrapper";
import Typo from "@/components/Typo";
import Sliders from "@/components/Sliders";
import Category from "@/components/Category";
import CategoryCard from "@/components/CategoryCard";
import Button from "@/components/Button";

import { colors, spacingX, spacingY, radius } from "@/constants/themes";
import { useAuth } from "@/contexts/AuthContext";
import { usePets } from "@/contexts/PetContext";
import { useAdoption } from "@/contexts/AdoptionContext";
import { firestore } from "@/config/firebase";
import { verticalScale } from "@/utils/styling";


const NotificationBadge = memo(({ count }: { count: number }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (count > 0) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 4,
        useNativeDriver: true,
      }).start();
    } else {
      scaleAnim.setValue(0);
    }
  }, [count]);

  if (count <= 0) return null;

  return (
    <Animated.View
      style={[
        styles.badgeContainer,
        { transform: [{ scale: scaleAnim }] },
      ]}
    >
      <Text style={styles.badgeText}>{count > 9 ? "9+" : count}</Text>
    </Animated.View>
  );
});

/* -------------------------------------------------------------------------- */
/* HEADER */
/* -------------------------------------------------------------------------- */

const ListHeader = memo(
  ({
    user,
    notificationCount,
    selectedCategory,
    setSelectedCategory,
    onBellPress,
    onProtectedNav,
  }: any) => (
    <View style={{ backgroundColor: colors.background }}>
      <View style={styles.header}>
        <View style={{ gap: 4 }}>
          <Typo size={16} fontWeight="700">
            Hey! Pet lover,
          </Typo>
          <Typo size={22} fontWeight="800" color={colors.textLighter}>
            {user?.name || "Guest"}
          </Typo>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={onBellPress}
            style={styles.iconBtn}
            activeOpacity={0.7}
          >
            <BellSimple size={28} color={colors.text} weight="duotone" />
            <NotificationBadge count={notificationCount} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => onProtectedNav("/(tabs)/profile")}
          >
            <View style={styles.avatarContainer}>
              <Image
                source={
                  user?.image
                    ? { uri: user.image }
                    : require("../../assets/Avatar.jpg")
                }
                style={styles.avatarImage}
                cachePolicy="memory-disk"
              />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <Sliders />

      <View style={styles.buttonRow}>
        <Button
          style={[styles.actionBtn, { backgroundColor: colors.primarySoft }]}
          onPress={() => onProtectedNav("/(modals)/PetListModal")}
        >
          <View style={[styles.actionIcon, { backgroundColor: colors.primary }]}>
            <Plus size={18} color="white" weight="bold" />
          </View>
          <Typo size={14} fontWeight="700" color={colors.primaryDark}>
            Add Pet
          </Typo>
        </Button>

        <Button
          style={[styles.actionBtn, { backgroundColor: colors.successSoft }]}
          onPress={() => onProtectedNav("/(modals)/myPetsModal")}
        >
          <View
            style={[
              styles.actionIcon,
              { backgroundColor: colors.lightgreen },
            ]}
          >
            <PawPrint size={18} color="white" weight="fill" />
          </View>
          <Typo size={14} fontWeight="700" color={colors.textLight}>
            My Pets
          </Typo>
        </Button>
      </View>

      <Category
        selectedCategory={selectedCategory}
        onCategorySelect={cat => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setSelectedCategory(cat);
        }}
      />

      <Typo size={18} fontWeight="800" style={styles.sectionTitle}>
        {selectedCategory === "All"
          ? "New Buddies"
          : `${selectedCategory} for you`}
      </Typo>
    </View>
  )
);

/* -------------------------------------------------------------------------- */
/* HOME */
/* -------------------------------------------------------------------------- */

const Home = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { pets, toggleFavorite } = usePets();
  const { applications } = useAdoption();

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [refreshing, setRefreshing] = useState(false);
  const actionLock = useRef(false);

  /* ---------------- BELL COUNT ---------------- */

  const notificationCount = useMemo(() => {
    if (!user?.uid) return 0;

    return applications.filter(
      app =>
        app.ownerId === user.uid &&
        app.status === "pending" &&
        app.isRead === false
    ).length;
  }, [applications, user?.uid]);

  /* ---------------- MARK AS READ ---------------- */

  const markApplicationsAsRead = useCallback(async () => {
    if (!user?.uid) return;

    const unread = applications.filter(
      app => app.ownerId === user.uid && app.isRead === false
    );

    if (unread.length === 0) return;

    try {
      const batch = writeBatch(firestore);
      unread.forEach(app => {
        batch.update(doc(firestore, "adoptions", app.id), {
          isRead: true,
        });
      });
      await batch.commit();
    } catch (e) {
      console.error("Mark read failed", e);
    }
  }, [applications, user?.uid]);

  /* ---------------- FILTER PETS ---------------- */

  const filteredPets = useMemo(() => {
    const active = pets.filter(
      p => !p.isDeleted && p.status !== "sold"
    );

    if (selectedCategory === "All") return active;
    if (selectedCategory === "Others") {
      return active.filter(
        p => !["Dogs", "Cats", "Birds"].includes(p.category)
      );
    }
    return active.filter(p => p.category === selectedCategory);
  }, [pets, selectedCategory]);

  /* ---------------- PROTECTED ACTION ---------------- */

  const handleProtectedAction = useCallback(
    (cb: () => void) => {
      if (actionLock.current) return;
      actionLock.current = true;

      if (!user) {
        Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Warning
        );
        Alert.alert("Join the Pack 🐾", "Sign in to continue.", [
          { text: "Later", style: "cancel" },
          {
            text: "Sign In",
            onPress: () => router.push("/(auth)/login"),
          },
        ]);
        actionLock.current = false;
        return;
      }

      cb();
      setTimeout(() => (actionLock.current = false), 600);
    },
    [user]
  );

  return (
    <ScreenWrapper style={{ backgroundColor: colors.background }}>
      <FlatList
        data={filteredPets}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <CategoryCard
            pet={item}
            isFavorite={item.favoredBy.includes(user?.uid || "")}
            onFavoritePress={() =>
              handleProtectedAction(() => toggleFavorite(item.id))
            }
            onCardPress={() =>
              handleProtectedAction(() =>
                router.push({
                  pathname: "/(modals)/petDetailsModal",
                  params: { id: item.id },
                })
              )
            }
          />
        )}
        ListHeaderComponent={
          <ListHeader
            user={user}
            notificationCount={notificationCount}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            onProtectedNav={(path: string) =>
              handleProtectedAction(() => router.push(path as any))
            }
            onBellPress={() =>
              handleProtectedAction(async () => {
                await markApplicationsAsRead();
                router.push("/(modals)/applicationsModal");
              })
            }
          />
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              setTimeout(() => setRefreshing(false), 700);
            }}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      />
    </ScreenWrapper>
  );
};

export default Home;

/* -------------------------------------------------------------------------- */
/* STYLES */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacingX._20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacingY._20,
  },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 15 },
  iconBtn: { padding: 4, position: "relative" },
  badgeContainer: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: colors.red,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.background,
  },
  badgeText: { color: "white", fontSize: 9, fontWeight: "800" },
  avatarContainer: {
    width: verticalScale(50),
    height: verticalScale(50),
    borderRadius: radius._40,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.backgroundDark,
  },
  avatarImage: { width: "100%", height: "100%" },
  buttonRow: {
    flexDirection: "row",
    gap: 15,
    paddingHorizontal: spacingX._20,
    marginVertical: spacingY._17,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    gap: spacingX._10,
    borderWidth: 1,
    borderColor: colors.backgroundDark,
    alignItems: "center",
    height: verticalScale(55),
    borderRadius: radius._15,
  },
  actionIcon: {
    width: 32,
    height: 32,
    borderRadius: radius._10,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  sectionTitle: {
    marginLeft: spacingX._20,
    marginTop: 20,
    marginBottom: 10,
  },
});
