import { View, Text } from "react-native";
import React from "react";
import "@/global.css";
import { Stack } from "expo-router";
import { AuthProvider } from "@/contexts/AuthContext";
import { PetProvider } from "@/contexts/PetContext";
import { AdoptionProvider } from "@/contexts/AdoptionContext";
import { ChatProvider } from "@/contexts/chatContext"; // Added ChatProvider

const StackLayout = () => {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Main Tab Navigation */}
      <Stack.Screen
        name="(tabs)"
        options={{
          headerShown: false,
        }}
      />

      {/* Adoption Applications Modal */}
      <Stack.Screen 
        name="(modals)/applicationsModal" 
        options={{ 
          presentation: 'modal',
          animation: 'slide_from_bottom' 
        }} 
      />

      {/* Chat Screen Modal */}
      <Stack.Screen 
        name="(modals)/chatScreenModal" 
        options={{ 
          presentation: 'modal',
          animation: 'slide_from_bottom',
          gestureEnabled: true // Allows swiping down to close
        }} 
      />
    </Stack>
  );
};

export default function RootLayout() {
  return (
    <AuthProvider>
      <PetProvider>
        <AdoptionProvider>
          <ChatProvider> 
            <StackLayout />
          </ChatProvider>
        </AdoptionProvider>
      </PetProvider>
    </AuthProvider>
  );
}