import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useState, useRef } from 'react';
import { Alert, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View, Animated, Pressable } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { workoutData } from '../globalState';
import { syncWorkoutData } from '@/lib/workout-sync';

// カレンダー日本語化
LocaleConfig.locales['jp'] = {
  monthNames: ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'],
  monthNamesShort: ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'],
  dayNames: ['日曜日','月曜日','火曜日','水曜日','木曜日','金曜日','土曜日'],
  dayNamesShort: ['日','月','火','水','木','金','土'],
  today: '今日'
};
LocaleConfig.defaultLocale = 'jp';

const COLORS = {
  background: '#F5F5F5',
  white: '#FFFFFF',
  text: '#333333',
  grayText: '#757575',
  divider: '#EEEEEE',
  badgeGold: '#FFD700',
};

export default function HomeScreen() {
  const router = useRouter();

  // --- State定義 ---
  const [streakDays, setStreakDays] = useState(workoutData.streakDays);
  const [totalMinutes, setTotalMinutes] = useState(workoutData.totalMinutes);
  const [markedDates, setMarkedDates] = useState(workoutData.markedDates);
  const [currentBadge, setCurrentBadge] = useState(workoutData.equippedBadge);
  const [theme, setTheme] = useState(workoutData.themeColor);
  const [isHoursFormat, setIsHoursFormat] = useState(false);
  const [todayRecords, setTodayRecords] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      speed: 20,
      bounciness: 10,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 10,
    }).start();
  };

  // 画面に戻ってきた時のデータ更新処理
  useFocusEffect(
    useCallback(() => {
      let active = true;
      syncWorkoutData().catch(() => {
        // オフライン時はローカル状態をそのまま表示
      }).finally(() => {
        if (!active) return;
        setStreakDays(workoutData.streakDays);
        setTotalMinutes(workoutData.totalMinutes);
        setMarkedDates({ ...workoutData.markedDates });
        setCurrentBadge(workoutData.equippedBadge);
        setTheme(workoutData.themeColor);

        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        const todayStr = `${y}-${m}-${d}`;

        const filtered = workoutData.records.filter((r) => r.date === todayStr);
        setTodayRecords([...filtered]);
      });

      return () => {
        active = false;
      };
    }, [])
  );

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await syncWorkoutData({ showAlert: true });
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      const todayStr = `${y}-${m}-${d}`;
      setTodayRecords(workoutData.records.filter((r) => r.date === todayStr));
      setStreakDays(workoutData.streakDays);
      setTotalMinutes(workoutData.totalMinutes);
      setMarkedDates({ ...workoutData.markedDates });
    } catch {
      Alert.alert('更新エラー', '最新データの取得に失敗しました。');
    } finally {
      setIsRefreshing(false);
    }
  };

  // AI激励メッセージ生成
  const getAiMessage = (streak: number) => {
    const getNextTarget = (days: number) => {
      if (days < 3) return { next: 3, diff: 3 - days };
      if (days < 7) return { next: 7, diff: 7 - days };
      if (days < 14) return { next: 14, diff: 14 - days };
      if (days < 30) return { next: 30, diff: 30 - days };
      return { next: days + 7, diff: 7 };
    };
    const target = getNextTarget(streak);
    if (streak >= 7) return `素晴らしい継続力です！もはや鉄の意志ですね。\n次の目標「${target.next}日」まであと${target.diff}日、一緒に駆け抜けましょう！`;
    if (streak >= 3) return `3日連続達成！リズムができてきましたね。\n「${target.next}日連続」まであと${target.diff}日です。今日のメニューを相談しましょう！`;
    return `さあ、新しい自分に出会いましょう！\nまずは「3日連続」を目指しましょう！あと${target.diff}日です。`;
  };

  const formatTotalTime = (total: number) => {
    if (!isHoursFormat) return { value: total, unit: ' 分' };
    const h = Math.floor(total / 60);
    const m = total % 60;
    if (h === 0) return { value: m, unit: ' 分' };
    return { value: `${h}時間 ${m}`, unit: '分' }; 
  };

  const timeDisplay = formatTotalTime(totalMinutes);

  const getMarkedDates = () => {
    const marks: any = {};
    Object.keys(markedDates).forEach(date => {
      marks[date] = { selected: true, selectedColor: theme };
    });
    return marks;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: COLORS.white }]}>
      <ScrollView 
        style={{ backgroundColor: COLORS.background }} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
      >
        <Text style={styles.pageTitle}>ホーム</Text>

        <TouchableOpacity 
          style={[styles.aiCard, { borderColor: theme }]} 
          onPress={() => router.push('/ai')} 
          activeOpacity={0.7}
        >
          <View style={styles.aiHeader}>
            <Text style={[styles.aiName, { color: theme }]}>🤖 AIトレーナー</Text>
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>{currentBadge}</Text>
            </View>
          </View>
          <Text style={styles.aiMessage}>{getAiMessage(streakDays)}</Text>
        </TouchableOpacity>

        <View style={styles.summaryContainer}>
          <TouchableOpacity 
            style={styles.summaryCard} 
            activeOpacity={0.6}
            onPress={() => setIsHoursFormat(!isHoursFormat)}
          >
            <Text style={styles.summaryLabel}>累計時間</Text>
            <Text style={styles.summaryValue}>
                {timeDisplay.value}<Text style={styles.summaryUnit}>{timeDisplay.unit}</Text>
            </Text>
            <Text style={styles.guideText}>タップで単位切替</Text>
          </TouchableOpacity>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>連続記録</Text>
            <Text style={[styles.summaryValue, { color: theme }]}>
                {streakDays}<Text style={[styles.summaryUnit, { color: theme }]}> 日</Text>
            </Text>
          </View>
        </View>

        <View style={styles.calendarContainer}>
          <Calendar
            key={`${Object.keys(markedDates).length}-${theme}`}
            markedDates={getMarkedDates()}
            onDayPress={() => {}}
            enableSwipeMonths={false}
            theme={{
              todayTextColor: theme,
              arrowColor: theme,
              selectedDayBackgroundColor: theme,
              selectedDayTextColor: '#ffffff',
              textDayFontWeight: 'bold',
              textMonthFontWeight: 'bold',
              textDayHeaderFontWeight: 'bold',
              calendarBackground: COLORS.white,
            }}
          />
        </View>

        <View style={styles.detailSection}>
          <View style={styles.detailHeader}>
            <Ionicons name="fitness" size={22} color={theme} />
            <Text style={styles.detailDateText}>今日のトレーニング内容</Text>
          </View>

          {todayRecords.length > 0 ? (
            todayRecords.map((item: any, index: number) => {
              // ★ 修正：何が何でも保存されたメニュー名を探し出すロジック
              // globalStateの保存キーが menu, title, workout, name どれでも対応
              const actualMenuName = item.menu || item.title || item.workout || item.name || "トレーニング";
              
              return (
                <TouchableOpacity
                  key={item.recordId || index}
                  style={styles.recordItem}
                  activeOpacity={0.75}
                  onPress={() =>
                    router.push({
                      pathname: '/(tabs)/kiroku',
                      params: {
                        recordId: item.recordId || '',
                        menu: actualMenuName,
                        count: String(item.count || 0),
                        sets: String(item.rounds || 1),
                        mins: String(Math.floor(item.durationSeconds / 60) || item.minutes || 0),
                        secs: String(item.durationSeconds % 60 || 0),
                        memo: item.memo || '',
                        dateStr: item.date?.replace(/-/g, '/') || '',
                        timeStr: item.createdAt ? new Date(item.createdAt).toTimeString().slice(0, 5) : '',
                        mode: 'edit',
                      },
                    })
                  }
                >
                  <View style={[styles.recordAccent, { backgroundColor: theme }]} />
                  <View style={styles.recordInfo}>
                    <View style={styles.recordTopRow}>
                      <Text style={styles.recordTitle}>{actualMenuName}</Text>
                      <Text style={styles.recordTimeBadge}>{item.minutes}分</Text>
                    </View>
                    {item.memo ? (
                      <View style={styles.memoContainer}>
                        <Ionicons name="document-text-outline" size={14} color={COLORS.grayText} />
                        <Text style={styles.recordMemo}>{item.memo}</Text>
                      </View>
                    ) : null}
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>今日の記録はまだありません</Text>
              <Text style={styles.emptySubText}>筋トレを記録してカレンダーを埋めましょう！</Text>
            </View>
          )}
        </View>

        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <Pressable 
            style={[styles.graphButton, { backgroundColor: theme }]} 
            onPress={() => router.push('/graph')}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
          >
            <Ionicons name="stats-chart" size={24} color="#FFF" />
            <Text style={styles.graphButtonText}>トレーニンググラフを見る</Text>
          </Pressable>
        </Animated.View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },
  pageTitle: { fontSize: 28, fontWeight: 'bold', color: COLORS.text, marginBottom: 15 },
  aiCard: { backgroundColor: '#E8F5E9', borderRadius: 15, padding: 15, marginBottom: 20, borderWidth: 2, elevation: 4 },
  aiHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  aiName: { fontSize: 16, fontWeight: 'bold' },
  badgeContainer: { backgroundColor: COLORS.white, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, borderWidth: 1, borderColor: COLORS.badgeGold },
  badgeText: { fontSize: 12, fontWeight: 'bold', color: '#D4AF37' },
  aiMessage: { fontSize: 15, color: COLORS.text, lineHeight: 22, fontWeight: '500' },
  summaryContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  summaryCard: { backgroundColor: COLORS.white, width: '48%', paddingVertical: 18, borderRadius: 15, alignItems: 'center', justifyContent: 'center', elevation: 3 },
  summaryLabel: { fontSize: 13, color: COLORS.grayText, fontWeight: '600', marginBottom: 8 },
  summaryValue: { fontSize: 28, fontWeight: 'bold', color: COLORS.text, textAlign: 'center' },
  summaryUnit: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  guideText: { fontSize: 10, color: COLORS.grayText, marginTop: 4 },
  calendarContainer: { backgroundColor: COLORS.white, borderRadius: 15, padding: 10, marginBottom: 20, elevation: 3 },
  detailSection: { backgroundColor: COLORS.white, borderRadius: 20, padding: 20, elevation: 3, marginBottom: 20 },
  detailHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 15, borderBottomWidth: 1, borderBottomColor: COLORS.divider, paddingBottom: 12 },
  detailDateText: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  recordItem: { flexDirection: 'row', backgroundColor: '#FAFAFA', borderRadius: 12, padding: 15, marginBottom: 12, borderWidth: 1, borderColor: '#F0F0F0' },
  recordAccent: { width: 4, borderRadius: 2, marginRight: 15 },
  recordInfo: { flex: 1 },
  recordTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  recordTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  recordTimeBadge: { fontSize: 12, fontWeight: 'bold', backgroundColor: '#EEE', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, color: COLORS.grayText },
  memoContainer: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, backgroundColor: COLORS.white, padding: 8, borderRadius: 8, marginTop: 4 },
  recordMemo: { fontSize: 13, color: COLORS.grayText, flex: 1, lineHeight: 18 },
  emptyContainer: { paddingVertical: 20, alignItems: 'center' },
  emptyText: { color: COLORS.grayText, fontSize: 14, fontWeight: 'bold' },
  emptySubText: { color: COLORS.grayText, fontSize: 12, marginTop: 4 },
  graphButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, borderRadius: 15, elevation: 3, marginBottom: 20 },
  graphButtonText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold', marginLeft: 10 },
});
