import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

// Figmaデザインから抽出した色（記録画面と共通）
const COLORS = {
  primaryGreen: '#A4C639', // 保存ボタン
  background: '#F5F5F5', // 画面全体の背景
  white: '#FFFFFF',
  text: '#333333',
  grayBackground: '#E0E0E0', // 入力フィールドの背景
  grayText: '#757575', // プレースホルダー、未選択テキスト
  divider: '#C7C7CC', // 区切り線（薄いグレー）
};

export default function ProfileSettingsScreen() {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [bodyFat, setBodyFat] = useState('');

  return (
    <SafeAreaView style={styles.container}>
      {/* ★ポイント1：タイトルをScrollViewの中に移動しました。
        これにより、タイトルも一緒にスクロールするようになります。
      */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        contentInsetAdjustmentBehavior="never"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        {/* --- ヘッダー（タイトル） --- */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>プロフィール設定</Text>
        </View>

        {/* --- 入力フォーム --- */}
        <View style={styles.formContainer}>
          {/* 名前 */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>名前</Text>
            {/* ★ポイント2：ラベルと入力の間に薄いグレーの線を入れました */}
            <View style={styles.divider} /> 
            <TextInput
              style={styles.input}
              placeholder="名前"
              placeholderTextColor={COLORS.grayText}
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* 年齢 */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>年齢</Text>
            <View style={styles.divider} />
            <TextInput
              style={styles.input}
              placeholder="年齢"
              placeholderTextColor={COLORS.grayText}
              keyboardType="numeric"
              value={age}
              onChangeText={setAge}
            />
          </View>

          {/* 身長 */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>身長</Text>
            <View style={styles.divider} />
            <TextInput
              style={styles.input}
              placeholder="身長"
              placeholderTextColor={COLORS.grayText}
              keyboardType="numeric"
              value={height}
              onChangeText={setHeight}
            />
          </View>

          {/* 体重 */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>体重</Text>
            <View style={styles.divider} />
            <TextInput
              style={styles.input}
              placeholder="体重"
              placeholderTextColor={COLORS.grayText}
              keyboardType="numeric"
              value={weight}
              onChangeText={setWeight}
            />
          </View>

          {/* 体脂肪率 */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>体脂肪率</Text>
            <View style={styles.divider} />
            <TextInput
              style={styles.input}
              placeholder="体脂肪率"
              placeholderTextColor={COLORS.grayText}
              keyboardType="numeric"
              value={bodyFat}
              onChangeText={setBodyFat}
            />
          </View>
        </View>

        {/* --- 保存ボタン --- */}
        <TouchableOpacity style={styles.saveButton}>
          <Text style={styles.saveButtonText}>保存して始める</Text>
        </TouchableOpacity>
      </ScrollView>
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
    paddingBottom: 40,
  },
  // ヘッダー（ScrollView内に配置したため、上の余白を調整）
  header: {
    paddingTop: 40, 
    paddingBottom: 30,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  // 入力フォーム
  formContainer: {
    gap: 10,
    marginBottom: 40,
  },
  inputGroup: {
    backgroundColor: COLORS.grayBackground,
    borderRadius: 15,
    paddingHorizontal: 20, // 左右のパディングを少し広く
    paddingVertical: 15, // 上下のパディングも調整
    marginBottom: 10, // 各項目間の余白
  },
  inputLabel: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
    marginBottom: 5, // 線との余白
  },
  // ★ポイント3：区切り線のスタイル
  divider: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginBottom: 10, // 入力フィールドとの余白
  },
  input: {
    fontSize: 16,
    color: COLORS.text,
    paddingVertical: 5, // TextInputの上下パディング
  },
  // 保存ボタン（角丸を少し大きくしてデザインに合わせました）
  saveButton: {
    backgroundColor: COLORS.primaryGreen,
    paddingVertical: 18,
    borderRadius: 30, 
    alignItems: 'center',
    elevation: 2, // Androidの影
    shadowColor: '#000', // iOSの影
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    marginTop: 30,
  },
  saveButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 18,
  },
});