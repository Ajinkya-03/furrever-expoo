import React from 'react';
import { FlatList, StyleSheet, View, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import ScreenWrapper from '@/components/ScreenWrapper';
import Header from '@/components/Header';
import BackButton from '@/components/BackButton';
import Typo from '@/components/Typo';
import { useAdoption } from '@/contexts/AdoptionContext';
import { useAuth } from '@/contexts/AuthContext';
import { colors, radius, spacingX, spacingY } from '@/constants/themes';

const ApplicationsModal = () => {
    const { applications, updateApplicationStatus, loading } = useAdoption();
    const { user } = useAuth();

    const received = applications.filter(app => app.ownerId === user?.uid);

    return (
        <ScreenWrapper style={styles.container}>
            <Header title="Incoming Requests" leftIcon={<BackButton />} />
            <FlatList
                data={received}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ padding: 20, gap: 15 }}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                            <Image source={{ uri: item.petImage }} style={styles.thumb} />
                            <View style={{ flex: 1 }}>
                                <Typo fontWeight="700">{item.petName}</Typo>
                                <Typo size={12} color={colors.textLighter}>Adopter: {item.adopterName}</Typo>
                            </View>
                            <Typo size={12} fontWeight="700" color={item.status === 'approved' ? colors.green : item.status === 'rejected' ? colors.red : colors.primary}>
                                {item.status.toUpperCase()}
                            </Typo>
                        </View>

                        {item.status === 'pending' && (
                            <View style={styles.actions}>
                                <TouchableOpacity style={styles.rej} onPress={() => updateApplicationStatus(item.id, item.petId, 'rejected')}>
                                    <Typo color={colors.red} size={14} fontWeight="600">Reject</Typo>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.acc} onPress={() => updateApplicationStatus(item.id, item.petId, 'approved')}>
                                    <Typo color="white" size={14} fontWeight="600">Approve</Typo>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                )}
            />
        </ScreenWrapper>
    );
};

export default ApplicationsModal;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    card: { backgroundColor: 'white', padding: 15, borderRadius: 20, elevation: 2 },
    thumb: { width: 50, height: 50, borderRadius: 12 },
    actions: { flexDirection: 'row', gap: 10, marginTop: 15 },
    rej: { flex: 1, height: 40, backgroundColor: colors.red + '15', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    acc: { flex: 1, height: 40, backgroundColor: colors.primary, borderRadius: 10, justifyContent: 'center', alignItems: 'center' }
});