
import React from "react";
import { Stack } from "expo-router";
import { AuthProvider } from "@/contexts/AuthContext";
import { PetProvider } from "@/contexts/PetContext";
import { AdoptionProvider } from "@/contexts/AdoptionContext";
import { ChatProvider } from "@/contexts/chatContext";

const StackLayout = () => {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade_from_bottom' }}>
      <Stack.Screen name="(tabs)" />
      
      {/* Modal Configurations */}
      <Stack.Screen 
        name="(modals)/applicationsModal" 
        options={{ presentation: 'modal' }} 
      />
      <Stack.Screen 
        name="(modals)/chatScreenModal" 
        options={{ 
          presentation: 'transparentModal',
          animation: 'slide_from_bottom',
          gestureEnabled: true 
        }} 
      />
      <Stack.Screen 
        name="(modals)/profileModal" 
        options={{ presentation: 'modal' }} 
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
