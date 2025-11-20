import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import ScreenWrapper from '@/components/ScreenWrapper'
import ModalWrapper from '@/components/ModalWrapper'
import Header from '@/components/Header'
import BackButton from '@/components/BackButton'
import { colors, spacingY } from '@/constants/themes'
import { Image } from 'expo-image'
import { getProfileImage } from '@/services/imageService'
import { verticalScale } from '@/utils/styling'
import * as Icons from "phosphor-react-native"
const profileModal = () => {
  return (
    <ModalWrapper>
      <View style={styles.container}>
        <Header title='Update Profile' leftIcon={<BackButton />} style={{ marginBottom: spacingY._10 }} />
        <ScrollView contentContainerStyle={styles.form}>
          <View style={styles.avatarContainer}>
            <Image style={styles.avatar} source={getProfileImage(null)} contentFit='cover' transition={100} />
            <TouchableOpacity style={styles.editIcon}>
              <Icons.Pencil size={verticalScale(20)}
                color={colors.background} />
            </TouchableOpacity>
          </View>

        </ScrollView>

      </View>
    </ModalWrapper>
  )
}
export default profileModal
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: spacingY._20,
  },
  avatarContainer: {
    position: 'relative',
    alignSelf: "center",
  },
  form: {
    gap: spacingY._30,
    marginTop: spacingY._15,
  },
  avatar: {
    alignSelf: 'center',
    backgroundColor: colors.backgroundDark,
    height: verticalScale(135),
    width: verticalScale(135),
    borderRadius: 200,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  editIcon: {
    position: 'absolute',
    bottom: spacingY._5,
    right: spacingY._7,
    borderRadius: 100,
    backgroundColor: colors.primary,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
    padding: spacingY._7,
  }
})