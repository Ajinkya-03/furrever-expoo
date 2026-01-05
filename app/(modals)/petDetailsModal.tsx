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
import { verticalScale } from '@/utils/styling';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import {
    ArrowClockwise,
    Calendar, ChatCircleDots,
    CheckCircle,
    Envelope,
    Info,
    MapPin,
    Palette, PawPrint, SealCheck,
    Trash,
    XCircle
} from 'phosphor-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const PetDetailsModal = () => {
    const { id } = useLocalSearchParams();
    const { pets, toggleFavorite } = usePets();
    const { sendApplication, cancelApplication, loading: adoptionLoading, applications } = useAdoption();
    const { getOrCreateChatRoom } = useChat();
    const { user: currentUser } = useAuth();
    const router = useRouter();

    const pet = pets.find((p) => p.id === id) as PetType | undefined;
    const [ownerData, setOwnerData] = useState<any>(null);
    const isNavigating = useRef(false); // * Prevents multiple chat openings

    if (!pet) return null;

    const isFavorite = pet?.favoredBy?.includes(currentUser?.uid || "");
    const isSold = pet?.status === 'sold';
    const isTrashed = pet?.isDeleted;
    const isUnavailable = isSold || isTrashed;
    const isOwner = pet?.ownerId === currentUser?.uid;

    const userApplication = applications.find(app => app.petId === pet?.id && app.adopterId === currentUser?.uid);
    const hasApplied = !!userApplication;
    const applicationStatus = userApplication?.status;

    useEffect(() => {
        const fetchOwner = async () => {
            if (pet?.ownerId) {
                try {
                    const userDoc = await getDoc(doc(firestore, "users", pet.ownerId));
                    if (userDoc.exists()) setOwnerData(userDoc.data());
                } catch (error) { console.error("Error fetching owner:", error); }
            }
        };
        fetchOwner();
    }, [pet?.ownerId]);

    const handleChatPress = async () => {
        if (isNavigating.current) return; // * Limit clicking to once
        if (!currentUser || !pet?.ownerId) return;

        isNavigating.current = true;
        const roomId = await getOrCreateChatRoom(pet.ownerId);
        
        if (roomId) {
            router.push({
                pathname: "/(modals)/chatScreenModal",
                params: {
                    roomId,
                    otherUserName: ownerData?.name || "Pet Owner",
                    otherUserImage: ownerData?.image || ""
                }
            });
        }
        
        // Reset lock after navigation is complete or fails
        setTimeout(() => { isNavigating.current = false; }, 1000);
    };

    const handleAdopt = async () => {
        if (!currentUser) {
            Alert.alert("Login Required", "Please login to send an adoption request.");
            return;
        }
        const res = await sendApplication(pet);
        if (res.success) Alert.alert("Success", "Application sent to owner!");
        else Alert.alert("Notice", res.msg);
    };

    const handleCancel = async () => {
        if (!userApplication) return;
        Alert.alert("Cancel Request", "Withdraw your request?", [
            { text: "No", style: "cancel" },
            { text: "Yes, Cancel", style: "destructive", onPress: () => cancelApplication(userApplication.id) }
        ]);
    };

    const handleResendApplication = async () => {
        if (!userApplication) return;
        Alert.alert("Resend Application", "Send a new request for this pet?", [
            { text: "Cancel", style: "cancel" },
            { 
                text: "Resend", 
                onPress: async () => {
                    await cancelApplication(userApplication.id); // Clear old rejection
                    await handleAdopt(); // Send fresh application
                }
            }
        ]);
    };

    const renderAdoptButton = () => {
        if (isOwner) return null;

        if (applicationStatus === 'approved') {
            return (
                <View style={[styles.statusButton, { backgroundColor: colors.green }]}>
                    <CheckCircle size={20} color="white" weight="fill" />
                    <Typo color="white" fontWeight="700">Application Approved</Typo>
                </View>
            );
        }

        if (applicationStatus === 'rejected') {
            return (
                <View style={styles.rejectedContainer}>
                    <View style={[styles.statusButton, { backgroundColor: colors.red }]}>
                        <XCircle size={20} color="white" weight="fill" />
                        <Typo color="white" fontWeight="700">Application Rejected</Typo>
                    </View>
                    <TouchableOpacity 
                        style={[styles.statusButton, { backgroundColor: colors.primary }]} 
                        onPress={handleResendApplication}
                    >
                        <ArrowClockwise size={20} color="white" weight="bold" />
                        <Typo color="white" fontWeight="700">Resend Request</Typo>
                    </TouchableOpacity>
                </View>
            );
        }

        if (hasApplied) {
            return (
                <TouchableOpacity style={[styles.statusButton, styles.cancelBtn]} onPress={handleCancel}>
                    <Trash size={20} color={colors.red} weight="fill" />
                    <Typo color={colors.red} fontWeight="700">Cancel Request</Typo>
                </TouchableOpacity>
            );
        }

        return (
            <Button style={styles.adoptBtn} onPress={handleAdopt} loading={adoptionLoading}>
                <Typo color={colors.white} fontWeight="700" size={18}>Adopt Me</Typo>
            </Button>
        );
    }

    return (
        <ScreenWrapper style={styles.container}>
            <View style={styles.headerContainer}>
                <Header title="Pet Details" leftIcon={<BackButton />} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.imageContainer}>
                    <Image source={getPetImage(pet.image)} style={styles.mainImage} contentFit="cover" />
                    {isSold && <View style={[styles.statusOverlay, { backgroundColor: colors.green }]}><SealCheck size={20} color="white" weight="fill" /><Typo color="white" fontWeight="700">SOLD</Typo></View>}
                </View>

                <View style={styles.content}>
                    <View style={styles.topMeta}>
                        <View style={styles.certifiedBadge}><SealCheck size={16} color={colors.green} weight="fill" /><Text style={styles.certifiedText}>FurrEver Certified</Text></View>
                        <Typo size={12} color={colors.textLighter}>{getTimeElapsed(pet.createdAt)}</Typo>
                    </View>

                    <View style={styles.titleRow}>
                        <View style={{ flex: 1 }}>
                            <Typo size={28} fontWeight="700">{pet.name}</Typo>
                            <View style={styles.locationRow}>
                                <MapPin size={16} color={colors.primary} weight="fill" />
                                <Text numberOfLines={1} style={styles.addressText}>{pet.address}</Text>
                            </View>
                        </View>
                        <View style={styles.categoryBadge}><Text style={styles.categoryText}>{pet.category}</Text></View>
                    </View>

                    <View style={styles.grid}>
                        <InfoCard icon={<PawPrint size={22} color={colors.primary} weight="duotone" />} label="Breed" value={pet.breed} />
                        <InfoCard icon={<Calendar size={22} color={colors.primary} weight="duotone" />} label="Age" value={pet.age ? `${pet.age} Yrs` : 'Baby'} />
                        <InfoCard icon={<Palette size={22} color={colors.primary} weight="duotone" />} label="Color" value={pet.coatcolor || 'N/A'} />
                    </View>

                    <View style={styles.ownerSection}>
                        <Typo size={18} fontWeight="700" style={{ marginBottom: 12 }}>Owner Information</Typo>
                        <View style={styles.ownerCard}>
                            <Image source={ownerData?.image ? { uri: ownerData.image } : require('../../assets/Avatar.jpg')} style={styles.ownerAvatar} />
                            <View style={styles.ownerDetails}>
                                <Typo fontWeight="700" size={16}>{ownerData?.name || "Loading..."}</Typo>
                                <View style={styles.ownerContactRow}>
                                    <Envelope size={14} color={colors.textLighter} />
                                    <Text numberOfLines={1} style={{ fontSize: 13, color: colors.textLighter }}>{isOwner ? "Your Listing" : (ownerData?.email || "Verified Member")}</Text>
                                </View>
                            </View>
                            {!isUnavailable && !isOwner && (
                                <TouchableOpacity style={styles.chatIcon} onPress={handleChatPress}>
                                    <ChatCircleDots size={22} color={colors.primary} weight="fill" />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Typo size={18} fontWeight="700">About {pet.name}</Typo>
                        <Typo color={colors.textLight} style={styles.descText}>{pet.description || "No description provided."}</Typo>
                    </View>
                </View>
            </ScrollView>

            <View style={[styles.footer, applicationStatus === 'rejected' && { height: verticalScale(145) }]}>
                {!isUnavailable ? renderAdoptButton() : (
                    <View style={styles.unavailableFooter}>
                        <Info size={20} color={colors.textLighter} />
                        <Typo color={colors.textLighter}>Listing inactive</Typo>
                    </View>
                )}
            </View>
        </ScreenWrapper>
    );
};

const InfoCard = ({ icon, label, value }: any) => (
    <View style={styles.gridItem}>
        {icon}
        <Text numberOfLines={1} style={{ fontSize: 13, fontWeight: '700' }}>{value}</Text>
        <Typo size={11} color={colors.textLighter}>{label}</Typo>
    </View>
);

export default PetDetailsModal;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    headerContainer: { paddingHorizontal: spacingX._15, paddingBottom: spacingY._10 },
    scrollContent: { paddingBottom: verticalScale(160) },
    imageContainer: { marginHorizontal: spacingX._20, borderRadius: radius._30, overflow: 'hidden' },
    mainImage: { width: '100%', height: verticalScale(340) },
    statusOverlay: { position: 'absolute', top: 12, left: 12, paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius._10, flexDirection: 'row', alignItems: 'center', gap: 8 },
    content: { padding: spacingX._20 },
    topMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    certifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.green + '15', paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius._10 },
    certifiedText: { color: colors.green, fontSize: 11, fontWeight: '700' },
    titleRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
    locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
    addressText: { fontSize: 14, color: colors.text, textDecorationLine: 'underline' },
    categoryBadge: { backgroundColor: colors.primary + '15', paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius._10 },
    categoryText: { color: colors.primary, fontWeight: '700', fontSize: 12 },
    grid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
    gridItem: { width: '31%', backgroundColor: colors.white, paddingVertical: 15, borderRadius: radius._20, alignItems: 'center', gap: 5, borderWidth: 1, borderColor: colors.backgroundDark },
    ownerSection: { marginBottom: 25 },
    ownerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, padding: 15, borderRadius: radius._20, borderWidth: 1, borderColor: colors.backgroundDark },
    ownerAvatar: { width: 50, height: 50, borderRadius: 25 },
    ownerDetails: { flex: 1, marginLeft: 15 },
    ownerContactRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    chatIcon: { backgroundColor: colors.primary + '15', padding: 10, borderRadius: 12 },
    section: { marginBottom: 30 },
    descText: { lineHeight: 22 },
    footer: { position: 'absolute', bottom: 0, width: '100%', paddingHorizontal: spacingX._20, paddingBottom: spacingY._20, backgroundColor: colors.background, height: verticalScale(100), justifyContent: 'center' },
    rejectedContainer: { gap: 10, width: '100%' },
    adoptBtn: { width: '100%', height: verticalScale(54), borderRadius: radius._20 },
    statusButton: { width: '100%', height: verticalScale(54), borderRadius: radius._20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    cancelBtn: { backgroundColor: colors.red + '15', borderWidth: 1, borderColor: colors.red },
    unavailableFooter: { width: '100%', height: verticalScale(54), backgroundColor: colors.backgroundDark, borderRadius: radius._20, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
});