//最初のplofile設定画面
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { 
  Alert,
  SafeAreaView, 
  ScrollView, 
  StyleSheet, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  View,
  KeyboardAvoidingView, // ★ 追加
  Platform // ★ 追加
} from 'react-native';
import { workoutData } from './globalState'; // パスはご自身の環境に合わせてください

import * as Notifications from 'expo-notifications';
import { saveProfileToBackend, syncWorkoutData } from '../lib/workout-sync';
import Constants from 'expo-constants'; 

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
  const router = useRouter();
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // ★ 追加：入力されたデータをglobalStateに保存してからホームへ移動する処理
 // ★ handleSave の中身をスッキリ整理
  const handleSave = async () => {
    setIsSaving(true);
    try {
      // 1. まず「トークン」を取得する
      let token = "string"; 
      try {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status === 'granted') {
          const expoToken = await Notifications.getExpoPushTokenAsync({
            projectId: "f0c47ccd-8cea-4ddd-9c93-009e18c38962", 
          });
          token = expoToken.data;
          console.log("📱 取得したトークン:", token);
        }
      } catch (e) {
        console.log("トークン取得失敗:", e);
      }

      // 2. 送信するデータを作成
      const profileData = {
        name: name || '筋肉太郎',
        age: Number(age) || 20,
        height: Number(height) || 170,
        weight: Number(weight) || 65.5,
        bodyFat: Number(bodyFat) || 18.5,
        expoPushToken: token,
      };

      // 3. 送り先URLを決定（Constantsを使って自動判別）
      const debuggerHost = Constants.expoConfig?.hostUri?.split(':')[0];
      let backendUrl;

      if (debuggerHost) {
        if (debuggerHost.includes('exp.direct')) {
          backendUrl = `https://${debuggerHost}/profile/guest-user`;
        } else {
          backendUrl = `http://${debuggerHost}:8000/profile/guest-user`;
        }
      } else {
        backendUrl = `http://localhost:8000/profile/guest-user`;
      }

      console.log("🚀 送信先URL:", backendUrl);

      // 4. サーバー送信
      await fetch(backendUrl, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      });

      // 5. ローカル状態保存と画面遷移
      workoutData.setUserProfile(profileData);
      await syncWorkoutData();
      router.replace('/(tabs)/home');

    } catch (error) {
      console.error("保存失敗:", error);
      Alert.alert('保存エラー', '通信に失敗しました。バックエンドを確認してください。');
    } finally {
      setIsSaving(false);
    }
  }; // ★ ここでしっかり閉じる！


  return (
    <SafeAreaView style={styles.container}>
      {/* ★ キーボード対策を追加（Androidの透明化を防ぐためbehaviorはundefinedに） */}
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
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
              <TextInput style={styles.input} placeholder="名前" value={name} onChangeText={setName} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>年齢</Text>
              <View style={styles.divider} />
              <TextInput style={styles.input} placeholder="年齢" keyboardType="numeric" value={age} onChangeText={setAge} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>身長</Text>
              <View style={styles.divider} />
              <TextInput style={styles.input} placeholder="身長" keyboardType="numeric" value={height} onChangeText={setHeight} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>体重</Text>
              <View style={styles.divider} />
              <TextInput style={styles.input} placeholder="体重" keyboardType="numeric" value={weight} onChangeText={setWeight} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>体脂肪率</Text>
              <View style={styles.divider} />
              <TextInput style={styles.input} placeholder="体脂肪率" keyboardType="numeric" value={bodyFat} onChangeText={setBodyFat} />
            </View>
          </View>

          {/* ★ 修正：onPressを handleSave に変更 */}
          <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={isSaving}>
            <Text style={styles.saveButtonText}>{isSaving ? '保存中...' : '保存して始める'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  header: { paddingTop: 40, paddingBottom: 30, alignItems: 'center' },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: COLORS.text },
  formContainer: { gap: 10, marginBottom: 40 },
  inputGroup: { backgroundColor: COLORS.grayBackground, borderRadius: 15, paddingHorizontal: 20, paddingVertical: 15, marginBottom: 10 },
  inputLabel: { fontSize: 16, color: COLORS.text, fontWeight: '500', marginBottom: 5 },
  divider: { height: 1, backgroundColor: COLORS.divider, marginBottom: 10 },
  input: { fontSize: 16, color: COLORS.text, paddingVertical: 5 },
  saveButton: { backgroundColor: COLORS.primaryGreen, paddingVertical: 18, borderRadius: 30, alignItems: 'center', marginTop: 30 },
  saveButtonText: { color: COLORS.white, fontWeight: 'bold', fontSize: 18 },
});
