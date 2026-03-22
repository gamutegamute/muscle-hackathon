//最初のplofile設定画面
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { 
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

  // ★ 追加：入力されたデータをglobalStateに保存してからホームへ移動する処理
  const handleSave = () => {
    workoutData.setUserProfile({
      name: name || '筋肉太郎', // 空欄の場合はデフォルト値
      age: age || '20',
      height: height || '170',
      weight: weight || '65.5',
      bodyFat: bodyFat || '18.5',
    });
    router.replace('/(tabs)/home');
  };

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
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>保存して始める</Text>
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