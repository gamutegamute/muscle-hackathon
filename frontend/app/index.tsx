import { useRouter } from 'expo-router';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Image, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { workoutData } from '@/app/globalState';
import { getProfile } from '@/lib/api';
import { logoutFromFirebase } from '@/lib/auth';
import { clearGuestSessionMarker, startNewGuestSession } from '@/lib/guest-session';
import { syncWorkoutData } from '@/lib/workout-sync';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

WebBrowser.maybeCompleteAuthSession();

const APP_ICON = require('../assets/images/muscloop-logo.png');
const GOOGLE_ICON = require('../assets/images/google-g.png');

type AuthMode = 'login' | 'signup';

function getFriendlyAuthError(error: unknown, mode: AuthMode) {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code?: unknown }).code)
      : '';

  switch (code) {
    case 'auth/weak-password':
      return '\u30d1\u30b9\u30ef\u30fc\u30c9\u306f6\u6587\u5b57\u4ee5\u4e0a\u3067\u5165\u529b\u3057\u3066\u304f\u3060\u3055\u3044\u3002';
    case 'auth/email-already-in-use':
      return '\u3053\u306e\u30e1\u30fc\u30eb\u30a2\u30c9\u30ec\u30b9\u306f\u65e2\u306b\u767b\u9332\u3055\u308c\u3066\u3044\u307e\u3059\u3002\u30ed\u30b0\u30a4\u30f3\u3092\u8a66\u3057\u3066\u304f\u3060\u3055\u3044\u3002';
    case 'auth/invalid-email':
      return '\u30e1\u30fc\u30eb\u30a2\u30c9\u30ec\u30b9\u306e\u5f62\u5f0f\u3092\u78ba\u8a8d\u3057\u3066\u304f\u3060\u3055\u3044\u3002';
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return '\u30e1\u30fc\u30eb\u30a2\u30c9\u30ec\u30b9\u307e\u305f\u306f\u30d1\u30b9\u30ef\u30fc\u30c9\u304c\u9055\u3044\u307e\u3059\u3002';
    case 'auth/network-request-failed':
      return '\u901a\u4fe1\u306b\u5931\u6557\u3057\u307e\u3057\u305f\u3002\u30cd\u30c3\u30c8\u30ef\u30fc\u30af\u63a5\u7d9a\u3092\u78ba\u8a8d\u3057\u3066\u304f\u3060\u3055\u3044\u3002';
    default:
      if (error instanceof Error && error.message) {
        return error.message;
      }
      return mode === 'signup'
        ? '\u65b0\u898f\u767b\u9332\u306b\u5931\u6557\u3057\u307e\u3057\u305f\u3002\u5165\u529b\u5185\u5bb9\u3092\u78ba\u8a8d\u3057\u3066\u304f\u3060\u3055\u3044\u3002'
        : '\u30ed\u30b0\u30a4\u30f3\u306b\u5931\u6557\u3057\u307e\u3057\u305f\u3002\u5165\u529b\u5185\u5bb9\u3092\u78ba\u8a8d\u3057\u3066\u304f\u3060\u3055\u3044\u3002';
  }
}

type GoogleLoginButtonProps = {
  disabled: boolean;
  onLoginSuccess: (userId: string) => Promise<void>;
};

function GoogleIcon() {
  return <Image source={GOOGLE_ICON} style={styles.googleIconImage} />;
}

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
      <GoogleIcon />
      <Text style={styles.googleButtonText}>Googleで続ける</Text>
    </TouchableOpacity>
  );
}

export default function App() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState('');
  const router = useRouter();

  const isEmailValid = useMemo(() => EMAIL_REGEX.test(email.trim()), [email]);

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
    async (userId: string, idToken?: string) => {
      await clearGuestSessionMarker();
      workoutData.setSessionMode('registered');
      workoutData.setUserProfile({ userId });

      if (idToken) {
        // 今後ここにトークンを共通設定に保存する処理を入れます
        console.log("Firebase ID Tokenを保持しました:", idToken);
      }

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
    try {
      await logoutFromFirebase();
    } catch {
      // Firebaseにログインしていない場合はそのままゲスト開始する。
    }
    workoutData.resetData({ sessionMode: 'logged_out' });
    await startNewGuestSession();
    router.replace('/profile');
  };
  
  const handleEmailAuth = async () => {
    const normalizedEmail = email.trim();
    setAuthError('');

    if (!normalizedEmail || !password) {
      setAuthError('\u30e1\u30fc\u30eb\u30a2\u30c9\u30ec\u30b9\u3068\u30d1\u30b9\u30ef\u30fc\u30c9\u3092\u5165\u529b\u3057\u3066\u304f\u3060\u3055\u3044\u3002');
      Alert.alert('入力エラー', 'メールアドレスとパスワードを入力してください。');
      return;
    }

    if (password.length < 6) {
      setAuthError('\u30d1\u30b9\u30ef\u30fc\u30c9\u306f6\u6587\u5b57\u4ee5\u4e0a\u3067\u5165\u529b\u3057\u3066\u304f\u3060\u3055\u3044\u3002');
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

      const idToken = await credential.user.getIdToken();

      // ⭕️ completeLogin に uid と一緒に idToken も渡す！
      await completeLogin(credential.user.uid, idToken);
    } catch (error) {
      const fallbackMessage = mode === 'signup' ? '新規登録に失敗しました。' : 'ログインに失敗しました。';
      const message = error instanceof Error ? getFriendlyAuthError(error, mode) : fallbackMessage;
      setAuthError(message);
      Alert.alert(mode === 'signup' ? '新規登録エラー' : 'ログインエラー', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendPasswordReset = async () => {
    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      Alert.alert('入力エラー', 'メールアドレスを入力してください。');
      return;
    }

    setIsSubmitting(true);
    try {
      const { sendPasswordResetEmailToUser } = await import('@/lib/auth');
      await sendPasswordResetEmailToUser(normalizedEmail);
      Alert.alert('送信完了', 'パスワード再設定メールを送信しました。');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'パスワード再設定メールの送信に失敗しました。';
      Alert.alert('送信エラー', message);
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
            {mode === 'login' && isEmailValid && (
              <TouchableOpacity style={styles.forgotPasswordButton} onPress={() => void handleSendPasswordReset()}>
                <Text style={styles.forgotPasswordText}>パスワードを忘れた場合</Text>
              </TouchableOpacity>
            )}
            {authError ? <Text style={styles.errorText}>{authError}</Text> : null}
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
              <GoogleIcon />
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
  forgotPasswordButton: {
    marginTop: 8,
    alignSelf: 'flex-end',
  },
  forgotPasswordText: {
    color: '#007aff',
    fontSize: 13,
    fontWeight: '600',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    marginTop: 8,
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
  googleIconImage: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
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
