import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, ScrollView, SafeAreaView, Image } from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5, Feather } from '@expo/vector-icons';

// Figmaデザインから抽出した色
const COLORS = {
  primaryGreen: '#8BC34A', // 保存ボタン、現在時刻ボタン、フッター背景
  background: '#F5F5F5', // 画面全体の背景
  white: '#FFFFFF',
  text: '#333333',
  grayBackground: '#E0E0E0', // タブ、入力フィールドの背景
  grayText: '#757575', // プレースホルダー、未選択テキスト
};

export default function RecordInputScreen() {
  const [menu, setMenu] = useState('');
  const [count, setCount] = useState('');
  const [time, setTime] = useState('');
  const [memo, setMemo] = useState('');

  // プレースホルダーのアバター画像（もし画像がない場合はアイコンに切り替え可能）
  const avatarUrl = 'https://via.placeholder.com/40';

  return (
    <SafeAreaView style={styles.container}>
      {/* --- ヘッダー --- */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>記録の入力</Text>
        <TouchableOpacity style={styles.saveButton}>
          <Text style={styles.saveButtonText}>保存</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* --- セグメント化されたコントロール (タブ) --- */}
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

        {/* --- 日付・時刻セクション --- */}
        <View style={styles.dateTimeContainer}>
          <Feather name="calendar" size={24} color={COLORS.text} style={styles.calendarIcon} />
          <View style={styles.dateTimeBadge}>
            <Text style={styles.dateTimeText}>Apr 1, 2025</Text>
          </View>
          <View style={styles.dateTimeBadge}>
            <Text style={styles.dateTimeText}>9:41 AM</Text>
          </View>
          <TouchableOpacity style={styles.currentTimeButton}>
            <Text style={styles.currentTimeButtonText}>現在時刻</Text>
          </TouchableOpacity>
        </View>

        {/* --- 入力フォーム --- */}
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
            placeholder="時間"
            placeholderTextColor={COLORS.grayText}
            value={time}
            onChangeText={setTime}
          />
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="メモ"
            placeholderTextColor={COLORS.grayText}
            multiline={true}
            numberOfLines={6}
            value={memo}
            onChangeText={setMemo}
            textAlignVertical="top" // Androidでテキストを上に配置
          />
        </View>
      </ScrollView>

      {/* --- フッターナビゲーション --- */}
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
    paddingBottom: 100, // フッターに隠れないように余白を作る
  },
  // ヘッダー
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
    elevation: 2, // Androidの影
    shadowColor: '#000', // iOSの影
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  saveButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  // タブ
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
  // 日付・時刻
  dateTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },
  calendarIcon: {
    marginRight: 10,
  },
  dateTimeBadge: {
    backgroundColor: COLORS.grayBackground,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
    marginRight: 10,
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
  // 入力フォーム
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
    paddingTop: 15, // multilineの時のパディング調整
  },
  // フッター
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
    backgroundColor: COLORS.background, // 背景色と同じにしてくり抜き風に
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