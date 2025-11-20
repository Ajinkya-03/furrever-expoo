import Header from "@/components/Header";
import ScreenWrapper from "@/components/ScreenWrapper";
import Typo from "@/components/Typo";
import { auth } from "@/config/firebase";
import { colors, radius, spacingX, spacingY } from "@/constants/themes";
import { useAuth } from "@/contexts/AuthContext";
import { getProfileImage } from "@/services/imageService";
import { accountOptionType } from "@/types";
import { verticalScale } from "@/utils/styling";
import { useRoute } from "@react-navigation/native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import * as Icons from "phosphor-react-native";
import React from "react";
import { Alert, StyleSheet, TouchableOpacity, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

const profile = () => {
  const { user } = useAuth();
  const router = useRouter()
  const accountOptions: accountOptionType[] = [
    {
      title: "Edit Profile",
      icon: <Icons.User size={26} color={colors.background} weight="fill" />,
      routeName: "/(modals)/profileModal",
      bgColor: colors.blue,
    },
    {
      title: "Settings",
      icon: <Icons.GearSix size={26} color={colors.background} weight="fill" />,
      // routeName: "/(modals)/profileModal",
      bgColor: colors.lightgreen,
    },
    {
      title: "Privacy Policy",
      icon: <Icons.Lock size={26} color={colors.background} weight="fill" />,
      // routeName: "/(modals)/profileModal",
      bgColor: colors.black,
    },
    {
      title: "Log Out",
      icon: <Icons.Power size={26} color={colors.background} weight="fill" />,
      // routeName: "/(modals)/profileModal",
      bgColor: colors.red,
    },
  ]
  const handleLogout = async () => {
    await signOut(auth)
  }
  const showLogoutAlert = () => {
    Alert.alert("Sure You want to Logout?", "Comeback soon your furrBuddy is waiting", [
      {
        text: "Cancel",
        onPress: () => console.log("Cancel Logout"),
        style: 'cancel'
      },
      {
        text: "Logout",
        onPress: () => handleLogout(),
        style: 'destructive',
      }
    ])
  }
  const handlePress = (item: accountOptionType) => {
    if (item.title == "Log Out") {
      showLogoutAlert();
    }
    if (item.routeName) router.push(item.routeName);
  }
  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <Header title="profile" style={{ marginVertical: spacingY._10 }} />

        <View style={styles.userInfo}>
          <View>
            <Image source={getProfileImage(user?.image)} style={styles.avatar} contentFit="cover" transition={100} />
          </View>

          <View style={styles.nameContainer}>
            <Typo size={24} fontWeight={'600'} color={colors.text}>{user?.name}</Typo>
            <Typo size={15} fontWeight={'600'} color={colors.textLight}>{user?.email}</Typo>
          </View>
        </View>

        <View style={styles.accountOptions}>
          {
            accountOptions.map((item, index) => {
              return (
                <Animated.View
                  key={index.toString()}
                  entering={FadeInDown.delay(index * 50).springify().damping(48)} style={styles.listItem}>
                  <TouchableOpacity style={styles.profileitemButton} onPress={() => handlePress(item)}>
                    <View style={[styles.listIcon, { backgroundColor: item?.bgColor, }]}>
                      {item.icon && item.icon}
                    </View>
                    <Typo size={16} style={{ flex: 1 }} fontWeight={"500"} >
                      {item.title}
                    </Typo>
                    <Icons.CaretRight
                      size={verticalScale(20)} weight="bold" color={colors.green} />
                  </TouchableOpacity>

                </Animated.View>
              )
            })
          }
        </View>
      </View>
    </ScreenWrapper>
  );
};

export default profile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacingX._20,
  },
  userInfo: {
    marginTop: verticalScale(30),
    alignItems: "center",
    gap: spacingY._15,
  },
  nameContainer: {
    gap: verticalScale(4),
    alignItems: "center",
  },
  avatar: {
    alignSelf: "center",
    backgroundColor: colors.primaryDark,
    height: verticalScale(135),
    width: verticalScale(135),
    borderRadius: 200,
    borderColor : colors.primary,
    borderWidth: 1,
  },
  accountOptions: {
    marginTop: spacingY._35,
  },
  listItem: {
    marginBottom: verticalScale(17)
  },
  profileitemButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacingX._10,
  },
  listIcon: {
    height: verticalScale(44),
    width: verticalScale(44),
    backgroundColor: colors.backgroundDark,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius._15,
    borderCurve: "continuous",
  }
});
