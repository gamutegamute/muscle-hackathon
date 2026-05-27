import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useFriends } from '../../../hooks/useFriends';
import { workoutData } from '../../globalState';

const COLORS = {
  background: '#F5F5F5',
  white: '#FFFFFF',
  text: '#333333',
  grayText: '#8E8E93',
  gold: '#FFD700',
  silver: '#C0C0C0',
  bronze: '#CD7F32',
};

export default function RankingScreen() {
  const router = useRouter();
  const { getRankingByTotalTime } = useFriends();
  const [theme, setTheme] = useState(workoutData.themeColor || '#A4C639');
  const [, setDataVersion] = useState(0);

  useEffect(() => {
    const unsubscribe = workoutData.subscribeColor(setTheme);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = workoutData.subscribeData(() => setDataVersion((version) => version + 1));
    return () => unsubscribe();
  }, []);

  const friendRanking = getRankingByTotalTime();
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
        achievementCount: workoutData.unlockedAchievements.length,
        recentActivity: [],
        isSelf: true,
      }
    : null;
  const ranking = (currentUser ? [currentUser, ...friendRanking] : friendRanking)
    .filter((item, index, list) => list.findIndex((candidate) => candidate.id === item.id) === index)
    .sort((a, b) => b.totalTime - a.totalTime);

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
      {item.avatar ? (
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
        <Text style={styles.time}>{Math.floor(item.totalTime)}分</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
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
  list: { padding: 15 },
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
});
