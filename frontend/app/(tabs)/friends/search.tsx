import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, SafeAreaView, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFriends } from '../../../hooks/useFriends';
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
    const isFriend = friends.some((f: any) => f.id === item.id);
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
