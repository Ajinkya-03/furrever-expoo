import React, { useRef, useState, useCallback, useMemo, memo } from "react";
import { 
    FlatList, StyleSheet, View, Alert, 
    TouchableOpacity, Text, RefreshControl 
} from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from 'expo-haptics';
import { BellSimple, Plus, PawPrint } from "phosphor-react-native";
import { Image } from "expo-image";

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
import { verticalScale } from "@/utils/styling";

const ListHeader = memo(({ 
    user, 
    pendingCount, 
    selectedCategory, 
    setSelectedCategory, 
    handleProtectedAction, 
    router 
}: any) => (
    <View style={{ backgroundColor: colors.background }}>
        <View style={styles.header}>
            <View style={{ gap: 4 }}>
                <Typo size={16} color={colors.text} fontWeight="700">Hey! Pet lover,</Typo>
                {/* REAL-TIME NAME */}
                <Typo size={22} color={colors.textLighter} fontWeight="800">
                    {user?.name || "Guest"}
                </Typo>
            </View>

            <View style={styles.headerRight}>
                <TouchableOpacity 
                    onPress={() => handleProtectedAction(() => router.push("/(modals)/applicationsModal"))}
                    style={styles.iconBtn}
                >
                    <BellSimple size={28} color={colors.text} weight="duotone" />
                    {pendingCount > 0 && (
                        <View style={styles.badgeContainer}>
                            <Text style={styles.badgeText}>{pendingCount > 9 ? '9+' : pendingCount}</Text>
                        </View>
                    )}
                </TouchableOpacity>

                <TouchableOpacity onPress={() => handleProtectedAction(() => router.push("/(tabs)/profile"))}>
                    <View style={styles.avatarContainer}>
                        <Image 
                            source={user?.image ? { uri: user.image } : require("../../assets/Avatar.jpg")} 
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
                onPress={() => handleProtectedAction(() => router.push("/(modals)/PetListModal"))}
            >
                <View style={[styles.actionIcon, { backgroundColor: colors.primary }]}>
                    <Plus size={18} color="white" weight="bold" />
                </View>
                <Typo size={14} fontWeight="700" color={colors.primaryDark}>Add Pet</Typo>
            </Button>
            
            <Button 
                style={[styles.actionBtn, { backgroundColor: colors.successSoft }]} 
                onPress={() => handleProtectedAction(() => router.push("/(modals)/myPetsModal"))}
            >
                <View style={[styles.actionIcon, { backgroundColor: colors.lightgreen }]}>
                    <PawPrint size={18} color="white" weight="fill" />
                </View>
                <Typo size={14} fontWeight="700" color={colors.textLight}>My Pets</Typo>
            </Button>
        </View>

        <Category selectedCategory={selectedCategory} onCategorySelect={(cat) => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setSelectedCategory(cat);
        }} />
        
        <Typo size={18} fontWeight="800" style={styles.sectionTitle}>
            {selectedCategory === "All" ? "New Buddies" : `${selectedCategory} for you`}
        </Typo>
    </View>
));

const Home = () => {
    const { user } = useAuth();
    const { pets, toggleFavorite } = usePets(); 
    const { applications } = useAdoption();
    const router = useRouter();

    const [selectedCategory, setSelectedCategory] = useState<string>("All");
    const [refreshing, setRefreshing] = useState(false);
    const isActionBusy = useRef(false);

    const filteredPets = useMemo(() => {
        const active = pets.filter(p => !p.isDeleted && p.status !== 'sold');
        if (selectedCategory === "All") return active;
        if (selectedCategory === "Others") {
            const standard = ["Dogs", "Cats", "Birds"];
            return active.filter(p => !standard.includes(p.category));
        }
        return active.filter(p => p.category === selectedCategory);
    }, [pets, selectedCategory]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setTimeout(() => setRefreshing(false), 1000);
    }, []);

    const handleProtectedAction = useCallback((callback: () => void) => {
        if (isActionBusy.current) return;
        isActionBusy.current = true;
        if (!user) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            Alert.alert("Join the Pack! 🐾", "Sign in to interact with buddies.", [
                { text: "Later", style: "cancel", onPress: () => { isActionBusy.current = false; } },
                { text: "Sign In", onPress: () => { isActionBusy.current = false; router.push("/(auth)/login"); }}
            ]);
            return;
        }
        callback();
        setTimeout(() => { isActionBusy.current = false; }, 800);
    }, [user, router]);

    const pendingCount = useMemo(() => applications.filter(
        app => app.ownerId === user?.uid && app.status === 'pending'
    ).length, [applications, user?.uid]);

    return (
        <ScreenWrapper style={{ backgroundColor: colors.background }}>
            <FlatList
                data={filteredPets}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <CategoryCard
                        pet={item}
                        isFavorite={user?.favorites?.includes(item.id) || false}
                        onFavoritePress={() => handleProtectedAction(() => toggleFavorite(item.id))}
                        onCardPress={() => handleProtectedAction(() => 
                            router.push({ pathname: "/(modals)/petDetailsModal", params: { id: item.id } })
                        )}
                    />
                )}
                ListHeaderComponent={
                    <ListHeader 
                        user={user}
                        pendingCount={pendingCount}
                        selectedCategory={selectedCategory}
                        setSelectedCategory={setSelectedCategory}
                        handleProtectedAction={handleProtectedAction}
                        router={router}
                    />
                }
                ListFooterComponent={() => (
                    <View style={styles.footerContainer}>
                        <Typo color={colors.textLighter} size={14} fontWeight="600">
                            {filteredPets.length > 0 ? "That's all the buddies for now! 🐾" : "No buddies found in this category."}
                        </Typo>
                    </View>
                )}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />}
                removeClippedSubviews={true} initialNumToRender={6} maxToRenderPerBatch={5} windowSize={10} contentContainerStyle={{ paddingBottom: 50 }} showsVerticalScrollIndicator={false}
            />
        </ScreenWrapper>
    );
};

export default Home;

const styles = StyleSheet.create({
    header: { paddingHorizontal: spacingX._20, flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: spacingY._20 },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: spacingX._15 },
    iconBtn: { padding: 4, position: 'relative' },
    badgeContainer: { position: 'absolute', top: -2, right: -2, backgroundColor: colors.red, minWidth: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: colors.background, paddingHorizontal: 2 },
    badgeText: { color: 'white', fontSize: 9, fontWeight: '800' },
    avatarContainer: { width: verticalScale(50), height: verticalScale(50), borderRadius: radius._40, overflow: "hidden", borderWidth: 1, borderColor: colors.backgroundDark },
    avatarImage: { width: "100%", height: "100%" },
    buttonRow: { flexDirection: "row", gap: 15, paddingHorizontal: spacingX._20, marginVertical: spacingY._17 },
    actionBtn: { flex: 1, flexDirection: 'row', gap: spacingX._10, borderWidth: 1, borderColor: colors.backgroundDark, justifyContent: "flex-start", alignItems: "center", height: verticalScale(55), borderRadius: radius._15 },
    actionIcon: { width: 32, height: 32, borderRadius: radius._10, justifyContent: "center", alignItems: "center", marginLeft: 10 },
    sectionTitle: { marginLeft: spacingX._20, marginTop: 20, marginBottom: 10 },
    footerContainer: { paddingVertical: 40, alignItems: 'center', justifyContent: 'center' }
});