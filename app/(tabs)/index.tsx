import { StyleSheet, View } from "react-native";
import React from "react";
import Typo from "@/components/Typo";
import ScreenWrapper from "@/components/ScreenWrapper";
import Sliders from "@/components/Sliders";
import { useAuth } from "@/contexts/AuthContext";
import { colors, spacingX, spacingY } from "@/constants/themes";
import { verticalScale } from "@/utils/styling";
import { Image } from "react-native";


const DEFAULT_AVATAR = require("../../assets/Avatar.jpg");

const Home = () => {
  const { user } = useAuth();

  const avatarSource = user?.image
    ? { uri: user.image }
    : DEFAULT_AVATAR;

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        {/* --- HEADER CONTENT --- */}
        <View style={styles.header}>
          <View style={{ gap: 4 }}>
            <Typo size={16} color={colors.text}>Hey! Pet lover,</Typo>
            <Typo size={20} color={colors.textLighter} fontWeight={"700"}>{user?.name || "Guest"}</Typo>
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
        {/* Categories */}
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
    fontSize: verticalScale(18),
    paddingHorizontal: spacingX._20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacingY._20,
  },
  avatarContainer: {
    width: verticalScale(50),
    height: verticalScale(50),
    borderRadius: verticalScale(25),
    overflow: 'hidden',
    backgroundColor: colors.primary,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageSlider: {
    paddingVertical: spacingY._20,
  }
});