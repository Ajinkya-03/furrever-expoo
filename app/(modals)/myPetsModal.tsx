import BackButton from '@/components/BackButton';
import CategoryCard from '@/components/CategoryCard';
import Header from '@/components/Header';
import ScreenWrapper from '@/components/ScreenWrapper';
import Typo from '@/components/Typo';
import { colors, radius, spacingX, spacingY } from '@/constants/themes';
import { useAuth } from '@/contexts/AuthContext';
import { usePets } from '@/contexts/PetContext';
import { verticalScale } from '@/utils/styling';
import { useRouter } from 'expo-router';
import { ArrowCounterClockwise, CheckCircle, Info, PencilLine, Trash } from 'phosphor-react-native';
import React from 'react';
import { Alert, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';

const MyPetsModal = () => {
    const { pets, deletePet, markAsSold, updatePet } = usePets();
    const { user } = useAuth();
    const router = useRouter();

    // * Filter for current user's pets
    const myPets = pets.filter((p: { ownerId: string | undefined; }) => p.ownerId === user?.uid);

    const handleSold = (id: string) => {
        Alert.alert("Finalize Sale", "Marking as sold hides the listing from the public feed. Proceed?", [
            { text: "Cancel", style: "cancel" },
            { text: "Confirm Sold", onPress: () => markAsSold(id) }
        ]);
    };

    const handleDelete = (id: string) => {
        Alert.alert("Move to Trash", "This pet will be hidden. You can restore it from here if needed.", [
            { text: "Cancel", style: "cancel" },
            { text: "Move to Trash", style: "destructive", onPress: () => deletePet(id) }
        ]);
    };

    const handleRestore = (id: string) => {
        Alert.alert("Restore Listing", "Make this pet visible on the home feed again?", [
            { text: "Cancel", style: "cancel" },
            { text: "Restore", onPress: () => updatePet(id, { isDeleted: false, status: 'available' }) }
        ]);
    };

    const handleEdit = (id: string) => {
        router.push({
            pathname: "/(modals)/PetListModal",
            params: { id, mode: 'edit' }
        });
    };

    return (
        <ScreenWrapper style={styles.container}>
            <View style={styles.headerContainer}>
                <Header title="My Listings" leftIcon={<BackButton />} />
            </View>

            <FlatList
                data={myPets}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => {
                    const isSold = item.status === 'sold';
                    const isTrashed = item.isDeleted;

                    return (
                        <View style={[styles.cardWrapper, isTrashed && { opacity: 0.6 }]}>
                            <CategoryCard 
                                pet={item} 
                                isFavorite={Boolean(item.favoredBy?.includes(user?.uid || ""))} 
                                onFavoritePress={() => {}} 
                            />

                            <View style={styles.actionRow}>
                                {isTrashed ? (
                                    <TouchableOpacity 
                                        style={[styles.actionBtn, styles.restoreBtn]} 
                                        onPress={() => handleRestore(item.id)}
                                    >
                                        <ArrowCounterClockwise size={18} color={colors.green} weight="duotone" />
                                        <Typo size={12} color={colors.green} fontWeight="700">Restore Listing</Typo>
                                    </TouchableOpacity>
                                ) : (
                                    <>
                                        {/* Edit hidden if Sold */}
                                        {!isSold && (
                                            <TouchableOpacity 
                                                style={[styles.actionBtn, styles.editBtn]} 
                                                onPress={() => handleEdit(item.id)}
                                            >
                                                <PencilLine size={18} color={colors.primary} weight="duotone" />
                                                <Typo size={12} color={colors.primary} fontWeight="700">Edit</Typo>
                                            </TouchableOpacity>
                                        )}

                                        {!isSold ? (
                                            <TouchableOpacity 
                                                style={[styles.actionBtn, styles.soldBtn]} 
                                                onPress={() => handleSold(item.id)}
                                            >
                                                <CheckCircle size={18} color={colors.green} weight="duotone" />
                                                <Typo size={12} color={colors.green} fontWeight="700">Mark Sold</Typo>
                                            </TouchableOpacity>
                                        ) : (
                                            <View style={[styles.actionBtn, styles.soldLabel]}>
                                                <CheckCircle size={18} color={colors.white} weight="fill" />
                                                <Typo size={12} color={colors.white} fontWeight="800">COMPLETED</Typo>
                                            </View>
                                        )}

                                        <TouchableOpacity 
                                            style={[styles.actionBtn, styles.deleteBtn]} 
                                            onPress={() => handleDelete(item.id)}
                                        >
                                            <Trash size={18} color={colors.red} weight="duotone" />
                                            <Typo size={12} color={colors.red} fontWeight="700">Remove</Typo>
                                        </TouchableOpacity>
                                    </>
                                )}
                            </View>
                        </View>
                    );
                }}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIconContainer}>
                            <Info size={40} color={colors.textLighter} weight="duotone" />
                        </View>
                        <Typo color={colors.text} size={18} fontWeight="700">No listings yet</Typo>
                        <Typo color={colors.textLighter} size={14} style={styles.emptyText}>
                            Your listed pets for adoption will appear here for management.
                        </Typo>
                    </View>
                }
            />
        </ScreenWrapper>
    );
};

export default MyPetsModal;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    headerContainer: {
        paddingHorizontal: spacingX._5, 
        paddingBottom: spacingY._10,
    },
    listContent: { 
        paddingBottom: verticalScale(60),
        paddingTop: spacingY._5 
    },
    cardWrapper: {
        marginBottom: spacingY._20,
    },
    actionRow: {
        flexDirection: 'row',
        marginHorizontal: spacingX._15, // Matches CategoryCard perfectly
        gap: spacingX._10,
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        height: verticalScale(44),
        borderRadius: radius._12,
        borderWidth: 1.2,
    },
    editBtn: {
        backgroundColor: colors.primary + '10',
        borderColor: colors.primary + '20',
    },
    soldBtn: {
        backgroundColor: colors.green + '10',
        borderColor: colors.green + '20',
    },
    deleteBtn: {
        backgroundColor: colors.red + '10',
        borderColor: colors.red + '20',
    },
    restoreBtn: {
        backgroundColor: colors.green + '05',
        borderColor: colors.green + '40',
        borderStyle: 'dashed',
    },
    soldLabel: {
        backgroundColor: colors.green,
        borderColor: colors.green,
        flex: 2, 
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: verticalScale(180),
    },
    emptyIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.backgroundDark,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    emptyText: { textAlign: 'center', paddingHorizontal: 40, marginTop: 5 }
});