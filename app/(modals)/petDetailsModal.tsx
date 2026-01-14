import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { 
    Alert, ScrollView, StyleSheet, Text, 
    TouchableOpacity, View, Linking, Platform, ActivityIndicator 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics'; 
import {
    ArrowClockwise, Calendar, ChatCircleDots,
    CheckCircle, Envelope, Info, MapPin,
    Palette, PawPrint, SealCheck, Trash, XCircle,
    Handshake, CaretRight
} from 'phosphor-react-native';

import BackButton from '@/components/BackButton';
import Button from '@/components/Button';
import Header from '@/components/Header';
import ScreenWrapper from '@/components/ScreenWrapper';
import Typo from '@/components/Typo';
import { firestore } from '@/config/firebase';
import { colors, radius, spacingX, spacingY } from '@/constants/themes';
import { useAdoption } from '@/contexts/AdoptionContext';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/contexts/chatContext';
import { usePets } from '@/contexts/PetContext';
import { getPetImage } from '@/services/imageService';
import { PetType } from '@/types';
import { getTimeElapsed } from '@/utils/date';
import { verticalScale, scale } from '@/utils/styling';

const InfoCard = React.memo(({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | number }) => (
    <View style={styles.gridItem}>
        {icon}
        <Text numberOfLines={1} style={styles.gridValue}>{value}</Text>
        <Typo size={11} color={colors.textLighter}>{label}</Typo>
    </View>
));

const PetDetailsModal = () => {
    const { id } = useLocalSearchParams();
    const { pets } = usePets();
    const { sendApplication, cancelApplication, loading: adoptionLoading, applications } = useAdoption();
    const { getOrCreateChatRoom } = useChat();
    const { user: currentUser } = useAuth();
    const router = useRouter();

    const isBusy = useRef(false);

    const pet = useMemo(() => pets.find((p) => p.id === id) as PetType | undefined, [pets, id]);
    const [ownerData, setOwnerData] = useState<any>(null);
    const [adopterData, setAdopterData] = useState<any>(null);
    const [ownerLoading, setOwnerLoading] = useState(true);

    const isSold = pet?.status === 'sold';
    const isOwner = pet?.ownerId === currentUser?.uid;

    const userApplication = useMemo(() => 
        applications.find(app => app.petId === pet?.id && app.adopterId === currentUser?.uid)
    , [applications, pet?.id, currentUser?.uid]);

    const hasApplied = !!userApplication;
    const applicationStatus = userApplication?.status;

    useEffect(() => {
        // PERMISSION GUARD: Don't fetch if not logged in or no pet data
        if (!currentUser || !pet?.ownerId) {
            setOwnerLoading(false);
            return;
        }

        const fetchData = async () => {
            try {
                setOwnerLoading(true);
                // 1. Fetch Owner Data
                const ownerSnap = await getDoc(doc(firestore, "users", pet.ownerId));
                if (ownerSnap.exists()) setOwnerData(ownerSnap.data());

                // 2. Fetch Adopter Data (Seller only, if pet is sold)
                if (isSold && isOwner && pet?.adoptedBy) {
                    const adopterSnap = await getDoc(doc(firestore, "users", pet.adoptedBy));
                    if (adopterSnap.exists()) setAdopterData(adopterSnap.data());
                }
            } catch (err) {
                console.error("[Fetch Error]:", err);
            } finally {
                setOwnerLoading(false);
            }
        };

        fetchData();
    }, [pet?.ownerId, isSold, isOwner, pet?.adoptedBy, currentUser?.uid]); // Added currentUser.uid to trigger on login

    const handleOwnerProfilePress = useCallback(() => {
        if (isBusy.current || !pet?.ownerId) return;
        isBusy.current = true;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (isOwner) router.push("/(tabs)/profile");
        else router.push({ pathname: "/(modals)/userAnalyticsModal", params: { userId: pet.ownerId } });
        setTimeout(() => { isBusy.current = false; }, 800);
    }, [pet?.ownerId, isOwner]);

    const handleAdopt = useCallback(async () => {
        if (isBusy.current || !pet) return;
        if (!currentUser) {
            Alert.alert("Join the Pack! 🐾", "Please login to send an adoption request.", [
                { text: "Later", style: "cancel" },
                { text: "Sign In", onPress: () => router.push("/(auth)/login") }
            ]);
            return;
        }
        isBusy.current = true;
        const res = await sendApplication(pet);
        if (res.success) Alert.alert("Success", "Request sent!");
        else Alert.alert("Notice", res.msg);
        setTimeout(() => { isBusy.current = false; }, 1000);
    }, [currentUser, pet, sendApplication]);

    const adoptButtonSection = useMemo(() => {
        // --- IMPROVED SELLER UI FOR ADOPTER ---
        if (isOwner && isSold) {
            return (
                <TouchableOpacity 
                    activeOpacity={0.8}
                    style={styles.adopterInfoCard}
                    onPress={() => router.push({ pathname: "/(modals)/userAnalyticsModal", params: { userId: pet.adoptedBy }})}
                >
                    <View style={styles.adopterAvatarWrapper}>
                        <Image 
                            source={adopterData?.image ? { uri: adopterData.image } : require('../../assets/Avatar.jpg')} 
                            style={styles.adopterAvatar} 
                        />
                        <View style={styles.checkBadge}>
                            <CheckCircle size={12} color="white" weight="fill" />
                        </View>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Typo size={12} color={colors.textLight} fontWeight="600">Adopted By</Typo>
                        <Typo size={16} fontWeight="800" color={colors.text}>{adopterData?.name || 'Loading...'}</Typo>
                    </View>
                    <View style={styles.viewProfilePill}>
                        <Typo size={12} color={colors.primary} fontWeight="700">Profile</Typo>
                        <CaretRight size={14} color={colors.primary} weight="bold" />
                    </View>
                </TouchableOpacity>
            );
        }

        if (isOwner) return (
            <View style={styles.ownerListingInfo}>
                <Info size={20} color={colors.primary} />
                <Typo color={colors.primary} fontWeight="700">This is your listing</Typo>
            </View>
        );

        if (applicationStatus === 'approved') return (
            <View style={[styles.statusButton, { backgroundColor: colors.green }]}>
                <CheckCircle size={20} color="white" weight="fill" />
                <Typo color="white" fontWeight="700">Application Approved</Typo>
            </View>
        );

        if (hasApplied) return (
            <TouchableOpacity style={[styles.statusButton, styles.cancelBtn]} onPress={() => cancelApplication(userApplication.id)}>
                <Trash size={20} color={colors.red} weight="fill" />
                <Typo color={colors.red} fontWeight="700">Cancel Request</Typo>
            </TouchableOpacity>
        );

        return (
            <Button style={styles.adoptBtn} onPress={handleAdopt} loading={adoptionLoading}>
                <Typo color={colors.white} fontWeight="700" size={18}>Send Adoption Request</Typo>
            </Button>
        );
    }, [isOwner, isSold, adopterData, applicationStatus, hasApplied, adoptionLoading, handleAdopt, pet?.adoptedBy]);

    if (!pet) return <ScreenWrapper style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></ScreenWrapper>;

    return (
        <ScreenWrapper style={styles.container}>
            <View style={styles.headerContainer}><Header title="Pet Details" leftIcon={<BackButton />} /></View>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.imageContainer}>
                    <Image source={getPetImage(pet.image)} style={styles.mainImage} contentFit="cover" transition={300} cachePolicy="memory-disk" />
                    {isSold && <View style={styles.soldBadge}><SealCheck size={20} color="white" weight="fill" /><Typo color="white" fontWeight="700">ADOPTED</Typo></View>}
                </View>

                <View style={styles.content}>
                    <View style={styles.topMeta}>
                        <View style={styles.certifiedBadge}><SealCheck size={16} color={colors.green} weight="fill" /><Text style={styles.certifiedText}>Verified Listing</Text></View>
                        <Typo size={12} color={colors.textLighter}>{getTimeElapsed(pet.createdAt)}</Typo>
                    </View>

                    <View style={styles.titleRow}>
                        <View style={{ flex: 1 }}>
                            <Typo size={28} fontWeight="800">{pet.name}</Typo>
                            <TouchableOpacity style={styles.locationRow} onPress={() => Linking.openURL(`geo:0,0?q=${encodeURIComponent(pet.address)}`)}>
                                <MapPin size={18} color={colors.primary} weight="fill" />
                                <Text numberOfLines={1} style={styles.addressText}>{pet.address}</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.categoryBox}><Typo color={colors.primary} fontWeight="700" size={13}>{pet.category}</Typo></View>
                    </View>

                    <View style={styles.grid}>
                        <InfoCard icon={<PawPrint size={22} color={colors.primary} weight="duotone" />} label="Breed" value={pet.breed} />
                        <InfoCard icon={<Calendar size={22} color={colors.primary} weight="duotone" />} label="Age" value={pet.age ? `${pet.age} Yrs` : 'Baby'} />
                        <InfoCard icon={<Palette size={22} color={colors.primary} weight="duotone" />} label="Color" value={pet.coatcolor || 'Mix'} />
                    </View>

                    <Typo size={18} fontWeight="700" style={{ marginBottom: 12 }}>Description</Typo>
                    <Typo color={colors.textLight} style={styles.descText}>{pet.description || "No specific details provided."}</Typo>

                    <View style={styles.ownerSection}>
                        <Typo size={18} fontWeight="700" style={{ marginBottom: 12 }}>Meet the Owner</Typo>
                        <TouchableOpacity activeOpacity={0.7} onPress={handleOwnerProfilePress} style={styles.ownerCard}>
                            <Image source={ownerData ? { uri: ownerData.image } : require('../../assets/Avatar.jpg')} style={styles.ownerAvatar} cachePolicy="memory-disk" />
                            <View style={styles.ownerDetails}>
                                <Typo fontWeight="700" size={16}>{ownerData?.name || (ownerLoading ? "..." : "Pet Owner")}</Typo>
                                <View style={styles.ownerContactRow}>
                                    <Envelope size={14} color={colors.textLighter} />
                                    <Text style={styles.verifiedMemberText}>{isOwner ? "You listed this" : "Trusted Member"}</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
            <View style={styles.footer}>
                {isSold && !isOwner ? (
                    <View style={styles.unavailableFooter}>
                        <CheckCircle size={22} color={colors.textLighter} weight="fill" />
                        <Typo color={colors.textLighter} fontWeight="700">Adopted</Typo>
                    </View>
                ) : adoptButtonSection}
            </View>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    headerContainer: { paddingHorizontal: spacingX._15, paddingBottom: spacingY._10 },
    scrollContent: { paddingBottom: verticalScale(180) },
    imageContainer: { marginHorizontal: spacingX._20, borderRadius: radius._20, overflow: 'hidden', borderWidth: 1, borderColor: colors.backgroundDark },
    mainImage: { width: '100%', height: verticalScale(350) },
    soldBadge: { position: 'absolute', top: 15, left: 15, backgroundColor: colors.green, paddingHorizontal: 15, paddingVertical: 8, borderRadius: radius._12, flexDirection: 'row', alignItems: 'center', gap: 8 },
    content: { padding: spacingX._20 },
    topMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    certifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.green + '15', paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius._10 },
    certifiedText: { color: colors.green, fontSize: 11, fontWeight: '700' },
    titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 25 },
    locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
    addressText: { fontSize: 14, color: colors.primary, textDecorationLine: 'underline', fontWeight: '600' },
    categoryBox: { backgroundColor: colors.primarySoft, paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius._10, borderWidth: 1, borderColor: colors.primary + '30' },
    grid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
    gridItem: { width: '31%', backgroundColor: colors.white, paddingVertical: 18, borderRadius: radius._20, alignItems: 'center', gap: 5, borderWidth: 1, borderColor: colors.backgroundDark },
    gridValue: { fontSize: 14, fontWeight: '800', color: colors.text },
    ownerSection: { marginTop: 25 },
    ownerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, padding: 15, borderRadius: radius._20, borderWidth: 1, borderColor: colors.backgroundDark },
    ownerAvatar: { width: 54, height: 54, borderRadius: 27, backgroundColor: colors.backgroundDark },
    ownerDetails: { flex: 1, marginLeft: 15 },
    ownerContactRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
    verifiedMemberText: { fontSize: 13, color: colors.textLighter },
    descText: { lineHeight: 24, fontSize: 15, marginBottom: 20 },
    footer: { position: 'absolute', bottom: 0, width: '100%', paddingHorizontal: spacingX._20, paddingBottom: Platform.OS === 'ios' ? spacingY._35 : spacingY._20, backgroundColor: colors.background, height: verticalScale(110), justifyContent: 'center', borderTopWidth: 1, borderTopColor: colors.backgroundDark },
    adoptBtn: { width: '100%', height: verticalScale(56), borderRadius: radius._17, flexDirection: 'row', gap: 10, justifyContent: 'center', alignItems: 'center' },
    statusButton: { width: '100%', height: verticalScale(56), borderRadius: radius._17, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    cancelBtn: { backgroundColor: colors.red + '10', borderWidth: 1, borderColor: colors.red },
    ownerListingInfo: { width: '100%', height: verticalScale(56), backgroundColor: colors.primarySoft, borderRadius: radius._17, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: colors.primary + '20' },
    unavailableFooter: { width: '100%', height: verticalScale(56), backgroundColor: colors.backgroundDark, borderRadius: radius._17, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
    
    // --- NEW PREMIUM ADOPTER CARD STYLES ---
    adopterInfoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.white,
        padding: 12,
        borderRadius: radius._20,
        borderWidth: 1,
        borderColor: colors.backgroundDark,
        elevation: 2,
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10
    },
    adopterAvatarWrapper: {
        position: 'relative',
        marginRight: 12
    },
    adopterAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.backgroundDark
    },
    checkBadge: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        backgroundColor: colors.green,
        borderRadius: 10,
        padding: 2,
        borderWidth: 2,
        borderColor: 'white'
    },
    viewProfilePill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primarySoft,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: radius._12,
        gap: 4
    }
});

export default PetDetailsModal;