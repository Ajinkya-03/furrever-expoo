import { Alert, Pressable, StyleSheet, Text, View } from 'react-native'
import React, { useRef, useState } from 'react'
import ScreenWrapper from '@/components/ScreenWrapper'
import Typo from '@/components/Typo'
import { colors, spacingX, spacingY } from '@/constants/themes'
import BackButton from '@/components/BackButton'
import Input from '@/components/Input'
import * as Icons from 'phosphor-react-native'
import { verticalScale } from '@/utils/styling'
import Button from '@/components/Button'
import { useRouter } from 'expo-router'

const Login = () => {

    const emailRef = useRef("");
    const passwordRef = useRef("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter()
    const handleSubmit = async () => {
        if(!emailRef.current || !passwordRef.current){
            Alert.alert('Login', "Please fill all the fields")
            return;
        }
        console.log('email : ',emailRef.current)
        console.log('password : ',passwordRef.current)
        console.log("User Verified go ahead")

    }
    return (
        <ScreenWrapper>
            <View style={styles.container}>
                <BackButton iconSize={28} />
                <View style={styles.welcomeText}>
                    <Typo size={30} fontWeight={"800"} >
                        Hey Pet Lover,
                    </Typo>
                    <Typo size={30} fontWeight={"800"}>
                        Welcome Back
                    </Typo>
                </View>

                {/* Login Form  */}
                <View style={styles.form}>
                    <Typo size={19} color={colors.textLight}>
                        Let's begin your Pet Adoption journey
                    </Typo>
                    <Input
                        placeholder='Enter your email'
                        onChangeText={value => (emailRef.current = value)}
                        icon={<Icons.At size={verticalScale(26)} color={colors.green} weight='fill' />}
                    />
                    <Input
                        placeholder='Enter your password'
                        secureTextEntry
                        onChangeText={value => (passwordRef.current = value)}
                        icon={<Icons.Lock size={verticalScale(26)} color={colors.green} weight='fill' />}
                    />
                    <Typo size={14} color={colors.text} style={styles.forgotPassword}>
                        Forgot Password?
                    </Typo>

                    <Button loading={isLoading} onPress={handleSubmit} style={styles.loginButton}>
                        <Typo fontWeight={"700"} color={colors.background} size={21}>Login</Typo>
                    </Button>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Typo size={15} color={colors.text} >Don't have an Account?</Typo>
                    <Pressable onPress={()=> router.push('/(auth)/register')}>
                        <Typo size={15} fontWeight={"700"} color={colors.textLight}>
                            Sign up
                        </Typo>
                    </Pressable>
                </View>
            </View>
        </ScreenWrapper>
    )
}

export default Login

const styles = StyleSheet.create({
    container: {
        flex: 1,
        gap: spacingY._30,
        paddingHorizontal: spacingX._20,
    },
    form: {
        gap: spacingY._20,
    },
    welcomeText:{
        fontSize: verticalScale(25),
        fontWeight:"bold",
        marginTop: spacingY._20,
    },
    footer:{
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 5,
    },
    forgotPassword:{
        textAlign: 'right',
        fontWeight : "500",
        color: colors.text,
    },
    loginButton:{
        alignSelf: "center",
        width: verticalScale(350),
    }

}) 