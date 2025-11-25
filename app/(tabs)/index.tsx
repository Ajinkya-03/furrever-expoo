import { StyleSheet, View, Image } from "react-native";
import React from "react";
import Typo from "@/components/Typo";
import ScreenWrapper from "@/components/ScreenWrapper";
import Sliders from "@/components/Sliders";
import { useAuth } from "@/contexts/AuthContext";
import { colors, spacingX, spacingY } from "@/constants/themes";
import { verticalScale } from "@/utils/styling";
import ListbyCategory from "@/components/ListbyCategory"; // use consistent naming
import Button from "@/components/Button";
import { router, useRouter } from "expo-router";


const DEFAULT_AVATAR = require("../../assets/Avatar.jpg");

const Home: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  
  const avatarSource = user?.image ? { uri: user.image } : DEFAULT_AVATAR;

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        {/* --- HEADER CONTENT --- */}
        <View style={styles.header}>
          <View style={{ gap: 4 }}>
            <Typo size={16} color={colors.text} fontWeight={"700"}>
              Hey! Pet lover,
            </Typo>
            <Typo size={20} color={colors.textLighter} fontWeight={"700"}>
              {user?.name || "Guest"}
            </Typo>
          </View>

          {/* --- AVATAR RENDERING --- */}
          <View style={styles.avatarContainer}>
            <Image
              source={avatarSource}
              style={styles.avatarImage}
              accessibilityLabel="User profile picture"
            />
          </View>
        </View>

        {/* --- SLIDERS --- */}
        <View style={styles.imageSlider}>
          <Sliders />
        </View>

        {/* Add pet and My Pet button*/}
        <View style={{ flexDirection: "row", gap: spacingX._10, alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacingX._20, marginBottom: spacingY._20, }}>
          <Button
            style={{ width: "50%" }}
            onPress={() => router.push("/(modals)/PetListModal")}
          >
            <Typo size={14} fontWeight={"700"} color={colors.background}>
              Add Pet
            </Typo>
          </Button>

          <Button
            style={{ width: "50%" }}
            // onPress={() => router.push("/(modals)/my-pets")}
          >
            <Typo size={14} fontWeight={"700"} color={colors.background}>
              My Pets
            </Typo>
          </Button>

        </View>
        {/* --- CATEGORIES --- */}
        <View>
          <ListbyCategory />
        </View>
      </View>
    </ScreenWrapper>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacingX._20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacingY._20,
  },
  avatarContainer: {
    width: verticalScale(50),
    height: verticalScale(50),
    borderRadius: verticalScale(25),
    overflow: "hidden",
    backgroundColor: colors.primary,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  imageSlider: {
    paddingVertical: spacingY._20,
  },
});
