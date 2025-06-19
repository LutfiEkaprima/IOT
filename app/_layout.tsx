import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { SettingsProvider, useSettings } from '@/contexts/SettingsContext';
import { useNotificationPermissions } from '@/hooks/useNotificationPermissions';
import { LoadingScreen } from '@/components/LoadingScreen';

function AppContent() {
  const { isLoading } = useSettings();
  useNotificationPermissions();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="light" />
    </>
  );
}

export default function RootLayout() {
  useFrameworkReady();

  return (
    <SettingsProvider>
      <AppContent />
    </SettingsProvider>
  );
}