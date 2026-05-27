import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFriends } from '../../../hooks/useFriends';
import { workoutData } from '../../globalState';

const COLORS = { background: '#F5F5F5', white: '#FFFFFF', text: '#333333', grayText: '#8E8E93', accent: '#FFD700' };

export default function FriendDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getFriendById } = useFriends();
  const [theme, setTheme] = useState(workoutData.themeColor || '#A4C639');

  useEffect(() => {
    const unsubscribe = workoutData.subscribeColor(setTheme);
    return () => unsubscribe();
  }, []);

  const friend = getFriendById(id);

  if (!friend) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>ユーザーが見つかりません</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileHeader}>
          {friend.avatar ? (
            <Image source={{ uri: friend.avatar }} style={styles.avatarImage} />
          ) : (
            <View style={[styles.avatarCircle, { backgroundColor: theme }]}><Ionicons name="person" size={50} color={COLORS.white} /></View>
          )}
          <Text style={styles.userName}>{friend.name}</Text>
          <View style={[styles.rankBadge, { borderColor: COLORS.accent }]}>
            <Text style={styles.rankText}>{friend.rank}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>トレーニング実績</Text>
          <View style={styles.statusRow}>
            <View style={styles.statusItem}>
              <Ionicons name="flame" size={24} color="#FF3B30" style={{ marginBottom: 5 }} />
              <Text style={styles.statusValue}>{friend.consecutiveDays}<Text style={styles.statusUnit}>日</Text></Text>
              <Text style={styles.statusLabel}>連続日数</Text>
            </View>
            <View style={styles.statusItem}>
              <Ionicons name="time" size={24} color={theme} style={{ marginBottom: 5 }} />
              <Text style={styles.statusValue}>{Math.floor(friend.totalTime / 60)}<Text style={styles.statusUnit}>h</Text></Text>
              <Text style={styles.statusLabel}>合計時間</Text>
            </View>
            <View style={styles.statusItem}>
              <Ionicons name="trophy" size={24} color="#FFD700" style={{ marginBottom: 5 }} />
              <Text style={styles.statusValue}>{friend.achievementCount}<Text style={styles.statusUnit}>個</Text></Text>
              <Text style={styles.statusLabel}>バッジ</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
            <Ionicons name="fitness" size={20} color={theme} style={{ marginRight: 8 }} />
            <Text style={styles.cardTitle}>最近の筋トレ履歴</Text>
          </View>
          {friend.recentActivity.length > 0 ? (
            friend.recentActivity.map((activity: string, index: number) => (
              <View key={index} style={styles.activityItem}>
                <View style={[styles.activityDot, { backgroundColor: theme }]} />
                <Text style={styles.activityText}>{activity}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>最近の記録がありません</Text>
          )}
        </View>
        <TouchableOpacity style={[styles.backButton, { borderColor: theme }]} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={18} color={theme} />
          <Text style={[styles.backButtonText, { color: theme }]}>フレンド一覧に戻る</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 16, color: COLORS.grayText },
  scrollContent: { padding: 20 },
  profileHeader: { alignItems: 'center', marginBottom: 30, marginTop: 10 },
  avatarCircle: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', marginBottom: 15 },
  avatarImage: { width: 100, height: 100, borderRadius: 50, marginBottom: 15 },
  userName: { fontSize: 24, fontWeight: 'bold', color: COLORS.text, marginBottom: 10 },
  rankBadge: { backgroundColor: COLORS.white, paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, borderWidth: 2 },
  rankText: { fontSize: 14, fontWeight: 'bold', color: '#D4AF37' },
  card: { backgroundColor: COLORS.white, borderRadius: 15, padding: 20, marginBottom: 20 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginBottom: 15 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statusItem: { alignItems: 'center', flex: 1 },
  statusLabel: { fontSize: 12, color: COLORS.grayText, marginTop: 5 },
  statusValue: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
  statusUnit: { fontSize: 14, fontWeight: 'normal' },
  activityItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.background },
  activityDot: { width: 8, height: 8, borderRadius: 4, marginRight: 12 },
  activityText: { fontSize: 15, color: COLORS.text },
  emptyText: { color: COLORS.grayText, fontStyle: 'italic' },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
  },
  backButtonText: { fontSize: 15, fontWeight: '600' },
});
