import React, { useRef, useState } from "react";
import { 
  Alert, 
  Pressable, 
  StyleSheet, 
  TouchableOpacity, 
  View, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  Keyboard 
} from "react-native";
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

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const isSubmitting = useRef(false);
  
  const router = useRouter();
  const { login: loginUser } = useAuth();

  const handleLogin = async () => {
    if (isSubmitting.current) return;

    if (!formData.email.trim() || !formData.password.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert("Login", "Please enter both email and password to continue.");
      return;
    }

    try {
      isSubmitting.current = true;
      setIsLoading(true);
      Keyboard.dismiss(); // Dismiss keyboard on submit for better UX
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const res = await loginUser(formData.email.trim(), formData.password);
      
      if (!res.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        
        let errorMessage = "Something went wrong. Please try again.";
        const errorStr = res.msg?.toLowerCase() || "";

        // --- SPECIALIZED PASSWORD & CREDENTIAL ERROR HANDLING ---
        if (errorStr.includes("wrong-password") || errorStr.includes("invalid-credential")) {
          errorMessage = "Incorrect password. Please check your credentials and try again!";
        } else if (errorStr.includes("user-not-found")) {
          errorMessage = "No account found with this email. Time to create one?";
        } else if (errorStr.includes("too-many-requests")) {
          errorMessage = "Too many failed attempts. Try again in a few minutes.";
        }

        Alert.alert('Login Failed', errorMessage);
      }
    } finally {
      setIsLoading(false);
      isSubmitting.current = false;
    }
  };

  return (
    <ScreenWrapper>
      {/* KeyboardAvoidingView handles the UI shift when typing.
        behavior="padding" is usually best for iOS, while "height" or nothing works for Android.
      */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <BackButton iconSize={28} />
          
          <View style={styles.welcomeText}>
            <Typo size={30} fontWeight={"800"}>Hey Pet Lover,</Typo>
            <Typo size={30} fontWeight={"800"}>Welcome Back</Typo>
          </View>

          <View style={styles.form}>
            <Typo size={19} color={colors.textLight}>
              Let's begin your Pet Adoption journey
            </Typo>

            <Input
              placeholder="Enter your email"
              autoCapitalize="none"
              keyboardType="email-address"
              value={formData.email}
              onChangeText={(v) => setFormData(prev => ({...prev, email: v}))}
              icon={<Icons.At size={verticalScale(26)} color={colors.green} weight="fill" />}
            />

            <Input
              placeholder="Enter your password"
              secureTextEntry
              value={formData.password}
              onChangeText={(v) => setFormData(prev => ({...prev, password: v}))}
              icon={<Icons.Lock size={verticalScale(26)} color={colors.green} weight="fill" />}
            />

            <TouchableOpacity 
              onPress={() => {}} 
              activeOpacity={0.7} 
              style={styles.forgotPasswordContainer}
            >
              <Typo size={14} color={colors.text} style={styles.forgotPasswordText}>
                Forgot Password?
              </Typo>
            </TouchableOpacity>

            <Button
              loading={isLoading}
              onPress={handleLogin}
              style={styles.loginButton}
            >
              <Typo fontWeight={"700"} color={colors.background} size={21}>
                Login
              </Typo>
            </Button>
          </View>

          <View style={styles.footer}>
            <Typo size={15} color={colors.text}>Don't have an Account?</Typo>
            <Pressable onPress={() => router.push("/(auth)/register")}>
              <Typo size={15} fontWeight={"700"} color={colors.textLight}>Sign up</Typo>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
};

export default Login;

const styles = StyleSheet.create({
  scrollContainer: { 
    flexGrow: 1, 
    gap: spacingY._30, 
    paddingHorizontal: spacingX._20,
    paddingBottom: spacingY._30 // Added padding to ensure footer is reachable
  },
  form: { gap: spacingY._20 },
  welcomeText: { marginTop: spacingY._20 },
  footer: { 
    flexDirection: "row", 
    justifyContent: "center", 
    alignItems: "center", 
    gap: 5,
    marginTop: 'auto', // Pushes footer to bottom if screen is tall
    paddingTop: 20
  },
  forgotPasswordContainer: { alignSelf: "flex-end" },
  forgotPasswordText: { fontWeight: "500" },
  loginButton: { 
    alignSelf: "center", 
    width: verticalScale(350),
    marginTop: spacingY._10 
  },
});