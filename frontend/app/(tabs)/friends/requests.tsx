import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFriends } from '../../../hooks/useFriends';
import { workoutData } from '../../globalState';
import { canRenderAvatarUri } from '../../../lib/avatar';

const COLORS = { background: '#F5F5F5', white: '#FFFFFF', text: '#333333', grayText: '#8E8E93', success: '#34C759', danger: '#FF3B30' };

export default function RequestsScreen() {
  const router = useRouter();
  const { requests: friendRequests, approveRequest, rejectRequest, isLoading } = useFriends();
  const [theme, setTheme] = useState(workoutData.themeColor || '#A4C639');

  useEffect(() => {
    const unsubscribe = workoutData.subscribeColor(setTheme);
    return () => unsubscribe();
  }, []);

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      {canRenderAvatarUri(item.avatar) ? (
        <Image source={{ uri: item.avatar }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatarPlaceholder, { backgroundColor: theme }]}><Ionicons name="person" size={24} color="#FFF"/></View>
      )}
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.rank}>{item.rank}</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: COLORS.success }]} onPress={() => approveRequest(item.id)}>
          <Ionicons name="checkmark" size={20} color="#FFF" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: COLORS.danger, marginLeft: 10 }]} onPress={() => rejectRequest(item.id)}>
          <Ionicons name="close" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
              <Ionicons name="close" size={22} color={theme} />
            </TouchableOpacity>
          ),
        }}
      />
      {isLoading && <ActivityIndicator size="large" color={theme} style={{ marginTop: 20 }} />}
      {friendRequests.length === 0 ? (
        <View style={styles.emptyContainer}><Text style={styles.emptyText}>フレンド申請はありません</Text></View>
      ) : (
        <FlatList data={friendRequests} keyExtractor={(item) => item.id} renderItem={renderItem} contentContainerStyle={styles.list} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  list: { padding: 15 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, padding: 15, borderRadius: 12, marginBottom: 10 },
  avatar: { width: 50, height: 50, borderRadius: 25 },
  avatarPlaceholder: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  info: { flex: 1, marginLeft: 15 },
  name: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  rank: { fontSize: 12, color: COLORS.grayText, marginTop: 4 },
  actions: { flexDirection: 'row' },
  actionBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: COLORS.grayText, fontSize: 16 },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
