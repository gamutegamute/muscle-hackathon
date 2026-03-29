import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState, useEffect, useRef } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Dimensions,
  TouchableOpacity,
  Alert
} from 'react-native';
import { workoutData } from '../globalState';
import { syncWorkoutData } from '@/lib/workout-sync';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const COLORS = {
  background: '#F5F5F5',
  white: '#FFFFFF',
  text: '#333333',
  grayText: '#8E8E93',
};

const DAYS = ['日','月','火','水','木','金','土'];

const GRAPH_HEIGHT = 160;
const OFFSET = 25;

export default function GraphScreen() {
  const router = useRouter();

  const scrollRef = useRef<ScrollView>(null);

  // テーマカラー
  const [theme, setTheme] = useState(workoutData.themeColor);

  useEffect(() => {
    const unsubscribe = workoutData.subscribeColor((color: string) => {
      setTheme(color);
    });
    return () => unsubscribe && unsubscribe();
  }, []);

  const [totalMinutes, setTotalMinutes] = useState(0);
  const [streakDays, setStreakDays] = useState(0);
  const [todayStr, setTodayStr] = useState('');

  const getLocalDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  useFocusEffect(
    useCallback(() => {
      let active = true;
      syncWorkoutData().catch(() => {
        // フォールバックでローカル値を利用
      }).finally(() => {
        if (!active) return;
        setTotalMinutes(workoutData.totalMinutes || 0);
        setStreakDays(workoutData.streakDays || 0);
        setTodayStr(getLocalDate(new Date()));
      });
      return () => {
        active = false;
      };
    }, [])
  );

  useEffect(() => {
    const interval = setInterval(() => {
      const now = getLocalDate(new Date());
      setTodayStr(prev => (prev !== now ? now : prev));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const recordMap: Record<string, number> = {};
  workoutData.records.forEach((record) => {
    recordMap[record.date] = (recordMap[record.date] || 0) + (record.minutes || 0);
  });

  const days = [];
  const today = new Date();
  const day = today.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;

  const start = new Date(today);
  start.setDate(today.getDate() + mondayOffset - 21);

  for (let i = 0; i < 28; i++) {
    const currentDate = new Date(start);
    currentDate.setDate(start.getDate() + i);

    const key = getLocalDate(currentDate);

    days.push({
      date: key,
      minutes: recordMap[key] ?? 0,
    });
  }

  const weeks = [];
  for (let i = 0; i < 4; i++) {
    weeks.push(days.slice(i * 7, i * 7 + 7));
  }

  // メモリ調整
  const getNiceStep = (max: number) => {
    const roughStep = max / 5;
    const pow = Math.pow(10, Math.floor(Math.log10(roughStep)));
    const digit = roughStep / pow;

    let niceDigit;
    if (digit < 1.5) niceDigit = 1;
    else if (digit < 3) niceDigit = 2;
    else if (digit < 7) niceDigit = 5;
    else niceDigit = 10;

    return niceDigit * pow;
  };

  const max = Math.max(...days.map(d => d.minutes), 10);
  const MAX_VALUE = Math.ceil(max / getNiceStep(max)) * getNiceStep(max);

  const STEP = getNiceStep(MAX_VALUE);

  const gridLines = [];
  for (let i = 0; i <= MAX_VALUE; i += STEP) {
    gridLines.push(i);
  }

  useEffect(() => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({
        x: (SCREEN_WIDTH - 40) * 3,
        animated: false
      });
    }, 100);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>

        <Text style={[styles.pageTitle, { color: theme }]}>
          トレーニング分析
        </Text>

        <View style={styles.summaryRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>累計時間</Text>
            <Text style={[styles.statValue, { color: theme }]}>
              {totalMinutes}
              <Text style={styles.statLabel}> 分</Text>
            </Text>
          </View>
        </View>

        <Text style={[styles.chartTitle, { color: theme }]}>
          週間アクティビティ
        </Text>

        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
        >
          {weeks.map((week, wIndex) => (
            <View key={wIndex} style={{ width: SCREEN_WIDTH - 40 }}>
              
              <View style={styles.chartCard}>
                <View style={styles.chartBottomArea}>

                  <View style={styles.gridContainer}>
                    {gridLines.map((g, i) => {
                      const y =
                        GRAPH_HEIGHT - (g / MAX_VALUE) * GRAPH_HEIGHT;

                      return (
                        <View key={i}>
                          <View style={[styles.gridLine, { top: y }]} />
                          <Text style={[styles.gridText, { top: y - 6 , left: -10}]}>
                            {Math.round(g)}
                          </Text>
                        </View>
                      );
                    })}
                  </View>

                  <View style={styles.barChartContainer}>
                    {week.map((item, index) => {
                      const value = item.minutes ?? 0;
                      const height = (value / MAX_VALUE) * GRAPH_HEIGHT;
                      const isToday = item.date === todayStr;
                      const dateObj = new Date(item.date);

                      return (
                        <TouchableOpacity
                          key={index}
                          style={styles.barWrapper}
                          onPress={() =>
                            Alert.alert(
                              `${dateObj.getMonth()+1}/${dateObj.getDate()}`,
                              `${value}分`
                            )
                          }
                        >
                          <View style={styles.barBackground}>
                            <View
                              style={[
                                styles.barActive,
                                {
                                  height: Math.max(height, 2),
                                  backgroundColor: isToday
                                    ? '#FF6B6B'
                                    : theme,
                                  opacity: value === 0 ? 0.3 : 1
                                }
                              ]}
                            />
                          </View>

                          <Text style={[styles.dateText, isToday && styles.todayText]}>
                            {dateObj.getMonth()+1}/{dateObj.getDate()}
                          </Text>

                          <Text style={[styles.dateText, isToday && styles.todayText]}>
                            {DAYS[dateObj.getDay()]}
                          </Text>

                        </TouchableOpacity>
                      );
                    })}
                  </View>

                </View>
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="medal-outline" size={24} color={theme} />
            <Text style={[styles.infoTitle, { color: theme }]}>
              現在のコンディション
            </Text>
          </View>
          <View style={[styles.infoContent, { borderLeftColor: theme }]}>
            <Text style={styles.infoText}>
              現在は <Text style={[styles.highlight, { color: theme }]}>
                {streakDays}日連続
              </Text>でトレーニング中です。
              {"\n"}あと少しで実績解除です！
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.historyCard}
          activeOpacity={0.8}
          onPress={() => router.push('/records_history')}
        >
          <View style={styles.infoHeader}>
            <Ionicons name="list-outline" size={24} color={theme} />
            <Text style={[styles.infoTitle, { color: theme }]}>
              記録一覧
            </Text>
          </View>
          <View style={styles.historyLinkRow}>
            <Text style={styles.historyLinkText}>
              過去の記録を一覧で見て、編集できます
            </Text>
            <Ionicons name="chevron-forward" size={20} color={theme} />
          </View>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { padding: 20 },

  pageTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },

  summaryRow: { marginBottom: 20 },

  statCard: {
    backgroundColor: COLORS.white,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },

  statLabel: { color: COLORS.grayText },

  statValue: { fontSize: 28, fontWeight: 'bold' },

  chartTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },

  chartCard: { 
    backgroundColor: COLORS.white, 
    borderRadius: 20, 
    padding: 20,
    height: 215,
 },

  chartBottomArea: { height: GRAPH_HEIGHT + 40 },

  gridContainer: { position: 'absolute', width: '100%', height: '100%' },

  gridLine: {
    position: 'absolute',
    width: '100%',
    height: 1,
    backgroundColor: '#ddd',
  },

  gridText: {
    position: 'absolute',
    fontSize: 11,
    color: COLORS.grayText,
  },

  barChartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: GRAPH_HEIGHT,
    marginTop: OFFSET,
  },

  barWrapper: {
    alignItems: 'center',
    width: 24,
  },

  barBackground: {
    width: 14,
    height: GRAPH_HEIGHT,
    backgroundColor: '#eee',
    justifyContent: 'flex-end',
    borderRadius: 6,
  },

  barActive: {
    width: '100%',
    borderRadius: 6,
  },

  dateText: {
    fontSize: 10,
    color: COLORS.grayText,
  },

  todayText: {
    fontWeight: 'bold',
  },

  infoCard: {
    marginTop: 20,
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
  },

  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  infoTitle: {
    marginLeft: 8,
    fontWeight: 'bold',
  },

  infoContent: {
    borderLeftWidth: 4,
    paddingLeft: 10,
  },

  infoText: {
    color: COLORS.text,
  },

  highlight: {
    fontWeight: 'bold',
  },

  historyCard: {
    marginTop: 20,
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
  },

  historyLinkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },

  historyLinkText: {
    flex: 1,
    color: COLORS.grayText,
    fontSize: 13,
  },
});
