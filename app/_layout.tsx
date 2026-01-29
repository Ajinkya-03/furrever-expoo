import React from "react";
import { Stack } from "expo-router";
import { AuthProvider } from "@/contexts/AuthContext";
import { PetProvider } from "@/contexts/PetContext";
import { AdoptionProvider } from "@/contexts/AdoptionContext";
import { CertificateProvider } from "@/contexts/certificationContext"; // New Provider
import { ChatProvider } from "@/contexts/chatContext";
import VerificationGateway from "@/app/(modals)/verificationGateway";

const StackLayout = () => {
  return (
    <>
      <Stack screenOptions={{ headerShown: false, animation: 'fade_from_bottom' }}>
        <Stack.Screen name="(tabs)" />
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
        <Stack.Screen 
          name="(modals)/adoptionHistoryModal" 
          options={{ presentation: 'modal' }} 
        />
      </Stack>
      
      {/* This component must be here to act as a global gatekeeper */}
      <VerificationGateway />
    </>
  );
};

export default function RootLayout() {
  return (
    <AuthProvider>
      <PetProvider>
        <AdoptionProvider>
          {/* CertificateProvider added to the chain */}
          <CertificateProvider>
            <ChatProvider> 
              <StackLayout />
            </ChatProvider>
          </CertificateProvider>
        </AdoptionProvider>
      </PetProvider>
    </AuthProvider>
  );
}