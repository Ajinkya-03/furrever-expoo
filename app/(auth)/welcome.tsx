import Button from '@/components/Button'
import ScreenWrapper from '@/components/ScreenWrapper'
import Typo from '@/components/Typo'
import { colors, spacingX, spacingY } from '@/constants/themes'
import { verticalScale } from '@/utils/styling'
import { router } from 'expo-router'
import React from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated'
const welcome = () => {
  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <View>
          <TouchableOpacity onPress={()=> router.push('/(auth)/login')} style={styles.loginButton}>
            <Typo fontWeight={"700"} size={20}>Sign in </Typo>
          </TouchableOpacity>
          <Animated.Image
            entering={FadeIn.duration(1000).springify().damping(12)}
            source={require('../../assets/welcomeImage.jpg')}
            style={styles.welcomeImage}
            resizeMode='contain'
          />
        </View>

        <View style={styles.footer}>
          <Animated.View
            entering={FadeIn.duration(1000).springify().damping(12)} style={{ alignItems: 'center' }}>
            <Typo size={30} fontWeight={"800"}>Make pet adoption easier</Typo>
            <Typo size={30} fontWeight={"800"}>
              and Trusted with FurrEver
            </Typo>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(1000).delay(1000).damping(20)} style={{ alignItems: "center", gap: 2 }}>
            <Typo size={17} color={colors.textLight}>Your Furr Buddy is one step away</Typo>
            <Typo size={17} color={colors.textLight}>
              Get verified and authentic pets
            </Typo>
            <Animated.View entering={FadeInDown.duration(1000).delay(200).damping(20)} style={styles.buttonContainer}>
              <Button onPress={()=> router.push('/(auth)/register')}>
                <Typo size={22} color={colors.background} fontWeight={"600"}>
                  Get Started
                </Typo>
              </Button>
            </Animated.View>
          </Animated.View>

        </View>
      </View>
    </ScreenWrapper>
  )
}

export default welcome

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    paddingTop: spacingY._10,

  },
  welcomeImage: {
    width: "100%",
    height: verticalScale(300),
    alignSelf: "center",
    marginTop: verticalScale(100),
  },
  loginButton: {
    alignSelf: "flex-end",
    marginRight: spacingX._30,
  },
  buttonContainer: {
    paddingHorizontal: spacingX._25,
    width: '100%',
    marginTop: spacingY._15,
  },
  footer: {
    backgroundColor: colors.background,
    alignItems: "center",
    paddingTop: verticalScale(30),
    paddingBottom: verticalScale(45),
    gap: spacingY._20,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: -10 },
    elevation: 10,
    shadowRadius: 30,
    shadowOpacity: 0.15,
  }

})