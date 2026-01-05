import React, { useState } from "react";
import { StyleSheet, View, TouchableOpacity, FlatList } from "react-native";
import { Dog, Cat, Bird, PawPrint } from "phosphor-react-native";
import { CategoryTypeProps } from "@/types";
import Typo from "./Typo";
import { colors, radius, spacingX } from "@/constants/themes";
import { verticalScale } from "@/utils/styling";

type CategoryProps = {
  onCategorySelect: (category: string) => void; //  callback to parent
};

const Category: React.FC<CategoryProps> = ({ onCategorySelect }) => {
  const [selectedId, setSelectedId] = useState<string>("1");

  const categories: CategoryTypeProps[] = [
    { id: "1", type: "Dogs", imageUrl: "dog" },
    { id: "2", type: "Cats", imageUrl: "cat" },
    { id: "3", type: "Birds", imageUrl: "bird" },
    { id: "4", type: "Others", imageUrl: "others" },
    { id: "5", type: "All", imageUrl: "all" }, // Added All category
  ];

  const getCategoryIcon = (imageUrl: string) => {
    const iconProps = { size: 32, weight: "duotone" as const };
    switch (imageUrl.toLowerCase()) {
      case "dog":
      default:
        return <Dog {...iconProps} color={colors.orange} />;
      case "cat":
        return <Cat {...iconProps} color="#4ECDC4" />;
      case "bird":
        return <Bird {...iconProps} color={colors.red} />;
      case "others":
        return <PawPrint {...iconProps} color={colors.blue} />;
      case "all":
        return <PawPrint {...iconProps} color={colors.green} />;
    }
  };

  const handleCategoryPress = (category: CategoryTypeProps) => {
    setSelectedId(category.id);
    onCategorySelect(category.type); // notify parent
  };

  const renderCategoryItem = ({ item }: { item: CategoryTypeProps }) => {
    const isSelected = selectedId === item.id;
    return (
      <TouchableOpacity
        style={styles.categoryItem}
        onPress={() => handleCategoryPress(item)}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.iconContainer,
            isSelected && { borderWidth: 2, borderColor: colors.orange },
          ]}
        >
          {getCategoryIcon(item.imageUrl)}
        </View>
        <Typo color={colors.textLighter} size={14} fontWeight={"700"}>
          {item.type}
        </Typo>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={categories}
        renderItem={renderCategoryItem}
        keyExtractor={(item) => item.id}
        numColumns={5}
        scrollEnabled={false}
        columnWrapperStyle={styles.columnWrapper}
      />
    </View>
  );
};

export default Category;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacingX._20,
  },
  columnWrapper: {
    justifyContent: "space-around",
    alignSelf: "center",
  },
  categoryItem: {
    alignItems: "center",
    width: "22%",
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: radius._6,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: verticalScale(8),
    borderWidth: 2,
    borderColor: colors.gray,
  },
});
