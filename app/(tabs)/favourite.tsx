import React from 'react';
import { StyleSheet, FlatList, View } from 'react-native';
import ScreenWrapper from '@/components/ScreenWrapper';
import Typo from '@/components/Typo';
import CategoryCard from '@/components/CategoryCard';
import { usePets } from '@/contexts/PetContext';
import { useAuth } from '@/contexts/AuthContext';
import { spacingX, spacingY, colors } from '@/constants/themes';
import { useRouter } from 'expo-router';

const Favourite = () => {
  const { pets, toggleFavorite } = usePets();
  const { user } = useAuth();
  const router = useRouter();

  // Filter: Show only pets where pet ID is in the user's favorites array
  const favoritePets = pets.filter(pet => 
    user?.favorites?.includes(pet.id)
  );

  return (
    <ScreenWrapper style={styles.container}>
      <View style={styles.header}>
        <Typo size={28} fontWeight="800">My Favorites</Typo>
        <Typo color={colors.textLight} size={15}>
          {favoritePets.length} {favoritePets.length === 1 ? 'pet' : 'pets'} saved
        </Typo>
      </View>

      <FlatList
        data={favoritePets}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CategoryCard
            pet={item}
            isFavorite={true}
            onFavoritePress={() => toggleFavorite(item.id)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Typo color={colors.textLight} size={16} fontWeight="600">
                Your list is empty
            </Typo>
            <Typo color={colors.gray} size={14} style={{textAlign: 'center'}}>
                Tap the heart on a pet to save them for later!
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
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacingX._20,
    paddingVertical: spacingY._20,
    gap: 4,
  },
  listContent: {
    // paddingHorizontal: spacingX._15,
    paddingBottom: spacingY._30,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 150,
    paddingHorizontal: spacingX._20,
    gap: 8,
  }
});