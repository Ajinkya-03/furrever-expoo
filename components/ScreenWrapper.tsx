import { View, Text, StyleSheet, Platform, Dimensions, StatusBar } from 'react-native'
import React from 'react'
import { ScreenWrapperProps } from '@/types'
import { colors } from '@/constants/themes'
const { height } = Dimensions.get('window')
const ScreenWrapper = ({ style, children }: ScreenWrapperProps) => {
    let paddingTop = Platform.OS == 'android' || Platform.OS == 'ios' ? height * 0.10 : 50
    return (
        <View style={[{
            paddingTop,
            flex: 1, 
            backgroundColor: colors.background
        }, style]}>
            <StatusBar barStyle="light-content"/>
            {children}
        </View>
    )
}
export default ScreenWrapper