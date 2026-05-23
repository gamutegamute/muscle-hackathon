import os

os.makedirs(r'app\(tabs)\friends', exist_ok=True)

layout = """import { Stack } from 'expo-router';
import React from 'react';
import { useColorScheme } from 'react-native';
import { workoutData } from '../../globalState';

export default function FriendsLayout() {
  const isDark = useColorScheme() === 'dark';
  const themeColor = workoutData.themeColor || '#A4C639';

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' },
        headerTintColor: themeColor,
        headerTitleStyle: { fontWeight: 'bold', color: isDark ? '#FFFFFF' : '#333333' },
        headerBackVisible: false,
      }}
    >
      <Stack.Screen name="index" options={{ title: 'フレンド', headerShadowVisible: false }} />
      <Stack.Screen name="[id]" options={{ title: 'フレンド詳細', headerShadowVisible: false }} />
      <Stack.Screen name="search" options={{ title: 'フレンド検索', presentation: 'modal' }} />
      <Stack.Screen name="requests" options={{ title: 'フレンド申請', presentation: 'modal' }} />
      <Stack.Screen name="ranking" options={{ title: 'ランキング', headerShadowVisible: false }} />
    </Stack>
  );
}
"""

index = """import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFriends } from '../../hooks/useFriends';
import { workoutData } from '../../globalState';

const COLORS = { background: '#F5F5F5', white: '#FFFFFF', text: '#333333', grayText: '#8E8E93' };

export default function FriendsScreen() {
  const router = useRouter();
  const { friends, requests } = useFriends();
  const [theme, setTheme] = useState(workoutData.themeColor || '#A4C639');

  useEffect(() => {
    const unsubscribe = workoutData.subscribeColor(setTheme);
    return () => unsubscribe();
  }, []);

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.friendCard} onPress={() => router.push(`/(tabs)/friends/${item.id}` as any)}>
      {item.avatar ? (
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
"""

id_tsx = """import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, SafeAreaView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFriends } from '../../hooks/useFriends';
import { workoutData } from '../../globalState';

const COLORS = { background: '#F5F5F5', white: '#FFFFFF', text: '#333333', grayText: '#8E8E93', accent: '#FFD700' };

export default function FriendDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
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
});
"""

ranking = """import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFriends } from '../../hooks/useFriends';
import { workoutData } from '../../globalState';

const COLORS = { background: '#F5F5F5', white: '#FFFFFF', text: '#333333', grayText: '#8E8E93', gold: '#FFD700', silver: '#C0C0C0', bronze: '#CD7F32' };

export default function RankingScreen() {
  const router = useRouter();
  const { getRankingByTotalTime } = useFriends();
  const [theme, setTheme] = useState(workoutData.themeColor || '#A4C639');

  useEffect(() => {
    const unsubscribe = workoutData.subscribeColor(setTheme);
    return () => unsubscribe();
  }, []);

  const ranking = getRankingByTotalTime();

  const getRankColor = (index: number) => {
    if (index === 0) return COLORS.gold;
    if (index === 1) return COLORS.silver;
    if (index === 2) return COLORS.bronze;
    return COLORS.grayText;
  };

  const renderItem = ({ item, index }: { item: any, index: number }) => (
    <TouchableOpacity style={styles.card} onPress={() => router.push(`/(tabs)/friends/${item.id}` as any)}>
      <View style={styles.rankContainer}>
        <Text style={[styles.rankNumber, { color: getRankColor(index) }]}>{index + 1}</Text>
      </View>
      {item.avatar ? (
        <Image source={{ uri: item.avatar }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatarPlaceholder, { backgroundColor: theme }]}><Ionicons name="person" size={20} color="#FFF"/></View>
      )}
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.time}>{Math.floor(item.totalTime / 60)}時間</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList data={ranking} keyExtractor={(item) => item.id} renderItem={renderItem} contentContainerStyle={styles.list} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  list: { padding: 15 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, padding: 15, borderRadius: 12, marginBottom: 10 },
  rankContainer: { width: 30, alignItems: 'center', marginRight: 10 },
  rankNumber: { fontSize: 20, fontWeight: 'bold' },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  avatarPlaceholder: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  info: { flex: 1, marginLeft: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  time: { fontSize: 14, color: COLORS.grayText, fontWeight: 'bold' }
});
"""

requests = """import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFriends } from '../../hooks/useFriends';
import { workoutData } from '../../globalState';

const COLORS = { background: '#F5F5F5', white: '#FFFFFF', text: '#333333', grayText: '#8E8E93', success: '#34C759', danger: '#FF3B30' };

export default function RequestsScreen() {
  const { requests: friendRequests, approveRequest, rejectRequest, isLoading } = useFriends();
  const [theme, setTheme] = useState(workoutData.themeColor || '#A4C639');

  useEffect(() => {
    const unsubscribe = workoutData.subscribeColor(setTheme);
    return () => unsubscribe();
  }, []);

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      {item.avatar ? (
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
  emptyText: { color: COLORS.grayText, fontSize: 16 }
});
"""

search = """import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, SafeAreaView, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFriends } from '../../hooks/useFriends';
import { workoutData } from '../../globalState';

const COLORS = { background: '#F5F5F5', white: '#FFFFFF', text: '#333333', grayText: '#8E8E93' };

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const { searchUsers, sendRequest, sentRequests, isLoading, friends } = useFriends();
  const [theme, setTheme] = useState(workoutData.themeColor || '#A4C639');

  useEffect(() => {
    const unsubscribe = workoutData.subscribeColor(setTheme);
    return () => unsubscribe();
  }, []);

  const handleSearch = async () => {
    const res = await searchUsers(query);
    setResults(res);
  };

  const renderItem = ({ item }: { item: any }) => {
    const isFriend = friends.some(f => f.id === item.id);
    const isSent = sentRequests.includes(item.id);

    return (
      <View style={styles.card}>
        {item.avatar ? (
          <Image source={{ uri: item.avatar }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: theme }]}><Ionicons name="person" size={24} color="#FFF"/></View>
        )}
        <View style={styles.info}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.rank}>{item.rank}</Text>
        </View>
        {isFriend ? (
          <Text style={styles.statusText}>フレンド</Text>
        ) : isSent ? (
          <Text style={styles.statusText}>申請済み</Text>
        ) : (
          <TouchableOpacity style={[styles.addBtn, { backgroundColor: theme }]} onPress={() => sendRequest(item.id)}>
            <Text style={styles.addBtnText}>申請</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchHeader}>
        <TextInput style={styles.input} placeholder="ユーザー名またはID" value={query} onChangeText={setQuery} onSubmitEditing={handleSearch} />
        <TouchableOpacity style={[styles.searchBtn, { backgroundColor: theme }]} onPress={handleSearch}>
          <Ionicons name="search" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>
      {isLoading && <ActivityIndicator size="large" color={theme} style={{ marginTop: 20 }} />}
      <FlatList data={results} keyExtractor={(item) => item.id} renderItem={renderItem} contentContainerStyle={styles.list} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  searchHeader: { flexDirection: 'row', padding: 15, backgroundColor: COLORS.white },
  input: { flex: 1, backgroundColor: '#F0F0F0', borderRadius: 8, paddingHorizontal: 15, height: 40 },
  searchBtn: { width: 40, height: 40, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
  list: { padding: 15 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, padding: 15, borderRadius: 12, marginBottom: 10 },
  avatar: { width: 50, height: 50, borderRadius: 25 },
  avatarPlaceholder: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  info: { flex: 1, marginLeft: 15 },
  name: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  rank: { fontSize: 12, color: COLORS.grayText, marginTop: 4 },
  addBtn: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },
  addBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
  statusText: { color: COLORS.grayText, fontSize: 12, fontWeight: 'bold' }
});
"""

def write_file(filename, content):
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(content)

write_file(r'app\(tabs)\friends\_layout.tsx', layout)
write_file(r'app\(tabs)\friends\index.tsx', index)
write_file(r'app\(tabs)\friends\[id].tsx', id_tsx)
write_file(r'app\(tabs)\friends\ranking.tsx', ranking)
write_file(r'app\(tabs)\friends\requests.tsx', requests)
write_file(r'app\(tabs)\friends\search.tsx', search)
print('Done!')
