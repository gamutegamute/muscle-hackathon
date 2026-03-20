import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';

const COLORS = {
  primaryGreen: '#A4C639',
  background: '#F5F5F5',
  white: '#FFFFFF',
  text: '#333333',
  grayBackground: '#E0E0E0',
  grayText: '#757575',
  divider: '#C7C7CC',
};

const API_BASE_URL = 'http://localhost:8000';
// 実機で試すときは localhost ではなく、自分のPCのIPアドレスに変える
// 例: const API_BASE_URL = 'http://192.168.1.10:8000';

export default function ProfileSettingsScreen() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('入力エラー', '名前を入力してください');
      return;
    }

    const payload = {
      userId: 'test-user-001',
      name: name.trim(),
      age: age ? Number(age) : 0,
      height: height ? Number(height) : 0,
      weight: weight ? Number(weight) : 0,
      bodyFat: bodyFat ? Number(bodyFat) : 0,
    };

    try {
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        console.log('profile save error:', data);
        Alert.alert('保存失敗', data?.detail || 'プロフィールの保存に失敗しました');
        return;
      }

      console.log('profile save success:', data);
      Alert.alert('保存成功', 'プロフィールを保存しました');

      // 記録画面へ遷移
      router.push('/kiroku');
      // もしファイル構成が app/(tabs)/record.tsx などなら
      // router.push('/(tabs)/record');
    } catch (error) {
      console.log('network error:', error);
      Alert.alert('通信エラー', 'サーバーに接続できませんでした');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        contentInsetAdjustmentBehavior="never"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>プロフィール設定</Text>
        </View>

        <View style={styles.formContainer}>
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

        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? '保存中...' : '保存して始める'}
          </Text>
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
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 18,
  },
});