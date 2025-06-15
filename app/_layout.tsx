import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { useNotificationPermissions } from '@/hooks/useNotificationPermissions'; // Impor hook baru

export default function RootLayout() {
  useFrameworkReady();
  useNotificationPermissions(); // Gunakan hook di sini

  return (
    <SettingsProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="light" />
    </SettingsProvider>
  );
}