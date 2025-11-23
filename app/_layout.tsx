import { View, Text } from 'react-native'
import React from 'react'
import '@/global.css'
import { Stack } from 'expo-router'
import { AuthProvider } from '@/contexts/AuthContext'

const StackLayout = () => {
  return <Stack screenOptions={{ headerShown: false }}>
    <Stack.Screen name="(tabs)/index.tsx"
      options={{
        presentation: "modal",
      }}
    />
  </Stack>
};
export default function RooLayout() {
  return (
    <AuthProvider>
      <StackLayout />
    </AuthProvider>
  )
}
