import { LogBox } from 'react-native';

// すべての黄色い警告メッセージを画面に出さないようにする魔法
LogBox.ignoreAllLogs(true);
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { workoutData } from './globalState';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
const theme = workoutData.themeColor; // 現在のテーマ色
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      {/* ★ screenOptions={{ headerShown: false }} を追加しました。
        これで index や profile の上部に出ていた文字がすべて消えます！
      */}
      <Stack screenOptions={{ headerShown: false }}>
        {/* タブバーのあるメイン画面群 */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        
        {/* モーダル画面が必要な場合の設定（一応残してあります） */}
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        
        {/* 個別で設定を書かなくても、上の screenOptions ですべて非表示になりますが、
          明示的に管理したい場合はここに行を追加していきます。
        */}
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}