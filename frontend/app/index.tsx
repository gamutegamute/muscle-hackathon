import { useRouter } from 'expo-router';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Image, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { workoutData } from '@/app/globalState';
import { getProfile } from '@/lib/api';
import { ensureGuestUserId } from '@/lib/guest-session';
import { syncWorkoutData } from '@/lib/workout-sync';

WebBrowser.maybeCompleteAuthSession();

const APP_ICON = require('../assets/images/muscloop-logo.png');

type AuthMode = 'login' | 'signup';

type GoogleLoginButtonProps = {
  disabled: boolean;
  onLoginSuccess: (userId: string) => Promise<void>;
};

function GoogleLoginButton({ disabled, onLoginSuccess }: GoogleLoginButtonProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    scopes: ['profile', 'email'],
  });

  useEffect(() => {
    if (response?.type !== 'success') {
      return;
    }

    const idToken = response.params?.id_token;
    if (!idToken) {
      Alert.alert('Googleログインエラー', 'Google の ID トークンを取得できませんでした。');
      return;
    }

    const run = async () => {
      setIsSubmitting(true);
      try {
        const { loginWithGoogleIdToken } = await import('@/lib/auth');
        const credential = await loginWithGoogleIdToken(idToken);
        await onLoginSuccess(credential.user.uid);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Googleログインに失敗しました。';
        Alert.alert('Googleログインエラー', message);
      } finally {
        setIsSubmitting(false);
      }
    };

    void run();
  }, [onLoginSuccess, response]);

  return (
    <TouchableOpacity
      style={[styles.googleButton, (disabled || isSubmitting) && styles.disabledButton]}
      activeOpacity={0.8}
      onPress={() => void promptAsync()}
      disabled={disabled || isSubmitting || !request}>
      <Text style={styles.googleMark}>G</Text>
      <Text style={styles.googleButtonText}>Googleで続ける</Text>
    </TouchableOpacity>
  );
}

export default function App() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const hasGoogleClientConfig = useMemo(() => {
    if (Platform.OS === 'ios') {
      return Boolean(process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID);
    }
    if (Platform.OS === 'android') {
      return Boolean(process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID);
    }
    return Boolean(process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID);
  }, []);

  const completeLogin = useCallback(
    async (userId: string) => {
      workoutData.setUserProfile({ userId });

      try {
        await getProfile(userId);
        await syncWorkoutData();
        router.replace('/(tabs)/home');
      } catch {
        router.replace('/profile');
      }
    },
    [router],
  );

  const handleGuestLogin = async () => {
    await ensureGuestUserId();
    router.replace('/profile');
  };

  const handleEmailAuth = async () => {
    const normalizedEmail = email.trim();

    if (!normalizedEmail || !password) {
      Alert.alert('入力エラー', 'メールアドレスとパスワードを入力してください。');
      return;
    }

    if (password.length < 6) {
      Alert.alert('入力エラー', 'パスワードは6文字以上で入力してください。');
      return;
    }

    setIsSubmitting(true);
    try {
      const { loginWithEmail, registerWithEmail } = await import('@/lib/auth');
      const credential =
        mode === 'signup'
          ? await registerWithEmail(normalizedEmail, password)
          : await loginWithEmail(normalizedEmail, password);

      await completeLogin(credential.user.uid);
    } catch (error) {
      const fallbackMessage = mode === 'signup' ? '新規登録に失敗しました。' : 'ログインに失敗しました。';
      const message = error instanceof Error ? error.message : fallbackMessage;
      Alert.alert(mode === 'signup' ? '新規登録エラー' : 'ログインエラー', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="never"
        showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.logoFrame}>
            <Image source={APP_ICON} style={styles.appIcon} />
          </View>
          <Text style={styles.appName}>muscloop</Text>
          <Text style={styles.subTitle}>毎日の筋トレを、無理なく続ける。</Text>
        </View>

        <View style={styles.formArea}>
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
              autoCorrect={false}
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

          <TouchableOpacity
            style={[styles.primaryButton, isSubmitting && styles.disabledButton]}
            activeOpacity={0.8}
            onPress={() => void handleEmailAuth()}
            disabled={isSubmitting}>
            <Text style={styles.primaryButtonText}>{mode === 'signup' ? '新規登録' : 'ログイン'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.secondaryArea}>
          <TouchableOpacity style={styles.link} onPress={() => setMode(mode === 'login' ? 'signup' : 'login')}>
            <Text style={styles.linkText}>
              {mode === 'login' ? '新規登録はこちら' : 'すでにアカウントをお持ちの方はこちら'}
            </Text>
          </TouchableOpacity>

          <View style={styles.orGroup}>
            <View style={styles.line} />
            <Text style={styles.orText}>または</Text>
            <View style={styles.line} />
          </View>

          {hasGoogleClientConfig ? (
            <GoogleLoginButton disabled={isSubmitting} onLoginSuccess={completeLogin} />
          ) : (
            <TouchableOpacity
              style={[styles.googleButton, styles.disabledButton]}
              activeOpacity={0.8}
              onPress={() =>
                Alert.alert(
                  'Googleログイン未設定',
                  'この端末向けの Google client ID がまだ設定されていません。メール/パスワードかゲスト利用を先に使えます。',
                )
              }>
              <Text style={styles.googleMark}>G</Text>
              <Text style={styles.googleButtonText}>Googleで続ける</Text>
            </TouchableOpacity>
          )}

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
    gap: 18,
    backgroundColor: '#f2f2f7',
  },
  hero: {
    alignItems: 'center',
    gap: 10,
    width: 220,
  },
  logoFrame: {
    width: 128,
    height: 128,
    backgroundColor: 'transparent',
    borderRadius: 24,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: 36,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
  },
  subTitle: {
    width: 220,
    fontSize: 12,
    fontWeight: '400',
    color: '#000000',
    textAlign: 'center',
  },
  formArea: {
    alignItems: 'center',
    gap: 20,
    width: 350,
  },
  formFields: {
    width: 350,
    gap: 5,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
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
    backgroundColor: '#eaeaea',
    borderRadius: 25,
    fontSize: 16,
    color: '#333333',
  },
  primaryButton: {
    width: 350,
    height: 48,
    backgroundColor: '#8ac75a',
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
  },
  secondaryArea: {
    alignItems: 'flex-start',
    gap: 25,
    width: 350,
    marginTop: 10,
  },
  link: {
    alignSelf: 'center',
    paddingHorizontal: 3,
    minHeight: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  linkText: {
    color: '#007aff',
    fontSize: 13,
    fontWeight: '600',
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
  googleMark: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4285f4',
  },
  googleButtonText: {
    fontSize: 17,
    color: '#000000',
    textAlign: 'center',
  },
  guestText: {
    width: 350,
    fontSize: 15,
    fontWeight: '500',
    color: '#000000',
    textAlign: 'center',
    lineHeight: 20,
  },
  disabledButton: {
    opacity: 0.6,
  },
});
