import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { onAuthStateChanged } from 'firebase/auth';
import { useEffect } from 'react';
import { LogBox } from 'react-native';
import 'react-native-reanimated';

import { workoutData } from '@/app/globalState';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { auth } from '@/lib/firebase-client';
import { clearGuestSessionMarker, restoreGuestSession } from '@/lib/guest-session';
import { syncWorkoutData } from '@/lib/workout-sync';

LogBox.ignoreAllLogs(true);

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const setupSession = async () => {
        try {
          if (user?.uid) {
            await clearGuestSessionMarker();
            workoutData.setSessionMode('registered');
            workoutData.setUserProfile({ userId: user.uid });
            await syncWorkoutData();
          } else {
            const guestUserId = await restoreGuestSession();
            if (guestUserId) {
              await syncWorkoutData();
            } else {
              workoutData.resetData({ sessionMode: 'logged_out' });
            }
          }
        } catch {
          // Silently ignore startup sync failures.
        }
      };

      void setupSession();
    });

    return unsubscribe;
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
