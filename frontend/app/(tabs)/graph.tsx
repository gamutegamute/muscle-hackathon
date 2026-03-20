import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useMemo, useState } from 'react';
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const COLORS = {
  primaryGreen: '#A4C639',
  background: '#F5F5F5',
  white: '#FFFFFF',
  text: '#333333',
  grayText: '#8E8E93',
};

const DAYS = ['日','月','火','水','木','金','土'];

const GRAPH_HEIGHT = 160;
const MAX_VALUE = 60;
const OFFSET = 25; // 🔥 ここで位置調整

export default function GraphScreen() {
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [streakDays, setStreakDays] = useState(0);

  useFocusEffect(
    useCallback(() => {
      setTotalMinutes(workoutData.totalMinutes || 0);
      setStreakDays(workoutData.streakDays || 0);
    }, [])
  );

  const records = workoutData.records || [];

  const recordMap = useMemo(() => {
    const map: Record<string, number> = {};
    records.forEach(r => {
      const key = new Date(r.date).toISOString().split('T')[0];
      map[key] = (map[key] || 0) + (r.minutes || 0);
    });
    return map;
  }, [records]);

  const days = useMemo(() => {
    const arr = [];
    const today = new Date();
    const day = today.getDay();
    const mondayOffset = (day === 0 ? -6 : 1 - day);

    const start = new Date(today);
    start.setDate(today.getDate() + mondayOffset - 21);

    for (let i = 0; i < 28; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);

      const key = d.toISOString().split('T')[0];

      arr.push({
        date: key,
        minutes: recordMap[key] ?? 0
      });
    }

    return arr;
  }, [recordMap]);

  const weeks = [];
  for (let i = 0; i < 4; i++) {
    weeks.push(days.slice(i * 7, i * 7 + 7));
  }

  const todayStr = new Date().toDateString();

  const gridLines = [];
  for (let i = 0; i <= MAX_VALUE; i += 10) {
    gridLines.push(i);
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>

        <Text style={styles.pageTitle}>トレーニング分析</Text>

        {/* 累計 */}
        <View style={styles.summaryRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>累計時間</Text>
            <Text style={styles.statValue}>
              {totalMinutes}
              <Text style={styles.statUnit}> min</Text>
            </Text>
          </View>
        </View>

        <Text style={styles.chartTitle}>週間アクティビティ</Text>

        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
          {weeks.map((week, wIndex) => (
            <View key={wIndex} style={{ width: SCREEN_WIDTH - 40 }}>
              
              <View style={styles.chartCard}>
                <View style={styles.chartBottomArea}>

                  {/* 🔥 メモリ */}
                  <View style={styles.gridContainer}>
                    {gridLines.map((g, i) => {

                      const y =
                        GRAPH_HEIGHT - (g / MAX_VALUE) * GRAPH_HEIGHT - OFFSET;

                      return (
                        <View key={i}>
                          <View style={[styles.gridLine, { top: y }]} />

                          <Text style={[
                            styles.gridText,
                            { top: y - 6 }
                          ]}>
                            {g}
                          </Text>
                        </View>
                      );
                    })}
                  </View>

                  {/* グラフ */}
                  <View style={styles.barChartContainer}>
                    {week.map((item, index) => {
                      const value = item.minutes ?? 0;

                      const height =
                        (value / MAX_VALUE) * GRAPH_HEIGHT;

                      const dateObj = new Date(item.date);
                      const isToday =
                        dateObj.toDateString() === todayStr;

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
                                    : COLORS.primaryGreen,
                                  opacity: value === 0 ? 0.3 : 1
                                }
                              ]}
                            />
                          </View>

                          <Text style={[
                            styles.dateText,
                            isToday && styles.todayText
                          ]}>
                            {dateObj.getMonth()+1}/{dateObj.getDate()}
                          </Text>

                          <Text style={[
                            styles.dateText,
                            isToday && styles.todayText
                          ]}>
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

        {/* 連続 */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="medal-outline" size={24} color={COLORS.primaryGreen} />
            <Text style={styles.infoTitle}>現在のコンディション</Text>
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoText}>
              現在は <Text style={styles.highlight}>{streakDays}日連続</Text>でトレーニング中です。
              {"\n"}あと少しで実績解除です！
            </Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingHorizontal: 20, paddingTop: 40, paddingBottom: 40 },
  pageTitle: { fontSize: 28, fontWeight: 'bold', marginBottom: 25 },

  summaryRow: { marginBottom: 20 },
  statCard: { backgroundColor: COLORS.white, width: '48%', padding: 20, borderRadius: 20 },
  statLabel: { fontSize: 12, color: COLORS.grayText },
  statValue: { fontSize: 32, fontWeight: 'bold' },

  chartTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },

  chartCard: {
    backgroundColor: COLORS.white,
    borderRadius: 25,
    padding: 20,
    height: 260
  },

  chartBottomArea: {
    flex: 1,
    justifyContent: 'flex-end'
  },

  barChartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: GRAPH_HEIGHT
  },

  barWrapper: {
    alignItems: 'center',
    flex: 1
  },

  barBackground: {
    width: 12,
    height: GRAPH_HEIGHT,
    backgroundColor: '#F0F0F0',
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden'
  },

  barActive: {
    width: '100%',
    borderRadius: 6
  },

  dateText: {
    fontSize: 10,
    color: COLORS.grayText
  },

  todayText: {
    color: '#FF6B6B',
    fontWeight: 'bold'
  },

  gridContainer: {
    position: 'absolute',
    width: '100%',
    height: GRAPH_HEIGHT
  },

  gridLine: {
    position: 'absolute',
    width: '100%',
    height: 1,
    backgroundColor: '#E5E5E5'
  },

  gridText: {
    position: 'absolute',
    left: -10,
    fontSize: 10,
    color: COLORS.grayText
  },

  infoCard: { backgroundColor: COLORS.white, borderRadius: 20, padding: 20, marginTop: 20 },
  infoHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  infoTitle: { fontSize: 16, fontWeight: 'bold' },
  infoContent: { borderLeftWidth: 3, borderLeftColor: COLORS.primaryGreen, paddingLeft: 15 },
  infoText: { fontSize: 14 },
  highlight: { fontWeight: 'bold', color: COLORS.primaryGreen },
});