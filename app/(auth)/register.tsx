import BackButton from "@/components/BackButton";
import Button from "@/components/Button";
import Input from "@/components/Input";
import ScreenWrapper from "@/components/ScreenWrapper";
import Typo from "@/components/Typo";
import { colors, spacingX, spacingY } from "@/constants/themes";
import { useAuth } from "@/contexts/AuthContext";
import { verticalScale } from "@/utils/styling";
import { useRouter } from "expo-router";
import * as Icons from "phosphor-react-native";
import React, { useRef, useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";

const Register = () => {
    const emailRef = useRef("");
    const passwordRef = useRef("");
    const nameRef = useRef("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const { register: registerUser } = useAuth();
    const handleSubmit = async () => {
        if (!emailRef.current || !passwordRef.current || !nameRef.current) {
            Alert.alert("Sign up", "Please fill all the fields");
            return;
        }
        setIsLoading(true);
        const res = await registerUser(
            emailRef.current,
            passwordRef.current,
            nameRef.current
        );
        setIsLoading(false);
        console.log("register result", res);
        if (!res.success) {
            Alert.alert("Sign up", res.msg);
        }
    };
    return (
        <ScreenWrapper>
            <View style={styles.container}>
                <BackButton iconSize={28} />

                <View style={styles.welcomeText}>
                    <Typo size={30} fontWeight={"800"}>Let's</Typo>
                    <Typo size={30} fontWeight={"800"}>Get Started</Typo>
                </View>
                <View style={styles.form}>
                    <Typo size={19} color={colors.textLight}>Create an account</Typo>

                    <Input
                        placeholder="Enter your name"
                        onChangeText={(value) => (nameRef.current = value)}
                        icon={
                            <Icons.User
                                size={verticalScale(26)}
                                color={colors.green}
                                weight="fill"
                            />
                        }
                    />
                    <Input
                        placeholder="Enter your email"
                        onChangeText={(value) => (emailRef.current = value)}
                        icon={
                            <Icons.At
                                size={verticalScale(26)}
                                color={colors.green}
                                weight="fill"
                            />
                        }
                    />
                    <Input
                        placeholder="Enter your password"
                        secureTextEntry
                        onChangeText={(value) => (passwordRef.current = value)}
                        icon={
                            <Icons.Lock
                                size={verticalScale(26)}
                                color={colors.green}
                                weight="fill"
                            />
                        }
                    />
                    <Button
                        loading={isLoading}
                        onPress={handleSubmit}
                        style={styles.signupButton}
                    >
                        <Typo fontWeight={"700"} color={colors.background} size={21}>
                            Sign up
                        </Typo>
                    </Button>
                </View>
                <View style={styles.footer}>
                    <Typo size={15} color={colors.text}>Already have an account?</Typo>
                    <Pressable onPress={() => router.navigate("/(auth)/login")}>
                        <Typo size={15} fontWeight={"700"} color={colors.textLight}>Login</Typo>
                    </Pressable>
                </View>
            </View>
        </ScreenWrapper>
    );
};
export default Register;
const styles = StyleSheet.create({
    container: {
        flex: 1,
        gap: spacingY._30,
        paddingHorizontal: spacingX._20,
    },
    form: {
        gap: spacingY._20,
    },
    welcomeText: {
        fontSize: verticalScale(25),
        fontWeight: "bold",
        marginTop: spacingY._20,
    },
    footer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 5,
    },
    signupButton: {
        alignSelf: "center",
        width: verticalScale(350),
    },
});