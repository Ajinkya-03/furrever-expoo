import React, { useRef, useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import * as Icons from "phosphor-react-native";
import * as Haptics from 'expo-haptics';

import BackButton from "@/components/BackButton";
import Button from "@/components/Button";
import Input from "@/components/Input";
import ScreenWrapper from "@/components/ScreenWrapper";
import Typo from "@/components/Typo";
import { colors, spacingX, spacingY } from "@/constants/themes";
import { useAuth } from "@/contexts/AuthContext";
import { verticalScale } from "@/utils/styling";

const Register = () => {
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const isSubmitting = useRef(false);
  
  const router = useRouter();
  const { register: registerUser } = useAuth();

  const handleSubmit = async () => {
    if (isSubmitting.current) return;

    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert("Sign up", "Please fill all fields to start your journey!");
      return;
    }

    try {
      isSubmitting.current = true;
      setIsLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const res = await registerUser(formData.email.trim(), formData.password, formData.name.trim());
      
      if (!res.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        
        // --- CUSTOM ERROR MAPPING ---
        let errorMessage = "We couldn't create your account right now.";
        const errorStr = res.msg?.toLowerCase() || "";

        if (errorStr.includes("email-already-in-use")) {
          errorMessage = "This email is already part of our pack! Try logging in.";
        } else if (errorStr.includes("invalid-email")) {
          errorMessage = "Please enter a valid email address.";
        } else if (errorStr.includes("weak-password")) {
          errorMessage = "Your password is too weak. Make it at least 6 characters!";
        } else if (errorStr.includes("network-request-failed")) {
          errorMessage = "Network error. Please check your internet connection.";
        }

        Alert.alert("Sign up", errorMessage);
      }
    } finally {
      setIsLoading(false);
      isSubmitting.current = false;
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
            value={formData.name}
            onChangeText={(v) => setFormData(p => ({...p, name: v}))}
            icon={<Icons.User size={verticalScale(26)} color={colors.green} weight="fill" />}
          />
          <Input
            placeholder="Enter your email"
            autoCapitalize="none"
            value={formData.email}
            onChangeText={(v) => setFormData(p => ({...p, email: v}))}
            icon={<Icons.At size={verticalScale(26)} color={colors.green} weight="fill" />}
          />
          <Input
            placeholder="Enter your password"
            secureTextEntry
            value={formData.password}
            onChangeText={(v) => setFormData(p => ({...p, password: v}))}
            icon={<Icons.Lock size={verticalScale(26)} color={colors.green} weight="fill" />}
          />
          <Button loading={isLoading} onPress={handleSubmit} style={styles.signupButton}>
            <Typo fontWeight={"700"} color={colors.background} size={21}>Sign up</Typo>
          </Button>
        </View>
        <View style={styles.footer}>
          <Typo size={15} color={colors.text}>Already have an account?</Typo>
          <Pressable onPress={() => router.push("/(auth)/login")}>
            <Typo size={15} fontWeight={"700"} color={colors.textLight}>Login</Typo>
          </Pressable>
        </View>
      </View>
    </ScreenWrapper>
  );
};

export default Register;

const styles = StyleSheet.create({
  container: { flex: 1, gap: spacingY._30, paddingHorizontal: spacingX._20 },
  form: { gap: spacingY._20 },
  welcomeText: { marginTop: spacingY._20 },
  footer: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 5 },
  signupButton: { alignSelf: "center", width: verticalScale(350) },
});