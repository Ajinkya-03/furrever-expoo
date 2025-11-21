import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { BackButtonProps } from '@/types'
import { router, useRouter } from 'expo-router'
import { CaretLeftIcon } from 'phosphor-react-native'
import { verticalScale } from '@/utils/styling'
import { colors, radius } from '@/constants/themes'

const BackButton = ({
    style,
    iconSize = 26,
}: BackButtonProps) => {
    return (
        <TouchableOpacity onPress={()=>  router.back()} style={[styles.button, style]}>
            <CaretLeftIcon size={verticalScale(iconSize)} color={colors.background} weight="bold" />
        </TouchableOpacity>
    )
}

export default BackButton

const styles = StyleSheet.create({
    button:{ 
        borderRadius: radius._12,
        borderCurve: "continuous",
        alignSelf:'flex-start',
        backgroundColor: colors.green,
        padding: 5,
    },
})