import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
// ★ アプリ全体のデータ（脳）を読み込む
import { workoutData } from '../globalState';

// カレンダーの日本語化
LocaleConfig.locales['jp'] = {
  monthNames: ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'],
  monthNamesShort: ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'],
  dayNames: ['日曜日','月曜日','火曜日','水曜日','木曜日','金曜日','土曜日'],
  dayNamesShort: ['日','月','火','水','木','金','土'],
  today: '今日'
};
LocaleConfig.defaultLocale = 'jp';

const COLORS = {
  primaryGreen: '#A4C639',
  background: '#F5F5F5',
  white: '#FFFFFF',
  text: '#333333',
  grayText: '#757575',
  aiBackground: '#E8F5E9',
  badgeGold: '#FFD700',
};

export default function HomeScreen() {
  const router = useRouter();

  // --- State定義 ---
  const [streakDays, setStreakDays] = useState(workoutData.streakDays);
  const [totalMinutes, setTotalMinutes] = useState(workoutData.totalMinutes);
  const [markedDates, setMarkedDates] = useState(workoutData.markedDates);
  
  // ★ 称号管理：globalState の「装備中（equippedBadge）」を直接参照
  const [currentBadge, setCurrentBadge] = useState(workoutData.equippedBadge);

  // ★ 画面にフォーカスが当たった（戻ってきた）時の更新処理
  useFocusEffect(
    useCallback(() => {
      setStreakDays(workoutData.streakDays);
      setTotalMinutes(workoutData.totalMinutes);
      setMarkedDates({ ...workoutData.markedDates });
      
      // ★ ここが肝心：設定画面で変更された「装備中の称号」を読み直す
      setCurrentBadge(workoutData.equippedBadge);
    }, [])
  );

  // AIメッセージの生成
  const getAiMessage = (streak: number) => {
    if (streak >= 7) return '素晴らしい継続力です！もはや鉄の意志ですね。\n今日のメニューを一緒に考えましょう！';
    if (streak >= 3) return '3日連続達成！リズムができてきましたね。\n次の一歩を相談しましょう！';
    return 'さあ、新しい自分に出会う準備はできていますか？\n今日のプランを相談しましょう！';
  };

  const currentMessage = getAiMessage(streakDays);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: COLORS.white }]}>
      <ScrollView 
        style={{ backgroundColor: COLORS.background }} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>ホーム</Text>

        {/* AIトレーナー相談カード */}
        <TouchableOpacity 
          style={styles.aiCard} 
          onPress={() => router.push('/ai')} 
          activeOpacity={0.7}
        >
          <View style={styles.aiHeader}>
            <Text style={styles.aiName}>🤖 AIトレーナー</Text>
            
            {/* ★ 称号表示：設定画面で選んだものがここに表示されます */}
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>{currentBadge}</Text>
            </View>
          </View>
          <Text style={styles.aiMessage}>{currentMessage}</Text>
        </TouchableOpacity>

        {/* 記録サマリー */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>累計時間</Text>
            <Text style={styles.summaryValue}>
                {totalMinutes}
                <Text style={styles.summaryUnit}> 分</Text>
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>連続記録</Text>
            <Text style={styles.summaryValue}>
                {streakDays}
                <Text style={styles.summaryUnit}> 日</Text>
            </Text>
          </View>
        </View>

        {/* カレンダー表示 */}
        <View style={styles.calendarContainer}>
          <Calendar
            markedDates={markedDates}
            theme={{
              todayTextColor: COLORS.primaryGreen,
              arrowColor: COLORS.primaryGreen,
              selectedDayBackgroundColor: COLORS.primaryGreen,
              textDayFontWeight: '500',
              textMonthFontWeight: 'bold',
              textDayHeaderFontWeight: 'bold',
            }}
          />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },
  pageTitle: { fontSize: 28, fontWeight: 'bold', color: COLORS.text, marginBottom: 15 },
  aiCard: { 
    backgroundColor: COLORS.aiBackground, 
    borderRadius: 15, 
    padding: 15, 
    marginBottom: 20, 
    borderWidth: 1, 
    borderColor: '#C8E6C9', 
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  aiHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  aiName: { fontSize: 16, fontWeight: 'bold', color: COLORS.primaryGreen },
  badgeContainer: { 
    backgroundColor: COLORS.white, 
    paddingHorizontal: 10, 
    paddingVertical: 5, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: COLORS.badgeGold 
  },
  badgeText: { fontSize: 12, fontWeight: 'bold', color: '#D4AF37' },
  aiMessage: { fontSize: 15, color: COLORS.text, lineHeight: 22, fontWeight: '500' },
  summaryContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  summaryCard: { 
    backgroundColor: COLORS.white, 
    width: '48%', 
    paddingVertical: 20, 
    borderRadius: 15, 
    alignItems: 'center', 
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  summaryLabel: { fontSize: 14, color: COLORS.grayText, fontWeight: '600', marginBottom: 5 },
  summaryValue: { fontSize: 32, fontWeight: 'bold', color: COLORS.text },
  summaryUnit: { fontSize: 16, fontWeight: 'normal' },
  calendarContainer: { 
    backgroundColor: COLORS.white, 
    borderRadius: 15, 
    padding: 10, 
    marginBottom: 30, 
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
});