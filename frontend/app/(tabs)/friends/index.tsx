import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFriends } from '../../../hooks/useFriends';
import { workoutData } from '../../globalState';
import { canRenderAvatarUri } from '../../../lib/avatar';

const COLORS = {
  background: '#F7F8FA',
  card: '#FFFFFF',
  text: '#202124',
  grayText: '#6E6E74',
  secondaryText: '#8E8E93',
  border: '#E8EAED',
  illustrationBg: '#E7F8EF',
};

const SEGMENT_ITEMS = [
  { key: 'friends', label: 'フレンド一覧', icon: 'people', route: '' },
  { key: 'requests', label: '申請一覧', icon: 'notifications', route: 'requests' },
  { key: 'search', label: '検索', icon: 'search', route: 'search' },
  { key: 'ranking', label: 'ランキング', icon: 'trophy', route: 'ranking' },
];

export default function FriendsScreen() {
  const router = useRouter();
  const { friends, requests } = useFriends();
  const [theme, setTheme] = useState(workoutData.themeColor || '#A4C639');
  const activeTab = 'friends';

  useFocusEffect(
    useCallback(() => {
      import('@/lib/workout-sync').then(({ syncWorkoutData }) => {
        syncWorkoutData().catch((err) => console.warn('フレンド同期エラー:', err));
      });
    }, [])
  );

  useEffect(() => {
    const unsubscribe = workoutData.subscribeColor(setTheme);
    return () => unsubscribe();
  }, []);

  const navigateTo = (route: string) => {
    if (!route) {
      return;
    }
    router.push(`/(tabs)/friends/${route}` as any);
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.friendCard} onPress={() => router.push(`/(tabs)/friends/${item.id}` as any)}>
      {canRenderAvatarUri(item.avatar) ? (
        <Image source={{ uri: item.avatar }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatarPlaceholder, { backgroundColor: theme }]}><Ionicons name="person" size={24} color="#FFF"/></View>
      )}
      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>{item.name}</Text>
        <Text style={styles.friendRank}>{item.rank}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={COLORS.grayText} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.segmentBox}>
        {SEGMENT_ITEMS.map((item) => {
          const isActive = item.key === activeTab;
          return (
            <TouchableOpacity
              key={item.key}
              style={[
                styles.segmentTab,
                isActive ? { backgroundColor: theme, shadowColor: theme, shadowOpacity: 0.12 } : null,
              ]}
              onPress={() => navigateTo(item.route)}
              activeOpacity={0.85}
            >
              <View style={[styles.segmentIcon, isActive ? { backgroundColor: '#FFFFFF' } : { backgroundColor: '#F2F4F7' }]}>
               <Ionicons name={item.icon as any} size={18} color={isActive ? theme : COLORS.grayText} />
              </View>
              <Text style={[styles.segmentLabel, isActive ? styles.segmentLabelActive : null]}>{item.label}</Text>
              {item.key === 'requests' && requests.length > 0 ? (
                <View style={[styles.segmentBadge, isActive ? { backgroundColor: theme } : null]}>
                  <Text style={styles.segmentBadgeText}>{requests.length}</Text>
                </View>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </View>

      {friends.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.illustrationWrapper}>
            <View style={styles.illustrationBackground} />
            <View style={styles.illustrationRow}>
              <View style={[styles.avatarCircle, { backgroundColor: '#D7F7E6' }]}>
                <Ionicons name="person" size={26} color={theme} />
              </View>
              <View style={[styles.avatarCircle, { backgroundColor: '#E8F0FD' }]}>
                <Ionicons name="people" size={26} color={theme} />
              </View>
            </View>
            <View style={styles.illustrationSparkContainer}>
              <View style={styles.sparkDot} />
              <View style={styles.sparkMini} />
              <View style={styles.sparkMini} />
            </View>
          </View>
          <Text style={styles.emptyTitle}>まだフレンドが登録されていません。</Text>
          <Text style={styles.emptyDescription}>
            最初のフレンドを追加して、一緒にトレーニングを始めましょう！
          </Text>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: theme }]}
            onPress={() => navigateTo('search')}
          >
            <Text style={styles.primaryButtonText}>フレンドを追加する</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={friends}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  segmentBox: {
    marginHorizontal: 16,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 5,
    marginBottom: 14,
  },
  segmentTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
  },
  segmentIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  segmentLabel: { fontSize: 12, color: COLORS.grayText, fontWeight: '600' },
  segmentLabelActive: { color: '#FFFFFF' },
  segmentBadge: {
    position: 'absolute',
    top: 8,
    right: 12,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  segmentBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },
  listContent: { padding: 15 },
  friendCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', padding: 15, borderRadius: 12, marginBottom: 10 },
  avatar: { width: 50, height: 50, borderRadius: 25 },
  avatarPlaceholder: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  friendInfo: { flex: 1, marginLeft: 15 },
  friendName: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  friendRank: { fontSize: 14, color: COLORS.grayText, marginTop: 4 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30, paddingTop: 20 },
  illustrationWrapper: {
    width: 240,
    height: 220,
    marginBottom: 24,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  illustrationBackground: {
    position: 'absolute',
    width: 220,
    height: 180,
    borderRadius: 110,
    backgroundColor: COLORS.illustrationBg,
  },
  illustrationRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
  },
  avatarCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  illustrationSparkContainer: {
    position: 'absolute',
    bottom: 10,
    right: 34,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sparkDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFD279',
    marginRight: 6,
  },
  sparkMini: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#90AAF6',
  },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text, textAlign: 'center', marginBottom: 10 },
  emptyDescription: { fontSize: 15, color: COLORS.secondaryText, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  primaryButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
