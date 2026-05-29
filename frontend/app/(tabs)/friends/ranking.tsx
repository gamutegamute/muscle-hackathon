import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, SafeAreaView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useFriends } from '../../../hooks/useFriends';
import { workoutData } from '../../globalState';
import { canRenderAvatarUri } from '../../../lib/avatar';

type RankingPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

const COLORS = {
  background: '#F5F5F5',
  white: '#FFFFFF',
  text: '#333333',
  grayText: '#8E8E93',
  gold: '#FFD700',
  silver: '#C0C0C0',
  bronze: '#CD7F32',
};

const PERIOD_TABS: { key: RankingPeriod; label: string }[] = [
  { key: 'daily', label: '日間' },
  { key: 'weekly', label: '週間' },
  { key: 'monthly', label: '月間' },
  { key: 'yearly', label: '年間' },
];

function getLocalDateParts() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return {
    today: `${year}-${month}-${day}`,
    monthPrefix: `${year}-${month}`,
    yearPrefix: String(year),
    weekStartMs: new Date(year, now.getMonth(), now.getDate() - 6).getTime(),
    todayEndMs: new Date(year, now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime(),
  };
}

function getSelfPeriodMinutes(period: RankingPeriod) {
  const { today, monthPrefix, yearPrefix, weekStartMs, todayEndMs } = getLocalDateParts();

  return workoutData.records.reduce((total, record) => {
    const recordDate = record.date?.slice(0, 10);
    if (!recordDate) {
      return total;
    }

    if (period === 'daily' && recordDate !== today) {
      return total;
    }

    if (period === 'weekly') {
      const recordTime = new Date(`${recordDate}T00:00:00`).getTime();
      if (recordTime < weekStartMs || recordTime > todayEndMs) {
        return total;
      }
    }

    if (period === 'monthly' && !recordDate.startsWith(monthPrefix)) {
      return total;
    }

    if (period === 'yearly' && !recordDate.startsWith(yearPrefix)) {
      return total;
    }

    return total + Number(record.minutes || 0);
  }, 0);
}

export default function RankingScreen() {
  const router = useRouter();
  const { friends } = useFriends();
  const [theme, setTheme] = useState(workoutData.themeColor || '#A4C639');
  const [period, setPeriod] = useState<RankingPeriod>('weekly');
  const [, setDataVersion] = useState(0);

  useEffect(() => {
    const unsubscribe = workoutData.subscribeColor(setTheme);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = workoutData.subscribeData(() => setDataVersion((version) => version + 1));
    return () => unsubscribe();
  }, []);

  const currentUserId = workoutData.getUserId();
  const shouldShowCurrentUser = currentUserId && !workoutData.isGuestUser();
  const currentUser = shouldShowCurrentUser
    ? {
        id: currentUserId,
        friendId: workoutData.userProfile.friendId ?? '',
        name: workoutData.userProfile.name || 'あなた',
        avatar: workoutData.userProfile.avatar,
        rank: workoutData.equippedBadge,
        consecutiveDays: workoutData.streakDays,
        totalTime: workoutData.totalMinutes,
        dailyTotalTime: getSelfPeriodMinutes('daily'),
        weeklyTotalTime: getSelfPeriodMinutes('weekly'),
        monthlyTotalTime: getSelfPeriodMinutes('monthly'),
        yearlyTotalTime: getSelfPeriodMinutes('yearly'),
        achievementCount: workoutData.unlockedAchievements.length,
        recentActivity: [],
        isSelf: true,
      }
    : null;
  const getRankingMinutes = (item: {
    dailyTotalTime?: number;
    weeklyTotalTime?: number;
    monthlyTotalTime?: number;
    yearlyTotalTime?: number;
    totalTime: number;
  }) => {
    if (period === 'daily') return Number(item.dailyTotalTime ?? 0);
    if (period === 'weekly') return Number(item.weeklyTotalTime ?? 0);
    if (period === 'monthly') return Number(item.monthlyTotalTime ?? 0);
    return Number(item.yearlyTotalTime ?? item.totalTime ?? 0);
  };

  const ranking = (currentUser ? [currentUser, ...friends] : friends)
    .filter((item, index, list) => list.findIndex((candidate) => candidate.id === item.id) === index)
    .sort((a, b) => getRankingMinutes(b) - getRankingMinutes(a));

  const getRankColor = (index: number) => {
    if (index === 0) return COLORS.gold;
    if (index === 1) return COLORS.silver;
    if (index === 2) return COLORS.bronze;
    return COLORS.grayText;
  };

  const renderItem = ({ item, index }: { item: any; index: number }) => (
    <TouchableOpacity
      style={[styles.card, item.isSelf && styles.selfCard]}
      disabled={item.isSelf}
      onPress={() => router.push(`/(tabs)/friends/${item.id}` as any)}
    >
      <View style={styles.rankContainer}>
        <Text style={[styles.rankNumber, { color: getRankColor(index) }]}>{index + 1}</Text>
      </View>
      {canRenderAvatarUri(item.avatar) ? (
        <Image source={{ uri: item.avatar }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatarPlaceholder, { backgroundColor: theme }]}>
          <Ionicons name="person" size={20} color="#FFF" />
        </View>
      )}
      <View style={styles.info}>
        <View>
          <Text style={styles.name}>{item.name}</Text>
          {item.isSelf && <Text style={[styles.selfLabel, { color: theme }]}>あなた</Text>}
        </View>
        <Text style={styles.time}>{Math.floor(getRankingMinutes(item))}分</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{ 
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
              <Ionicons name="arrow-back" size={24} color={theme} />
            </TouchableOpacity>
          )
        }} 
      />
      <View style={styles.segmentedControl}>
        {PERIOD_TABS.map((tab) => {
          const isActive = period === tab.key;

          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.segmentButton, isActive && styles.segmentButtonActive]}
              onPress={() => setPeriod(tab.key)}
              activeOpacity={0.85}
            >
              <Text style={[styles.segmentText, isActive && { color: theme }]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <FlatList
        data={ranking}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#E5E5E5',
    borderRadius: 16,
    padding: 4,
    marginHorizontal: 15,
    marginTop: 8,
    marginBottom: 8,
  },
  segmentButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentButtonActive: {
    backgroundColor: COLORS.white,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.grayText,
  },
  list: { padding: 15, paddingTop: 8 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  selfCard: { borderWidth: 2, borderColor: '#DCEFC0' },
  rankContainer: { width: 30, alignItems: 'center', marginRight: 10 },
  rankNumber: { fontSize: 20, fontWeight: 'bold' },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  avatarPlaceholder: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  info: { flex: 1, marginLeft: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  selfLabel: { fontSize: 12, fontWeight: 'bold', marginTop: 3 },
  time: { fontSize: 14, color: COLORS.grayText, fontWeight: 'bold' },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
