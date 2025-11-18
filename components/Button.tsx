import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import React, { Children } from 'react'
import { CustomButtonProps } from '@/types'
import { colors, radius } from '@/constants/themes'
import { verticalScale } from '@/utils/styling'
import Loading from "./Loading"

const Button = ({
    style,
    onPress,
    loading = false,
    children,
}: CustomButtonProps) => {
    if (loading) {
        return (
            <View style={[styles.button, style, { backgroundColor: "transparent" }]}>
                <Loading />
            </View>

        )
    }
    return (
        <TouchableOpacity onPress={onPress} style={[styles.button, style]}>
            {children}
        </TouchableOpacity>
    )
}

export default Button

const styles = StyleSheet.create({
    button: {
        backgroundColor: colors.green,
        borderRadius: radius._17,
        borderCurve: "continuous",
        height: verticalScale(52),
        justifyContent: "center",
        alignItems: "center",
        padding: (10),
        width : verticalScale(280),

    }

})