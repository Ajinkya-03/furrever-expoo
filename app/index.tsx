import { View, Text, Image, StyleSheet } from 'react-native'
import React, { useEffect } from 'react'
import '@/global.css'
import { colors } from '../constants/themes';
import { useRouter } from 'expo-router';

const index = () => {
  const router = useRouter();
  useEffect(() => {
    setTimeout(() => {
      router.push("/(auth)/welcome")
    }, 2000)

  }, [])

  return (
    <View style={styles.container}>
      <Image resizeMode='contain' style={styles.logo}
        source={require('../assets/Logo.png')} />
    </View>
  )
}

export default index


const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  logo: {
    aspectRatio: 1,
    height: "40%",
  }

})