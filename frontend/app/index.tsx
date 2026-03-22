import { useRouter } from 'expo-router'; //追加：移動用ツールインポート
import React, { useState } from 'react';
import { Image, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { workoutData } from './globalState';

export default function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const router = useRouter(); //追加：移動用リモコンの準備

  const handleGuestLogin = () => {
    router.replace('/profile') //ゲストログインなので戻るボタンは未実装
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled" // ★追加：キーボードのタップ判定を安定させる魔法
        contentInsetAdjustmentBehavior="never"
        showsVerticalScrollIndicator={false}
      >
        {/* --- ヘッダー・ロゴ --- */}
        <View style={styles.frameOne}>
          <View style={styles.frameTwo}>
            <Text style={styles.placeholder}>仮</Text>
          </View>
          <Text style={styles.appName}>アプリ名</Text>
          <Text style={styles.subTitle}>サブタイトル</Text>
        </View>

        {/* --- フォーム --- */}
        <View style={styles.frameThree}>
          <View style={styles.formFields}>
            <Text style={styles.fieldLabel}>メールアドレス</Text>
            {/* ★変更：影や余計なレイアウトを消した専用スタイルを適用 */}
            <TextInput
              style={styles.inputField}
              placeholder="example@email.com"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={[styles.fieldLabel, styles.passwordLabel]}>パスワード</Text>
            <TextInput
              style={styles.inputField}
              placeholder="パスワードを入力"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={true} 
            />
          </View>

          {/* ログインボタン */}
          <TouchableOpacity style={styles.loginButton} activeOpacity={0.8}>
            <Text style={styles.loginButtonLabel}>login</Text>
          </TouchableOpacity>
        </View>

        {/* --- フッター --- */}
        <View style={styles.frameFive}>
          <View style={styles.frameSix}>
            <View style={styles.frameSeven}>
              <TouchableOpacity style={styles.link}>
                <Text style={styles.linkText}>新規登録はこちら</Text>
              </TouchableOpacity>

              {/* 区切り線 */}
              <View style={styles.orGroup}>
                <View style={styles.line} />
                <Text style={styles.orText}>又は</Text>
                <View style={styles.line} />
              </View>
            </View>

            {/* Googleボタン */}
            <TouchableOpacity style={styles.googleButton} activeOpacity={0.8}>
              <Image
                source={{ uri: 'https://codia-f2c.s3.us-west-1.amazonaws.com/image/2026-03-19/bzkXkguV7T.png' }}
                style={styles.googleIcon}
              />
              <Text style={styles.googleButtonText}>Googleで続ける</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={handleGuestLogin}>
            <Text style={styles.guestText}>登録せずに始める（ゲスト）</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f2f2f7',
  },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 50,
    gap: 10,
    backgroundColor: '#f2f2f7',
  },
  // Header
  frameOne: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
    width: 162,
  },
  frameTwo: {
    width: 100,
    height: 100,
    backgroundColor: '#8ac75a',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  placeholder: {
    fontFamily: 'System',
    fontSize: 48,
    fontWeight: '400',
    color: '#030303',
  },
  appName: {
    width: 162,
    fontFamily: 'System',
    fontSize: 40,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
  },
  subTitle: {
    fontFamily: 'System',
    fontSize: 12,
    fontWeight: '400',
    color: '#000000',
    textAlign: 'center',
  },
  // Form
  frameThree: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 20,
    width: 350,
  },
  formFields: {
    width: 350,
    gap: 5,
    flexDirection: 'column',
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    fontFamily: 'System',
    marginBottom: 5,
    marginTop: 10,
  },
  passwordLabel: {
    marginTop: 6,
  },
  // ★追加：タッチを邪魔しない純粋な入力欄のスタイル
  inputField: {
    width: 350,
    height: 48, // 少し高さを広げてタップしやすくしました
    paddingHorizontal: 20,
    backgroundColor: '#EAEAEA', // デザインより少しだけ色を濃くして分かりやすく
    borderRadius: 25,
    fontSize: 16,
    color: '#333',
  },
  // Login button
  loginButton: {
    width: 350,
    height: 48,
    backgroundColor: '#8ac75a',
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  loginButtonLabel: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'System',
  },
  // Footer
  frameFive: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 25,
    width: 350,
    marginTop: 20,
  },
  frameSix: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 30,
    width: 350,
  },
  frameSeven: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 25,
    width: 350,
  },
  link: {
    paddingHorizontal: 3,
    height: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  linkText: {
    color: '#007aff',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'System',
    textAlign: 'center',
  },
  orGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 350,
    height: 30,
    gap: 8,
  },
  line: {
    flex: 1,
    height: 1.5,
    backgroundColor: '#c7c7cc',
  },
  orText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000000',
    fontFamily: 'System',
    textAlign: 'center',
  },
  // Google button
  googleButton: {
    flexDirection: 'row',
    width: 350,
    height: 40,
    backgroundColor: '#dadce0',
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  googleIcon: {
    width: 29,
    height: 29,
    resizeMode: 'cover',
  },
  googleButtonText: {
    fontSize: 17,
    color: '#000000',
    fontFamily: 'System',
    textAlign: 'center',
  },
  // Guest
  guestText: {
    width: 350,
    fontSize: 15,
    fontWeight: '500',
    color: '#000000',
    fontFamily: 'System',
    textAlign: 'center',
    lineHeight: 20,
  },
});