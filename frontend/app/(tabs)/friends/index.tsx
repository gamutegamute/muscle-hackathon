import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFriends } from '../../../hooks/useFriends';
import { workoutData } from '../../globalState';
import { canRenderAvatarUri } from '../../../lib/avatar';

const COLORS = { background: '#F5F5F5', white: '#FFFFFF', text: '#333333', grayText: '#8E8E93' };

export default function FriendsScreen() {
  const router = useRouter();
  const { friends, requests } = useFriends();
  const [theme, setTheme] = useState(workoutData.themeColor || '#A4C639');
  // 🌐 画面が表示される（タブが切り替わる）たびに最新のデータを同期する
  useFocusEffect(
    useCallback(() => {
      // 本来はここに useFriends から提供される fetchFriends() などを呼び出したいですが、
      // まずは一番大元の同期を叩いてデータ管理室（globalState）を最新にします
      import('@/lib/workout-sync').then(({ syncWorkoutData }) => {
        syncWorkoutData().catch((err) => console.warn('フレンド同期エラー:', err));
      });
    }, [])
  );

  useEffect(() => {
    const unsubscribe = workoutData.subscribeColor(setTheme);
    return () => unsubscribe();
  }, []);

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
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/(tabs)/friends/requests' as any)}>
          <Ionicons name="notifications" size={24} color={theme} />
          {requests.length > 0 && (
            <View style={styles.badge}><Text style={styles.badgeText}>{requests.length}</Text></View>
          )}
          <Text style={styles.actionText}>申請一覧</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/(tabs)/friends/search' as any)}>
          <Ionicons name="search" size={24} color={theme} />
          <Text style={styles.actionText}>検索</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/(tabs)/friends/ranking' as any)}>
          <Ionicons name="trophy" size={24} color={theme} />
          <Text style={styles.actionText}>ランキング</Text>
        </TouchableOpacity>
      </View>
      
      {friends.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>まだフレンドがいません。</Text>
        </View>
      ) : (
        <FlatList
          data={friends}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  actionRow: { flexDirection: 'row', justifyContent: 'space-around', padding: 15, backgroundColor: COLORS.white, marginBottom: 10 },
  actionButton: { alignItems: 'center', position: 'relative' },
  actionText: { fontSize: 12, marginTop: 5, color: COLORS.text },
  badge: { position: 'absolute', top: -5, right: -5, backgroundColor: 'red', borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center' },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  listContent: { padding: 15 },
  friendCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, padding: 15, borderRadius: 12, marginBottom: 10 },
  avatar: { width: 50, height: 50, borderRadius: 25 },
  avatarPlaceholder: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  friendInfo: { flex: 1, marginLeft: 15 },
  friendName: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  friendRank: { fontSize: 14, color: COLORS.grayText, marginTop: 4 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: COLORS.grayText, fontSize: 16 }
});
