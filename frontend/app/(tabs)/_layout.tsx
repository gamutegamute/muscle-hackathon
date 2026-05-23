import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router'; 
import React, { useState, useEffect } from 'react';
// ★ 共通データ（脳）を読み込む
import { workoutData } from '../globalState';

export default function TabLayout() {
  // ★ 1. タブバーの色を管理するState
  const [theme, setTheme] = useState(workoutData.themeColor);

  useEffect(() => {
    // ★ 2. 脳みそに「色が変わったら教えて！」と予約（サブスクライブ）を入れる
    // 設定画面で setThemeColor が呼ばれると、この中の関数が即座に実行されます
    const unsubscribe = workoutData.subscribeColor((newColor) => {
      setTheme(newColor); // リアルタイムに色を更新！
    });

    // 画面が消える（アプリ終了など）時に予約を解除してメモリを節約
    return () => unsubscribe();
  }, []); 

  return (
    <Tabs
      screenOptions={{
        // ★ 3. 選択されているタブの色をテーマカラーに連動
        tabBarActiveTintColor: theme,
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: { 
          height: 65, 
          paddingBottom: 10, 
          paddingTop: 5,
          borderTopWidth: 1,
          borderTopColor: '#E0E0E0',
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'ホーム',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="ai"
        options={{
          title: 'AI相談',
          tabBarIcon: ({ color, size }) => <Ionicons name="chatbubble-ellipses" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="kiroku"
        options={{
          title: '記録',
          tabBarIcon: ({ color, size }) => <Ionicons name="add-circle" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          title: 'フレンド',
          tabBarIcon: ({ color, size }) => <Ionicons name="people" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settei"
        options={{
          title: '設定',
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}