import React, { useEffect, useState } from 'react';
import { Alert, Share, Platform, ToastAndroid, View, Text, StyleSheet, FlatList, Image, TouchableOpacity, SafeAreaView, TextInput, ActivityIndicator } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFriends } from '../../../hooks/useFriends';
import { workoutData } from '../../globalState';

const COLORS = { background: '#F5F5F5', white: '#FFFFFF', text: '#333333', grayText: '#8E8E93' };

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [userId, setUserId] = useState(workoutData.getUserId());
  const [isRegistered, setIsRegistered] = useState(workoutData.sessionMode === 'registered');
  const [copyFeedback, setCopyFeedback] = useState('');
  const { searchUsers, sendRequest, sentRequests, isLoading, friends } = useFriends();
  const [theme, setTheme] = useState(workoutData.themeColor || '#A4C639');

  useEffect(() => {
    const unsubscribe = workoutData.subscribeColor(setTheme);
    const unsubscribeData = workoutData.subscribeData(() => {
      setUserId(workoutData.getUserId());
      setIsRegistered(workoutData.sessionMode === 'registered');
    });

    return () => {
      unsubscribe();
      unsubscribeData();
    };
  }, []);

  const handleShareId = async () => {
    try {
      await Share.share({
        message: `muscloopで一緒に筋トレしよう！私のフレンドIDは【${userId}】です！`,
        title: 'フレンドIDを共有',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : '共有に失敗しました。';
      Alert.alert('共有エラー', message);
    }
  };

  const handleCopyId = async () => {
    try {
      await Clipboard.setStringAsync(userId);
      if (Platform.OS === 'android') {
        ToastAndroid.show('IDをコピーしました', ToastAndroid.SHORT);
      }
      setCopyFeedback('IDをコピーしました');
      setTimeout(() => setCopyFeedback(''), 2000);
    } catch {
      Alert.alert('コピーエラー', 'IDのコピーに失敗しました。');
    }
  };

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
      <Stack.Screen
        options={{
          headerRight: () => (
            <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
              <Ionicons name="close" size={22} color={theme} />
            </TouchableOpacity>
          ),
        }}
      />
      {isRegistered && (
        <View style={styles.profileShareRow}>
          <View style={styles.profileIdBox}>
            <Text style={styles.profileIdLabel}>マイID</Text>
            <Text style={styles.profileIdText}>{userId}</Text>
          </View>
          <View style={styles.actionButtons}>
            <TouchableOpacity style={[styles.copyButton, { borderColor: theme }]} onPress={handleCopyId}>
              <Ionicons name="copy-outline" size={18} color={theme} />
              <Text style={[styles.copyButtonText, { color: theme }]}>コピー</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.shareButton, { backgroundColor: theme }]} onPress={handleShareId}>
              <Ionicons name="share-outline" size={18} color="#FFF" />
              <Text style={styles.shareButtonText}>共有</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      {copyFeedback ? (
        <View style={styles.copyFeedback}>
          <Text style={styles.copyFeedbackText}>{copyFeedback}</Text>
        </View>
      ) : null}
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
  profileShareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 14,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  profileIdBox: {
    flex: 1,
    marginRight: 10,
  },
  profileIdLabel: {
    color: COLORS.grayText,
    fontSize: 12,
    marginBottom: 4,
  },
  profileIdText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
    marginRight: 8,
  },
  copyButtonText: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6,
  },
  copyFeedback: {
    marginHorizontal: 15,
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#333333',
    borderRadius: 10,
    alignItems: 'center',
  },
  copyFeedbackText: {
    color: '#FFFFFF',
    fontSize: 13,
  },
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
  statusText: { color: COLORS.grayText, fontSize: 12, fontWeight: 'bold' },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
