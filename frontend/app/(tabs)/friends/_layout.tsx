import { Stack } from 'expo-router';
import React from 'react';
import { useColorScheme } from 'react-native';
import { workoutData } from '../../globalState';

export default function FriendsLayout() {
  const isDark = useColorScheme() === 'dark';
  const themeColor = workoutData.themeColor || '#A4C639';

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' },
        headerTintColor: themeColor,
        headerTitleStyle: { fontWeight: 'bold', color: isDark ? '#FFFFFF' : '#333333' },
        headerBackVisible: false,
      }}
    >
      <Stack.Screen name="index" options={{ title: 'フレンド', headerShadowVisible: false }} />
      <Stack.Screen name="[id]" options={{ title: 'フレンド詳細', headerShadowVisible: false }} />
      <Stack.Screen name="search" options={{ title: 'フレンド検索', presentation: 'modal' }} />
      <Stack.Screen name="requests" options={{ title: 'フレンド申請', presentation: 'modal' }} />
      <Stack.Screen name="ranking" options={{ title: 'ランキング', presentation: 'modal', headerShadowVisible: false }} />
    </Stack>
  );
}
