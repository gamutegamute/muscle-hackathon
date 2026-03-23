import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { workoutData } from './globalState';
import { syncWorkoutData } from '@/lib/workout-sync';

const COLORS = {
  background: '#F5F5F5',
  white: '#FFFFFF',
  text: '#333333',
  grayText: '#8E8E93',
};

function formatDateLabel(date: string) {
  const [year, month, day] = date.split('-');
  return `${year}/${month}/${day}`;
}

function formatTimeLabel(createdAt?: string | null) {
  if (!createdAt) return '--:--';
  const parsed = new Date(createdAt);
  if (Number.isNaN(parsed.getTime())) return '--:--';
  return `${String(parsed.getHours()).padStart(2, '0')}:${String(parsed.getMinutes()).padStart(2, '0')}`;
}

export default function RecordsHistoryScreen() {
  const router = useRouter();
  const [theme, setTheme] = useState(workoutData.themeColor);
  const [recordsVersion, setRecordsVersion] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      syncWorkoutData().catch(() => {
        // ローカル表示を維持
      }).finally(() => {
        if (!active) return;
        setTheme(workoutData.themeColor);
        setRecordsVersion((value) => value + 1);
      });

      return () => {
        active = false;
      };
    }, []),
  );

  const sortedRecords = [...workoutData.records].sort((a, b) => {
    const left = b.createdAt || `${b.date}T00:00:00`;
    const right = a.createdAt || `${a.date}T00:00:00`;
    return left.localeCompare(right);
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} key={recordsVersion}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color={theme} />
            <Text style={[styles.backText, { color: theme }]}>戻る</Text>
          </TouchableOpacity>
          <Text style={styles.pageTitle}>記録一覧</Text>
          <View style={styles.backSpacer} />
        </View>

        {sortedRecords.length > 0 ? (
          sortedRecords.map((record, index) => {
            const seconds = Math.max(0, Math.round(record.durationSeconds || 0));
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;

            return (
              <TouchableOpacity
                key={record.recordId || `${record.date}-${record.menu}-${index}`}
                style={styles.recordItem}
                activeOpacity={0.75}
                onPress={() =>
                  router.push({
                    pathname: '/(tabs)/kiroku',
                    params: {
                      recordId: record.recordId || '',
                      menu: record.menu,
                      count: String(record.count || 0),
                      sets: String(record.rounds || 1),
                      mins: String(mins),
                      secs: String(secs),
                      memo: record.memo || '',
                      dateStr: record.date.replace(/-/g, '/'),
                      timeStr: formatTimeLabel(record.createdAt),
                      mode: 'edit',
                    },
                  })
                }
              >
                <View style={[styles.recordAccent, { backgroundColor: theme }]} />
                <View style={styles.recordBody}>
                  <View style={styles.recordTopRow}>
                    <Text style={styles.recordMenu}>{record.menu}</Text>
                    <Text style={[styles.recordMinutes, { color: theme }]}>{record.minutes}分</Text>
                  </View>
                  <Text style={styles.recordMeta}>
                    {formatDateLabel(record.date)} {formatTimeLabel(record.createdAt)}
                  </Text>
                  {record.memo ? (
                    <Text style={styles.recordMemo} numberOfLines={2}>
                      {record.memo}
                    </Text>
                  ) : null}
                </View>
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>まだ記録がありません</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },

  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 64,
  },

  backText: {
    fontSize: 14,
    fontWeight: 'bold',
  },

  backSpacer: {
    width: 64,
  },

  pageTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
  },

  recordItem: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    overflow: 'hidden',
  },

  recordAccent: {
    width: 4,
  },

  recordBody: {
    flex: 1,
    padding: 14,
  },

  recordTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },

  recordMenu: {
    flex: 1,
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.text,
  },

  recordMinutes: {
    fontSize: 14,
    fontWeight: 'bold',
  },

  recordMeta: {
    fontSize: 12,
    color: COLORS.grayText,
    marginBottom: 4,
  },

  recordMemo: {
    fontSize: 12,
    color: COLORS.text,
    lineHeight: 18,
  },

  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
  },

  emptyText: {
    fontSize: 14,
    color: COLORS.grayText,
  },
});
