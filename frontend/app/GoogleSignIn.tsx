import * as React from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithCredential, 
  User 
} from 'firebase/auth';
import { Button, Text, View } from 'react-native';

// WebBrowserのリダイレクトを有効化（これがないとポップアップから戻ってこれません）
WebBrowser.maybeCompleteAuthSession();

// 💡 既存のFirebase初期化コードを使用してください
const firebaseConfig = { /* あなたのFirebase設定 */ };
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export default function GoogleSignInScreen() {
  // Google Developer Consoleなどで発行したクライアントIDを設定します
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: 'XXXXXX-YOUR-WEB-CLIENT-ID.apps.googleusercontent.com',
    iosClientId: 'XXXXXX-YOUR-IOS-CLIENT-ID.apps.googleusercontent.com',
    androidClientId: 'XXXXXX-YOUR-ANDROID-CLIENT-ID.apps.googleusercontent.com',
  });

  React.useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      if (authentication?.idToken) {
        // 1. Googleから取得したトークンでFirebaseにサインイン
        const credential = GoogleAuthProvider.credential(authentication.idToken);
        signInWithCredential(auth, credential)
          .then(async (userCredential) => {
            // 2. Firebaseへのログイン成功！
            const user: User = userCredential.user;
            
            // 🔑 【ここが最重要！】バックエンドへ送るための Firebase ID Token を取得
            const firebaseIdToken = await user.getIdToken();
            
            // 3. このトークンをバックエンドのAPI（FastAPI）に送信する
            await sendTokenToBackend(firebaseIdToken);
          })
          .catch((error) => {
            console.error("FirebaseへのGoogle認証連携に失敗:", error);
          });
      }
    }
  }, [response]);

  // バックエンドにトークンをBearerヘッダーで送る関数
  const sendTokenToBackend = async (token: string) => {
    try {
      const res = await fetch('http://192.168.X.X:8000/users/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`, // ⭕️ bodyではなくヘッダーに格納！
        },
      });
      const data = await res.json();
      console.log("バックエンドからのレスポンス:", data);
    } catch (err) {
      console.error("API通信エラー:", err);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Button
        disabled={!request}
        title="Googleでログイン"
        onPress={() => {
          promptAsync(); // Googleのログイン画面（ブラウザ）を起動
        }}
      />
    </View>
  );
}