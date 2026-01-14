import React, { useRef, useCallback } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import * as Haptics from 'expo-haptics';
import { Dog, Cat, Bird, PawPrint, SquaresFour } from "phosphor-react-native";

import Typo from "./Typo";
import { colors, radius, spacingX } from "@/constants/themes";
import { scale, verticalScale } from "@/utils/styling";

interface CategoryProps {
  onCategorySelect: (category: string) => void;
  selectedCategory: string;
}

const CATEGORIES = [
  { id: "1", name: "All", icon: SquaresFour, color: colors.green },
  { id: "2", name: "Dogs", icon: Dog, color: colors.orange },
  { id: "3", name: "Cats", icon: Cat, color: colors.blue },
  { id: "4", name: "Birds", icon: Bird, color: colors.red },
  { id: "5", name: "Others", icon: PawPrint, color: colors.primaryDark },
];

const Category: React.FC<CategoryProps> = ({ onCategorySelect, selectedCategory }) => {
  // Use a ref to prevent rapid click spamming that crashes the bridge
  const isProcessing = useRef(false);

  const handleSelect = useCallback((name: string) => {
    if (selectedCategory === name || isProcessing.current) return;

    isProcessing.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onCategorySelect(name);

    // Release the lock after a short delay (debounce)
    setTimeout(() => {
      isProcessing.current = false;
    }, 400); 
  }, [onCategorySelect, selectedCategory]);

  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
      >
        {CATEGORIES.map((item) => {
          const isActive = selectedCategory === item.name;
          const Icon = item.icon;
          
          return (
            <TouchableOpacity
              key={item.id}
              onPress={() => handleSelect(item.name)}
              activeOpacity={0.6}
              style={[
                styles.pill,
                isActive ? { borderColor: item.color, backgroundColor: colors.white } : { borderColor: colors.backgroundDark }
              ]}
            >
              <View style={[
                styles.iconWrapper, 
                { backgroundColor: isActive ? item.color : colors.backgroundDark }
              ]}>
                 <Icon 
                    size={scale(18)} 
                    color={isActive ? colors.white : colors.textLighter} 
                    weight={isActive ? "fill" : "duotone"} 
                />
              </View>
              <Typo 
                size={14} 
                fontWeight={isActive ? "800" : "600"} 
                color={isActive ? colors.text : colors.textLighter}
              >
                {item.name}
              </Typo>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

export default React.memo(Category);

const styles = StyleSheet.create({
  container: { marginVertical: verticalScale(12) },
  scrollContent: { paddingHorizontal: spacingX._20, gap: scale(12) },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: scale(6),
    paddingRight: scale(16),
    paddingVertical: verticalScale(6),
    borderRadius: radius._40,
    backgroundColor: 'white',
    borderWidth: 1.5, // Changed from shadow to flat border
  },
  iconWrapper: {
    width: scale(30),
    height: scale(30),
    borderRadius: radius._40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(8),
  }
});