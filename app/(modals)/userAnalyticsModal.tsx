import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { 
    View, StyleSheet, ScrollView, ActivityIndicator, 
    Alert, TouchableOpacity 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, onSnapshot, collection, getDocs, query, where } from 'firebase/firestore';
import { firestore } from '@/config/firebase';
import * as Haptics from 'expo-haptics';

import ScreenWrapper from '@/components/ScreenWrapper';
import Typo from '@/components/Typo';
import BackButton from '@/components/BackButton';
import CategoryCard from '@/components/CategoryCard';
import Header from '@/components/Header';
import { colors, radius, spacingX, spacingY } from '@/constants/themes';
import { Image } from 'expo-image';
import { 
    Envelope, ShieldCheck, PawPrint, 
    Clock, Storefront, IdentificationCard, 
    WarningCircle
} from 'phosphor-react-native';

import { UserType, PetType } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { usePets } from '@/contexts/PetContext';
import { verticalScale, scale } from '@/utils/styling';

const UserAnalyticsModal = () => {
    const { userId: paramUserId } = useLocalSearchParams();
    const { user: currentUser } = useAuth();
    const { pets, toggleFavorite } = usePets();
    const router = useRouter();
    
    const targetUserId = (paramUserId as string) || currentUser?.uid;
    const isActionBusy = useRef(false);

    const [data, setData] = useState<UserType>(null);
    const [statAdoptions, setStatAdoptions] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    // --- Single Tap Guard ---
    const handleThrottledPress = useCallback((action: () => void) => {
        if (isActionBusy.current) return;
        isActionBusy.current = true;
        action();
        setTimeout(() => { isActionBusy.current = false; }, 800);
    }, []);

    // --- Real-time Stats Filtering ---
    const userPets = useMemo(() => {
        return pets.filter(pet => 
            pet.ownerId === targetUserId && !pet.isDeleted
        );
    }, [pets, targetUserId]);

    const activeListingsCount = useMemo(() => {
        return userPets.filter(p => p.status === 'available').length;
    }, [userPets]);

    const memberSince = useMemo(() => {
        const rawDate = data?.createdAt;
        if (!rawDate) return '...';
        const date = rawDate?.toDate ? rawDate.toDate() : new Date(rawDate);
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }, [data?.createdAt]);

    // --- Real-time User Listener & Stats Fetch ---
    useEffect(() => {
        if (!targetUserId) return;

        setLoading(true);
        // 1. Real-time User Data
        const userRef = doc(firestore, "users", targetUserId);
        const unsubUser = onSnapshot(userRef, (docSnap) => {
            if (docSnap.exists()) {
                setData(docSnap.data() as UserType);
                setError(false);
            } else {
                setError(true);
            }
            setLoading(false);
        }, (err) => {
            console.error("Profile Listener Error:", err);
            setError(true);
            setLoading(false);
        });

        // 2. Fetch Adoptions (One-time is fine for history stats)
        const fetchAdoptions = async () => {
            try {
                const adoptQuery = query(
                    collection(firestore, "adoptions"), 
                    where("adopterId", "==", targetUserId), 
                    where("status", "==", "approved")
                );
                const adoptSnap = await getDocs(adoptQuery);
                setStatAdoptions(adoptSnap.size);
            } catch (e) {
                console.error("Adoption fetch error", e);
            }
        };

        fetchAdoptions();
        return () => unsubUser();
    }, [targetUserId]);

    if (loading) {
        return (
            <ScreenWrapper style={styles.centered}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Typo style={{marginTop: 15}} color={colors.textLight}>Generating Insights...</Typo>
            </ScreenWrapper>
        );
    }

    if (error) {
        return (
            <ScreenWrapper style={styles.centered}>
                <WarningCircle size={48} color={colors.red} weight="duotone" />
                <Typo style={{marginTop: 10}}>Unable to load this profile</Typo>
                <TouchableOpacity onPress={() => router.back()} style={styles.errorBtn}>
                    <Typo color="white" fontWeight="700">Go Back</Typo>
                </TouchableOpacity>
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper style={styles.container}>
            <View style={styles.headerNav}>
                <Header title="Member Insights" leftIcon={<BackButton />} />
            </View>

            <ScrollView 
                showsVerticalScrollIndicator={false} 
                contentContainerStyle={styles.scrollContent}
                removeClippedSubviews={true}
            >
                {/* Profile Section */}
                <View style={styles.profileBox}>
                    <View style={styles.avatarContainer}>
                        <Image 
                            source={data?.image ? { uri: data.image } : require('../../assets/Avatar.jpg')} 
                            style={styles.avatar}
                            cachePolicy="memory-disk"
                        />
                        <View style={styles.statusDot} />
                    </View>
                    
                    <Typo size={26} fontWeight="800" style={{ marginTop: 12 }}>{data?.name || "User"}</Typo>
                    
                    <View style={[styles.badge, { backgroundColor: data?.role === 'seller' ? colors.primary + '15' : colors.green + '15' }]}>
                        <ShieldCheck size={14} color={data?.role === 'seller' ? colors.primary : colors.green} weight="fill" />
                        <Typo size={11} color={data?.role === 'seller' ? colors.primary : colors.green} fontWeight="800">
                            VERIFIED {data?.role?.toUpperCase() || 'MEMBER'}
                        </Typo>
                    </View>

                    {/* Horizontal Account Info Row */}
                    <View style={styles.accountInfoRow}>
                        <View style={styles.infoPill}>
                            <Envelope size={14} color={colors.textLighter} />
                            <Typo size={13} color={colors.textLighter}>{data?.email || "Private"}</Typo>
                        </View>
                        <View style={styles.dividerDot} />
                        <View style={styles.infoPill}>
                            <Clock size={14} color={colors.textLighter} />
                            <Typo size={13} color={colors.textLighter}>Joined {memberSince}</Typo>
                        </View>
                    </View>
                </View>

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    <View style={styles.statCard}>
                        <View style={[styles.statIconCircle, { backgroundColor: colors.primary + '10' }]}>
                            <PawPrint size={24} color={colors.primary} weight="duotone" />
                        </View>
                        <Typo size={22} fontWeight="800">{statAdoptions}</Typo>
                        <Typo size={12} color={colors.textLighter}>Adoptions</Typo>
                    </View>
                    
                    <View style={styles.statCard}>
                        <View style={[styles.statIconCircle, { backgroundColor: colors.green + '10' }]}>
                            <Storefront size={24} color={colors.green} weight="duotone" />
                        </View>
                        <Typo size={22} fontWeight="800">{activeListingsCount}</Typo>
                        <Typo size={12} color={colors.textLighter}>Active Pets</Typo>
                    </View>
                </View>

                {/* Listings Section */}
                <View style={styles.listingsWrapper}>
                    <View style={styles.sectionHeader}>
                        <IdentificationCard size={22} color={colors.text} weight="duotone" />
                        <Typo size={18} fontWeight="800">Published Listings</Typo>
                    </View>
                    
                    {userPets.length > 0 ? (
                        userPets.map((item) => (
                            <CategoryCard 
                                key={item.id}
                                pet={item}
                                isFavorite={currentUser?.favorites?.includes(item.id) || false}
                                onFavoritePress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                    toggleFavorite(item.id);
                                }}
                                onCardPress={() => handleThrottledPress(() => {
                                    router.push({
                                        pathname: "/(modals)/petDetailsModal",
                                        params: { id: item.id }
                                    });
                                })}
                            />
                        ))
                    ) : (
                        <View style={styles.emptyState}>
                            <PawPrint size={40} color={colors.backgroundDark} weight="duotone" />
                            <Typo color={colors.textLighter} style={{marginTop: 10}}>No public listings found.</Typo>
                        </View>
                    )}
                </View>
            </ScrollView>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
    headerNav: { paddingHorizontal: spacingX._15, paddingBottom: 5 },
    scrollContent: { paddingBottom: 40 },
    profileBox: { alignItems: 'center', marginTop: 20, marginBottom: 25 },
    avatarContainer: { position: 'relative' },
    avatar: { 
        width: 110, 
        height: 110, 
        borderRadius: 55, 
        borderWidth: 3, 
        borderColor: 'white',
        backgroundColor: colors.backgroundDark 
    },
    statusDot: { 
        position: 'absolute', 
        bottom: 5, 
        right: 5, 
        width: 18, 
        height: 18, 
        borderRadius: 9, 
        backgroundColor: colors.green, 
        borderWidth: 3, 
        borderColor: 'white' 
    },
    badge: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 6, 
        paddingHorizontal: 14, 
        paddingVertical: 6, 
        borderRadius: radius._12, 
        marginTop: 12 
    },
    accountInfoRow: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        marginTop: 18, 
        backgroundColor: colors.white,
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: radius._15,
        borderWidth: 1,
        borderColor: colors.backgroundDark
    },
    infoPill: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    dividerDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.backgroundDark, marginHorizontal: 12 },
    statsGrid: { 
        flexDirection: 'row', 
        gap: 15, 
        paddingHorizontal: spacingX._20, 
        marginBottom: 30 
    },
    statCard: { 
        flex: 1, 
        backgroundColor: colors.white, 
        padding: 20, 
        borderRadius: radius._20, 
        alignItems: 'center', 
        borderWidth: 1, 
        borderColor: colors.backgroundDark,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 15,
        elevation: 2
    },
    statIconCircle: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    listingsWrapper: { paddingHorizontal: 5 },
    sectionHeader: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 10, 
        marginBottom: 15, 
        paddingHorizontal: spacingX._20 
    },
    emptyState: { padding: 50, alignItems: 'center', justifyContent: 'center' },
    errorBtn: { backgroundColor: colors.primary, paddingHorizontal: 25, paddingVertical: 12, borderRadius: radius._15, marginTop: 20 }
});

export default UserAnalyticsModal;