import { colors, radius, spacingX, spacingY } from "@/constants/themes";
import { getPetImage } from "@/services/imageService";
import { PetType } from "@/types";
import { getTimeElapsed } from "@/utils/date";
import { verticalScale } from "@/utils/styling";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { CaretRight, CheckCircle, Clock, Heart, MapPin, PawPrint, Trash } from "phosphor-react-native";
import React, { memo, useEffect, useRef, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type CategoryCardProps = {
  pet: PetType;
  onFavoritePress: () => void;
  isFavorite: boolean;
};

const CategoryCard: React.FC<CategoryCardProps> = ({
  pet,
  onFavoritePress,
  isFavorite,
}) => {
  const router = useRouter();
  const isActionInProgress = useRef(false);
  
  const [ticker, setTicker] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTicker((prev) => prev + 1);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const handlePress = () => {
    if (isActionInProgress.current) return;
    isActionInProgress.current = true;
    router.push({
      pathname: "/(modals)/petDetailsModal",
      params: { id: pet.id },
    });
    setTimeout(() => { isActionInProgress.current = false; }, 500);
  };

  const handleFavorite = (e: any) => {
    e.stopPropagation();
    if (isActionInProgress.current) return;
    isActionInProgress.current = true;
    onFavoritePress();
    setTimeout(() => { isActionInProgress.current = false; }, 300);
  };

  return (
    <TouchableOpacity 
      style={[styles.card, pet.isDeleted && { opacity: 0.7 }]} 
      onPress={handlePress} 
      activeOpacity={0.9}
    >
      <View style={styles.imageWrapper}>
        <Image
          source={getPetImage(pet.image)}
          style={styles.image}
          contentFit="cover"
          transition={200}
        />

        {/* * Status Badge (Left Side) */}
        {pet.isDeleted ? (
          <View style={[styles.statusBadge, { backgroundColor: colors.red }]}>
            <Trash size={12} color="white" weight="fill" />
            <Text style={styles.statusText}>Trashed</Text>
          </View>
        ) : pet.status === 'sold' ? (
          <View style={[styles.statusBadge, { backgroundColor: colors.green }]}>
            <CheckCircle size={12} color="white" weight="fill" />
            <Text style={styles.statusText}>Sold</Text>
          </View>
        ) : null}

        <TouchableOpacity style={styles.favButton} onPress={handleFavorite} activeOpacity={0.7}>
          <Heart
            size={22}
            color={isFavorite ? colors.red : colors.white}
            weight={isFavorite ? "fill" : "bold"}
          />
        </TouchableOpacity>

        <View style={styles.categoryTag}>
          <Text style={styles.categoryText}>{pet.category}</Text>
        </View>
      </View>

      <View style={styles.info}>
        <View style={styles.headerRow}>
          <Text style={styles.name} numberOfLines={1}>{pet.name}</Text>
          <Text style={styles.ageText}>{pet.age ? `${pet.age} yrs` : "Baby"}</Text>
        </View>

        <View style={styles.attributeRow}>
          <View style={styles.attributeItem}>
            <PawPrint size={14} color={colors.primary} weight="duotone" />
            <Text style={styles.attributeText} numberOfLines={1}>{pet.breed}</Text>
          </View>
          
          <View style={styles.attributeItem}>
            <Clock size={14} color={colors.textLighter} weight="regular" />
            <Text style={styles.timeText}>{getTimeElapsed(pet.createdAt)}</Text>
          </View>
        </View>

        <View style={styles.footerRow}>
          <View style={styles.addressRow}>
            <MapPin size={14} color={colors.primary} weight="bold" />
            <Text style={styles.address} numberOfLines={1}>
                {pet.address}
            </Text>
          </View>
          
          <View style={styles.seeMore}>
            <Text style={styles.seeMoreText}>See More</Text>
            <CaretRight size={12} color={colors.green} weight="bold" />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default memo(CategoryCard);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius._15,
    marginVertical: spacingY._10,
    marginHorizontal: spacingX._15,
    elevation: 5,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    overflow: "hidden",
  },
  imageWrapper: {
    position: "relative",
    width: "100%",
    height: verticalScale(160),
  },
  image: {
    width: "100%",
    height: "100%",
    backgroundColor: colors.backgroundDark,
  },
  statusBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius._10,
    zIndex: 15,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  favButton: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.3)",
    padding: 8,
    borderRadius: radius._10,
    zIndex: 10,
  },
  categoryTag: {
    position: "absolute",
    bottom: 10,
    left: 10,
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius._10,
  },
  categoryText: { color: colors.white, fontSize: 10, fontWeight: "700" },
  info: { padding: 12, gap: 6 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  name: { fontSize: 18, fontWeight: "800", color: colors.text, flex: 1, marginRight: 10 },
  ageText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
    backgroundColor: colors.primaryLight + "25",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius._10,
  },
  attributeRow: { flexDirection: "row", alignItems: "center", gap: 15, justifyContent: 'space-between' },
  attributeItem: { flexDirection: "row", alignItems: "center", gap: 4, flexShrink: 1 },
  attributeText: { fontSize: 13, color: colors.textLight },
  timeText: { fontSize: 11, color: colors.textLighter, fontStyle: 'italic' },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: colors.backgroundDark,
    paddingTop: 10,
    marginTop: 4,
  },
  addressRow: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 4, 
    flex: 1, 
    paddingRight: 10 
  },
  address: { 
    fontSize: 12, 
    color: colors.textLight,
    flex: 1 
  },
  seeMore: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 2,
    minWidth: 70,
    justifyContent: 'flex-end'
  },
  seeMoreText: { fontSize: 12, fontWeight: "700", color: colors.green },
});