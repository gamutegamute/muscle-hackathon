import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  Image,
  Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5, Feather } from '@expo/vector-icons';

const COLORS = {
  primaryGreen: '#8BC34A',
  background: '#F5F5F5',
  white: '#FFFFFF',
  text: '#333333',
  grayBackground: '#E0E0E0',
  grayText: '#757575',
};

const API_BASE_URL = 'http://localhost:8000';
// 実機なら localhost ではなくPCのIPに変える
// 例: const API_BASE_URL = 'http://192.168.1.10:8000';

export default function RecordInputScreen() {
  const [menu, setMenu] = useState('');
  const [count, setCount] = useState('');
  const [time, setTime] = useState('');
  const [memo, setMemo] = useState('');
  const [loading, setLoading] = useState(false);

  const avatarUrl = 'https://via.placeholder.com/40';

  const handleSave = async () => {
    if (!menu.trim()) {
      Alert.alert('入力エラー', 'メニューを入力してください');
      return;
    }

    const payload = {
      userId: 'test-user-001',
      menuName: menu.trim(),
      count: count ? Number(count) : 0,
      duration: time ? Number(time) : 0,
      memo: memo.trim(),
    };

    try {
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/records`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        console.log('record save error:', data);
        Alert.alert('保存失敗', data?.detail || '記録の保存に失敗しました');
        return;
      }

      console.log('record save success:', data);
      Alert.alert('保存成功', '記録を保存しました');

      setMenu('');
      setCount('');
      setTime('');
      setMemo('');
    } catch (error) {
      console.log('network error:', error);
      Alert.alert('通信エラー', 'サーバーに接続できませんでした');
    } finally {
      setLoading(false);
    }
  };

  const handleSetCurrentTime = () => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    setTime(`${hours}${minutes}`);
  };

  const now = new Date();
  const dateLabel = `${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()}`;
  const timeLabel = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>記録の入力</Text>
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? '保存中...' : '保存'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.tabContainer}>
          <TouchableOpacity style={[styles.tab, styles.activeTab]}>
            <Text style={[styles.tabText, styles.activeTabText]}>入力</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tab}>
            <Text style={styles.tabText}>ストップウォッチ</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tab}>
            <Text style={styles.tabText}>タイマー</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.dateTimeContainer}>
          <Feather name="calendar" size={24} color={COLORS.text} style={styles.calendarIcon} />
          <View style={styles.dateTimeBadge}>
            <Text style={styles.dateTimeText}>{dateLabel}</Text>
          </View>
          <View style={styles.dateTimeBadge}>
            <Text style={styles.dateTimeText}>{timeLabel}</Text>
          </View>
          <TouchableOpacity style={styles.currentTimeButton} onPress={handleSetCurrentTime}>
            <Text style={styles.currentTimeButtonText}>現在時刻</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formContainer}>
          <TextInput
            style={styles.input}
            placeholder="メニュー"
            placeholderTextColor={COLORS.grayText}
            value={menu}
            onChangeText={setMenu}
          />
          <TextInput
            style={styles.input}
            placeholder="回数"
            placeholderTextColor={COLORS.grayText}
            keyboardType="numeric"
            value={count}
            onChangeText={setCount}
          />
          <TextInput
            style={styles.input}
            placeholder="時間（秒）"
            placeholderTextColor={COLORS.grayText}
            keyboardType="numeric"
            value={time}
            onChangeText={setTime}
          />
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="メモ"
            placeholderTextColor={COLORS.grayText}
            multiline
            numberOfLines={6}
            value={memo}
            onChangeText={setMemo}
            textAlignVertical="top"
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.footerTab}>
          <Ionicons name="home-outline" size={28} color={COLORS.text} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.footerTab}>
          <MaterialCommunityIcons name="chart-bar" size={28} color={COLORS.text} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.footerTab}>
          <MaterialCommunityIcons name="email-outline" size={28} color={COLORS.text} />
          <Text style={styles.aiBadge}>AI</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.footerTab}>
          <FontAwesome5 name="calendar-alt" size={26} color={COLORS.text} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.footerTab}>
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: COLORS.background,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  saveButton: {
    backgroundColor: COLORS.primaryGreen,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.grayBackground,
    borderRadius: 25,
    padding: 2,
    marginVertical: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 23,
  },
  activeTab: {
    backgroundColor: COLORS.white,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  tabText: {
    color: COLORS.grayText,
    fontWeight: '500',
    fontSize: 15,
  },
  activeTabText: {
    color: COLORS.text,
    fontWeight: 'bold',
  },
  dateTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
    flexWrap: 'wrap',
    gap: 8,
  },
  calendarIcon: {
    marginRight: 4,
  },
  dateTimeBadge: {
    backgroundColor: COLORS.grayBackground,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
  },
  dateTimeText: {
    color: COLORS.text,
    fontSize: 15,
  },
  currentTimeButton: {
    backgroundColor: COLORS.primaryGreen,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
  },
  currentTimeButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
  formContainer: {
    gap: 15,
  },
  input: {
    backgroundColor: COLORS.grayBackground,
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 15,
    fontSize: 16,
    color: COLORS.text,
  },
  textArea: {
    height: 150,
    paddingTop: 15,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    flexDirection: 'row',
    backgroundColor: COLORS.primaryGreen,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  footerTab: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  aiBadge: {
    position: 'absolute',
    top: -5,
    right: -10,
    backgroundColor: COLORS.background,
    color: COLORS.text,
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 5,
    overflow: 'hidden',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.text,
  },
});