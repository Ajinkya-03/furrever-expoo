import React, { useRef, useState, useCallback } from "react";
import { Alert, StyleSheet, View, Pressable, KeyboardAvoidingView, Platform, ScrollView, Keyboard } from "react-native";
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
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const isBusy = useRef(false);
  const router = useRouter();
  const { register: registerUser } = useAuth();

  const handleAction = async (action: () => Promise<void>) => {
    if (isBusy.current) return;
    isBusy.current = true;
    try {
      await action();
    } finally {
      setTimeout(() => { isBusy.current = false; }, 800);
    }
  };

  const handleNameChange = (text: string) => {
    setName(text.slice(0, 8));
  };

  const handleSubmit = () => {
    handleAction(async () => {
      const trimmedEmail = email.trim().toLowerCase();
      const trimmedName = name.trim();

      if (!trimmedName || !trimmedEmail || !password.trim()) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert("Sign up", "Please fill all fields to start your journey!");
        return;
      }

      if (password.length < 6) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert("Sign up", "Password must be at least 6 characters.");
        return;
      }

      try {
        setIsLoading(true);
        Keyboard.dismiss();
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        const res = await registerUser(trimmedEmail, password, trimmedName);
        
        if (!res.success) {
          if (res.msg !== "email-already-in-use") {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            
            let errorMessage = "We couldn't create your account right now.";
            const errorStr = res.msg?.toLowerCase() || "";

            if (errorStr.includes("invalid-email")) {
              errorMessage = "Please enter a valid email address.";
            } else if (errorStr.includes("weak-password")) {
              errorMessage = "Your password is too weak. Please use a stronger one.";
            }

            Alert.alert("Sign up", errorMessage);
          }
        }
      } finally {
        setIsLoading(false);
      }
    });
  };

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer} 
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <BackButton iconSize={28} />
          
          <View style={styles.welcomeText}>
            <Typo size={30} fontWeight={"800"}>Let's</Typo>
            <Typo size={30} fontWeight={"800"}>Get Started</Typo>
          </View>

          <View style={styles.form}>
            <Typo size={19} color={colors.textLight}>Create an account</Typo>
            
            <Input
              placeholder="Enter your name (Max 8)"
              value={name}
              maxLength={8}
              onChangeText={handleNameChange}
              icon={<Icons.User size={verticalScale(26)} color={colors.green} weight="fill" />}
            />

            <Input
              placeholder="Enter your email"
              value={email}
              autoCapitalize="none"
              keyboardType="email-address"
              onChangeText={setEmail}
              icon={<Icons.At size={verticalScale(26)} color={colors.green} weight="fill" />}
            />

            <Input
              placeholder="Enter your password"
              value={password}
              secureTextEntry
              onChangeText={setPassword}
              icon={<Icons.Lock size={verticalScale(26)} color={colors.green} weight="fill" />}
            />

            <Button loading={isLoading} onPress={handleSubmit} style={styles.signupButton}>
              <Typo fontWeight={"700"} color={colors.background} size={21}>Sign up</Typo>
            </Button>
          </View>

          <View style={styles.footer}>
            <Typo size={15} color={colors.text}>Already have an account?</Typo>
            <Pressable onPress={() => handleAction(async () => router.push("/(auth)/login"))}>
              <Typo size={15} fontWeight={"700"} color={colors.textLight}>Login</Typo>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
};

export default Register;

const styles = StyleSheet.create({
  scrollContainer: { 
    flexGrow: 1, 
    gap: spacingY._30, 
    paddingHorizontal: spacingX._20,
    paddingBottom: spacingY._30 
  },
  form: { gap: spacingY._20 },
  welcomeText: { marginTop: spacingY._20 },
  footer: { 
    flexDirection: "row", 
    justifyContent: "center", 
    alignItems: "center", 
    gap: 5,
    marginTop: 'auto',
    paddingTop: 20
  },
  signupButton: { alignSelf: "center", width: verticalScale(350), marginTop: spacingY._10 },
});