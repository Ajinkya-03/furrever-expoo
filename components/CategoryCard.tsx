import React from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { PetType } from "@/types";
import { colors, radius, spacingX } from "@/constants/themes";

type CategoryCardProps = {
    pet: PetType;
    onPress?: () => void;
};

const CategoryCard: React.FC<CategoryCardProps> = ({ pet, onPress }) => {
    return (
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
            {pet.image && (
                <Image source={{ uri: pet.image }} style={styles.image} />
            )}
            <View style={styles.info}>
                <Text style={styles.name}>{pet.name}</Text>
                <Text style={styles.category}>{pet.category}</Text>
                {pet.age && <Text style={styles.age}>Age: {pet.age}</Text>}
                {pet.address && <Text style={styles.address}>{pet.address}</Text>}
            </View>
        </TouchableOpacity>
    );
};
export default CategoryCard;

const styles = StyleSheet.create({
    card: {
        backgroundColor: "#fff",
        borderRadius: radius._10,
        marginVertical: 10,
        marginHorizontal: spacingX._5,
        overflow: "hidden",
        elevation: 3,
    },
    image: {
        width: "100%",
        height: 180,
    },
    info: {
        padding: 12,
    },
    name: {
        fontSize: 18,
        fontWeight: "bold",
        color: colors.text,
    },
    category: {
        fontSize: 14,
        color: colors.textLighter,
        marginTop: 2,
    },
    age: {
        fontSize: 14,
        marginTop: 4,
        color: colors.gray,
    },
    address: {
        fontSize: 12,
        color: colors.gray,
        marginTop: 2,
    },
});

