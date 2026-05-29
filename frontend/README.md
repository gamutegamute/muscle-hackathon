# muscloop frontend

Expo / React Native / Expo Router / TypeScriptで作られたmuscloopのフロントエンドです。Expo WebとしてVercelにも公開しています。

## 起動

```powershell
cd C:\dev\muscle-hackathon\frontend
npm install
npx expo start
```

## Webビルド

```powershell
npx.cmd expo export --platform web
```

Vercel設定:

- Root Directory: `frontend`
- Build Command: `npx expo export --platform web`
- Output Directory: `dist`
- Install Command: `npm install`

## API接続

ローカルBackend:

```env
EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```

実機からローカルBackendを見る場合:

```env
EXPO_PUBLIC_API_BASE_URL=http://192.168.x.x:8000
```

AWS Backend:

```env
EXPO_PUBLIC_API_BASE_URL=http://muscloop-backend-alb-161585801.ap-northeast-1.elb.amazonaws.com
```

Web公開版ではMixed Contentを避けるため、HTTPS上でAPI URLがHTTPの場合は `/api` 経由で呼びます。Vercel rewritesは `frontend/vercel.json` にあります。

## 主な画面

- `app/index.tsx`: ログイン、新規登録、ゲストログイン、パスワード再設定
- `app/(tabs)/home.tsx`: ホーム
- `app/(tabs)/kiroku.tsx`: 記録
- `app/(tabs)/ai.tsx`: AIトレーナー
- `app/(tabs)/friends/*`: フレンド、申請、検索、ランキング、詳細
- `app/(tabs)/settei.tsx`: 設定
- `app/profile.tsx`: プロフィール

## 注意

- WebではHealthKit、ネイティブ通知、SecureStore系、一部画像URI、自動音声再生に制限があります。
- `blob:` 画像URIはNativeで表示しないようにしています。安全に表示できるURI判定は `lib/avatar.ts` を見てください。
- 画像共有の本格対応はFirebase Storageに寄せる予定です。
