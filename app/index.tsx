import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { colors } from '../constants/themes';

const RootIndex = () => {
  return (
    <View style={styles.container}>
      <Image 
        contentFit='contain' 
        style={styles.logo}
        source={require('../assets/Logo.png')}
        transition={300}
      />
    </View>
  );
};

export default RootIndex;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  logo: {
    width: "60%",
    aspectRatio: 1,
  }
});