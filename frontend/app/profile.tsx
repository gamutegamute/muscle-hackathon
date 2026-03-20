import { useRouter } from 'expo-router'; // ★追加1：移動用のフックをインポート
import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const COLORS = {
  primaryGreen: '#A4C639',
  background: '#F5F5F5',
  white: '#FFFFFF',
  text: '#333333',
  grayBackground: '#E0E0E0',
  grayText: '#757575',
  divider: '#C7C7CC',
};

export default function ProfileSettingsScreen() {
  const router = useRouter(); // ★追加2：リモコンの準備
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [bodyFat, setBodyFat] = useState('');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        contentInsetAdjustmentBehavior="never" // ★修正：プロパティをタグの中に正しく配置
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* --- ヘッダー（タイトル） --- */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>プロフィール設定</Text>
        </View>

        {/* --- 入力フォーム --- */}
        <View style={styles.formContainer}>
          {/* 名前 */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>名前</Text>
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
        <TouchableOpacity 
          style={styles.saveButton} 
          onPress={() => router.replace('/(tabs)/home')} // ★追加3：ボタンを押したらホームへ！
        >
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
  formContainer: {
    gap: 10,
    marginBottom: 40,
  },
  inputGroup: {
    backgroundColor: COLORS.grayBackground,
    borderRadius: 15,
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
    marginBottom: 5,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginBottom: 10,
  },
  input: {
    fontSize: 16,
    color: COLORS.text,
    paddingVertical: 5,
  },
  saveButton: {
    backgroundColor: COLORS.primaryGreen,
    paddingVertical: 18,
    borderRadius: 30, 
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
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