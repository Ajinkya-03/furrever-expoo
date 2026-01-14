import React, { useMemo, useCallback, useRef } from 'react';
import { StyleSheet, FlatList, View } from 'react-native';
import { useRouter } from 'expo-router';

import ScreenWrapper from '@/components/ScreenWrapper';
import Typo from '@/components/Typo';
import CategoryCard from '@/components/CategoryCard';
import { usePets } from '@/contexts/PetContext';
import { useAuth } from '@/contexts/AuthContext';
import { spacingX, spacingY, colors } from '@/constants/themes';

const Favourite = () => {
  const { pets, toggleFavorite } = usePets();
  const { user } = useAuth();
  const router = useRouter();
  const isNavigating = useRef(false);

  // Filter logic: Only show pets whose ID is in the user's favorites array
  const favoritePets = useMemo(() => {
    if (!user?.favorites) return [];
    return pets.filter(pet => user.favorites?.includes(pet.id) && !pet.isDeleted);
  }, [pets, user?.favorites]);

  const onCardPress = useCallback((id: string) => {
    if (isNavigating.current) return;
    isNavigating.current = true;
    router.push({ pathname: "/(modals)/petDetailsModal", params: { id } });
    setTimeout(() => { isNavigating.current = false; }, 800);
  }, [router]);

  return (
    <ScreenWrapper style={styles.container}>
      <View style={styles.header}>
        <Typo size={28} fontWeight="800">My Favorites</Typo>
        <Typo color={colors.textLight} size={15}>
          {favoritePets.length} {favoritePets.length === 1 ? 'buddy' : 'buddies'} saved
        </Typo>
      </View>

      <FlatList
        data={favoritePets}
        // extraData tells the list to re-render when favorites array changes
        extraData={user?.favorites} 
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CategoryCard
            pet={item}
            isFavorite={true}
            onFavoritePress={() => toggleFavorite(item.id)}
            onCardPress={() => onCardPress(item.id)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Typo color={colors.textLight} size={16} fontWeight="600">No favorites saved yet</Typo>
            <Typo color={colors.textLighter} size={14} style={{textAlign: 'center'}}>
                Buddies you heart will appear here!
            </Typo>
          </View>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </ScreenWrapper>
  );
};

export default Favourite;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacingX._20, paddingVertical: spacingY._20, gap: 4 },
  listContent: { paddingBottom: spacingY._30 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 150, paddingHorizontal: spacingX._20, gap: 8 },
});