import { View, Text } from "react-native";
import React from "react";
import "@/global.css";
import { Stack } from "expo-router";
import { AuthProvider } from "@/contexts/AuthContext";
import { PetProvider } from "@/contexts/PetContext";

const StackLayout = () => {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="(tabs)"
        options={{
          headerShown: false,
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
