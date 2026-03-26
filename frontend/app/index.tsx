import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Image, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { ensureGuestUserId } from '@/lib/guest-session';

const APP_ICON = require('../assets/images/muscloop-logo.png');

export default function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleGuestLogin = async () => {
    await ensureGuestUserId();
    router.replace('/profile');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="never"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.frameOne}>
          <View style={styles.frameTwo}>
            <Image source={APP_ICON} style={styles.appIcon} />
          </View>
          <Text style={styles.appName}>muscloop</Text>
          <Text style={styles.subTitle}>毎日の筋トレを、無理なく続ける。</Text>
        </View>

        <View style={styles.frameThree}>
          <View style={styles.formFields}>
            <Text style={styles.fieldLabel}>メールアドレス</Text>
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
              secureTextEntry
            />
          </View>

          <TouchableOpacity style={styles.loginButton} activeOpacity={0.8}>
            <Text style={styles.loginButtonLabel}>login</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.frameFive}>
          <View style={styles.frameSix}>
            <View style={styles.frameSeven}>
              <TouchableOpacity style={styles.link}>
                <Text style={styles.linkText}>新規登録はこちら</Text>
              </TouchableOpacity>

              <View style={styles.orGroup}>
                <View style={styles.line} />
                <Text style={styles.orText}>又は</Text>
                <View style={styles.line} />
              </View>
            </View>

            <TouchableOpacity style={styles.googleButton} activeOpacity={0.8}>
              <Image
                source={{ uri: 'https://codia-f2c.s3.us-west-1.amazonaws.com/image/2026-03-19/bzkXkguV7T.png' }}
                style={styles.googleIcon}
              />
              <Text style={styles.googleButtonText}>Googleで続ける</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => void handleGuestLogin()}>
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
  frameOne: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
    width: 220,
  },
  frameTwo: {
    width: 128,
    height: 128,
    backgroundColor: 'transparent',
    borderRadius: 24,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  appIcon: {
    width: 128,
    height: 128,
    resizeMode: 'cover',
  },
  appName: {
    width: 220,
    fontFamily: 'System',
    fontSize: 36,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
  },
  subTitle: {
    width: 220,
    fontFamily: 'System',
    fontSize: 12,
    fontWeight: '400',
    color: '#000000',
    textAlign: 'center',
  },
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
  inputField: {
    width: 350,
    height: 48,
    paddingHorizontal: 20,
    backgroundColor: '#EAEAEA',
    borderRadius: 25,
    fontSize: 16,
    color: '#333',
  },
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
