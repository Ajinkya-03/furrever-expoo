import { View, Text } from "react-native";
import React from "react";
import "@/global.css";
import { Stack } from "expo-router";
import { AuthProvider } from "@/contexts/AuthContext";
import { PetProvider } from "@/contexts/PetContext"; // 👈 import PetProvider

const StackLayout = () => {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* You don’t need to declare index.tsx here unless you want custom options */}
      <Stack.Screen
        name="(tabs)/index"
        options={{
          presentation: "modal",
        }}
      />
    </Stack>
  );
};

export default function RootLayout() {
  return (
    <AuthProvider>
      <PetProvider>
        <StackLayout />
      </PetProvider>
    </AuthProvider>
  );
}
