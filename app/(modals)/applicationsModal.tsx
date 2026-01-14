import React, { useCallback, useMemo, useRef } from 'react';
import { FlatList, StyleSheet, View, TouchableOpacity, Platform, ActivityIndicator, Alert } from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import ScreenWrapper from '@/components/ScreenWrapper';
import Header from '@/components/Header';
import BackButton from '@/components/BackButton';
import Typo from '@/components/Typo';
import { useAdoption } from '@/contexts/AdoptionContext';
import { useAuth } from '@/contexts/AuthContext';
import { colors, radius, spacingX, spacingY } from '@/constants/themes';
import { verticalScale } from '@/utils/styling';
import { Info } from 'phosphor-react-native';

/**
 * Memoized Card component for high-performance list rendering
 */
const ApplicationCard = React.memo(({ item, onAction }: any) => {
    const isPending = item.status === 'pending';

    return (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Image 
                    source={{ uri: item.petImage }} 
                    style={styles.thumb} 
                    contentFit="cover"
                    transition={200}
                    cachePolicy="memory-disk"
                />
                <View style={{ flex: 1 }}>
                    <Typo fontWeight="700" size={16}>{item.petName}</Typo>
                    <Typo size={13} color={colors.textLighter}>Adopter: {item.adopterName}</Typo>
                </View>
                <View style={[
                    styles.statusBadge, 
                    { backgroundColor: item.status === 'approved' ? colors.green + '15' : item.status === 'rejected' ? colors.red + '15' : colors.primary + '15' }
                ]}>
                    <Typo size={10} fontWeight="800" color={item.status === 'approved' ? colors.green : item.status === 'rejected' ? colors.red : colors.primary}>
                        {item.status.toUpperCase()}
                    </Typo>
                </View>
            </View>

            {isPending && (
                <View style={styles.actions}>
                    <TouchableOpacity 
                        style={styles.rej} 
                        onPress={() => onAction(item.id, item.petId, 'rejected')}
                        activeOpacity={0.7}
                    >
                        <Typo color={colors.red} size={14} fontWeight="700">Reject</Typo>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={styles.acc} 
                        onPress={() => onAction(item.id, item.petId, 'approved')}
                        activeOpacity={0.7}
                    >
                        <Typo color="white" size={14} fontWeight="700">Approve</Typo>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
});

const ApplicationsModal = () => {
    const { applications, updateApplicationStatus, loading } = useAdoption();
    const { user } = useAuth();
    const isProcessing = useRef(false);

    // Efficient memoized filtering
    const received = useMemo(() => 
        applications.filter(app => app.ownerId === user?.uid)
    , [applications, user?.uid]);

    const handleAction = useCallback(async (id: string, petId: string, status: 'approved' | 'rejected') => {
        if (isProcessing.current) return;
        isProcessing.current = true;
        
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        Alert.alert(
            status === 'approved' ? "Approve Request?" : "Reject Request?",
            status === 'approved' ? "This will notify the adopter and mark the process as moving forward." : "This request will be declined.",
            [
                { text: "Cancel", style: "cancel", onPress: () => { isProcessing.current = false; } },
                { 
                    text: status === 'approved' ? "Approve" : "Reject", 
                    style: status === 'rejected' ? "destructive" : "default",
                    onPress: async () => {
                        const res = await updateApplicationStatus(id, petId, status);
                        if (res?.success) {
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        }
                        isProcessing.current = false;
                    }
                }
            ]
        );
    }, [updateApplicationStatus]);

    return (
        <ScreenWrapper style={styles.container}>
            <Header title="Incoming Requests" leftIcon={<BackButton />} />
            
            <FlatList
                data={received}
                keyExtractor={(item) => item.id}
                // Combined padding for all sides and top
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                    <ApplicationCard item={item} onAction={handleAction} />
                )}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Info size={40} color={colors.textLighter} weight="duotone" />
                        <Typo color={colors.textLighter} style={{ marginTop: 10 }}>No adoption requests yet.</Typo>
                    </View>
                }
            />
        </ScreenWrapper>
    );
};

export default ApplicationsModal;

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: colors.background,
        paddingTop: Platform.OS === 'ios' ? spacingY._40 : spacingY._60,
        padding: Platform.OS === 'ios' ? spacingY._10 : spacingY._15,
    },
    listContent: { 
        paddingHorizontal: spacingX._5,
        paddingTop: spacingY._20,
        paddingBottom: verticalScale(60),
        gap: spacingY._15 
    },
    card: { 
        backgroundColor: colors.white, 
        padding: 16, 
        borderRadius: radius._20, 
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.05,
                shadowRadius: 12,
            },
            android: {
                elevation: 3,
            }
        })
    },
    cardHeader: { 
        flexDirection: 'row', 
        gap: 12, 
        alignItems: 'center' 
    },
    thumb: { 
        width: 56, 
        height: 56, 
        borderRadius: radius._15,
        backgroundColor: colors.backgroundDark 
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: radius._10,
    },
    actions: { 
        flexDirection: 'row', 
        gap: 12, 
        marginTop: 16,
        borderTopWidth: 1,
        borderTopColor: colors.backgroundDark,
        paddingTop: 16
    },
    rej: { 
        flex: 1, 
        height: 44, 
        backgroundColor: colors.red + '10', 
        borderRadius: radius._12, 
        justifyContent: 'center', 
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.red + '20'
    },
    acc: { 
        flex: 1, 
        height: 44, 
        backgroundColor: colors.primary, 
        borderRadius: radius._12, 
        justifyContent: 'center', 
        alignItems: 'center'
    },
    emptyState: {
        marginTop: verticalScale(150),
        alignItems: 'center',
        justifyContent: 'center'
    }
});