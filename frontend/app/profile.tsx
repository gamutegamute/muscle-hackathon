import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const COLORS = {
  primaryGreen: '#A4C639',
  background: '#F5F5F5',
  white: '#FFFFFF',
  text: '#333333',
  grayBackground: '#E0E0E0',
  grayText: '#757575',
  divider: '#C7C7CC',
};

// ここを自分のPCのIPに変える
const API_BASE_URL = 'http://192.168.2.191:8000';

// ひとまず固定
const USER_ID = 'test-user-001';

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
      Alert.alert('入力エラー', '名前は必須です');
      return;
    }

    try {
      setLoading(true);

      const payload = {
        userId: USER_ID,
        name: name.trim(),
        age: age ? Number(age) : 0,
        height: height ? Number(height) : 0,
        weight: weight ? Number(weight) : 0,
        bodyFat: bodyFat ? Number(bodyFat) : 0,
      };

      const response = await fetch(`${API_BASE_URL}/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.log('profile save error:', errorText);
        throw new Error('プロフィール保存に失敗しました');
      }

      const result = await response.json();
      console.log('プロフィール保存成功:', result);

      Alert.alert('保存成功', 'プロフィールを保存しました');
      router.replace('/(tabs)/home');
    } catch (error) {
      console.error(error);
      Alert.alert(
        '通信エラー',
        'プロフィール保存に失敗しました。\nAPI URLやバックエンド起動状態を確認してください。'
      );
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
              keyboardType="numeric"
              value={bodyFat}
              onChangeText={setBodyFat}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, loading && styles.disabledButton]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.saveButtonText}>保存して始める</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  header: { paddingTop: 40, paddingBottom: 30, alignItems: 'center' },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: COLORS.text },
  formContainer: { gap: 10, marginBottom: 40 },
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
    marginTop: 30,
  },
  disabledButton: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 18,
  },
});