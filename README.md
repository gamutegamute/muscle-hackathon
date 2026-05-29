# muscloop

muscloopは、筋トレを「考える」「記録する」「続ける」まで支援するトレーニング継続アプリです。
AI相談、トレーニング記録、実績、フレンド、ランキングをひとつにまとめ、初心者でも迷わず継続できる体験を目指しています。

技育博の展示では、Web版を入口にしつつ、Expo/React Nativeでスマホアプリとしても動く構成を説明できます。

## 公開URL

- Web: https://muscle-hackathon.vercel.app/
- Backend: http://muscloop-backend-alb-161585801.ap-northeast-1.elb.amazonaws.com
- Backend health: http://muscloop-backend-alb-161585801.ap-northeast-1.elb.amazonaws.com/health

Vercel上のHTTPSページからHTTPのALBを直接叩くとMixed Contentになるため、Web版ではVercelのrewritesで `/api/*` 経由にしています。

## できること

- メール/パスワード認証
- ゲスト利用
- プロフィール登録
- 筋トレ記録
- タイマー/ストップウォッチ記録
- 今日の記録、累計時間、連続日数、カレンダー表示
- 実績/バッジ
- AIトレーナー相談
- フレンド検索、申請、承認、一覧、詳細
- フレンドランキング
- Expo Push Notifications
- Web公開とAWS上のFastAPIバックエンド連携

## 技術構成

### Frontend

- Expo
- React Native
- React Native Web
- Expo Router
- TypeScript
- Firebase Authentication
- Expo Push Notifications

### Backend

- FastAPI
- Python
- Firebase Admin SDK
- Firestore
- Gemini API
- Docker

### Hosting / Infrastructure

- Vercel: Web frontend
- AWS ECS/Fargate: Backend container
- Amazon ECR: Docker image registry
- Application Load Balancer: Backend public entrypoint
- CloudWatch Logs: Backend logs
- AWS Secrets Manager: Gemini API key and Firebase service account

## システム構成

```text
User
  |
  | Web / iOS / Android
  v
Expo React Native app
  |
  | HTTPS on Vercel: /api/*
  | Native/local: EXPO_PUBLIC_API_BASE_URL
  v
FastAPI backend on ECS Fargate
  |
  +-- Firebase Authentication
  +-- Firestore
  +-- Gemini API
  +-- Expo Push Notifications
```

## デモで見せやすい流れ

1. Web版を開く
2. ゲストで入る、または登録済みユーザーでログインする
3. AIトレーナーに「脚トレしたい」「いい腕立ての方法ある？」などを相談する
4. 記録画面でトレーニングを保存する
5. ホームで今日の記録、累計時間、連続日数を見る
6. フレンド画面で検索、申請、ランキングを見る
7. 実績やバッジで継続支援の仕組みを説明する

より詳しい当日用の説明は [docs/DEMO_DAY_GUIDE.md](docs/DEMO_DAY_GUIDE.md) にまとめています。

## ローカル開発

作業する本命リポジトリ:

```powershell
cd C:\dev\muscle-hackathon
```

OneDrive側の古いクローンと間違えないようにしてください。

### Backend

```powershell
cd C:\dev\muscle-hackathon\backend
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload
```

必要なもの:

- `backend/.env`
- `backend/serviceAccountKey.json`
- `GEMINI_API_KEY`

確認:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/health
```

### Frontend

```powershell
cd C:\dev\muscle-hackathon\frontend
npm install
npx expo start
```

Webビルド確認:

```powershell
npx.cmd expo export --platform web
```

## 環境変数

Frontendは `frontend/.env.example`、Backendは `backend/.env.example` を参照してください。
FirebaseやGeminiのキーはGitに含めません。

主なFrontend環境変数:

- `EXPO_PUBLIC_API_BASE_URL`
- `EXPO_PUBLIC_FIREBASE_API_KEY`
- `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
- `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `EXPO_PUBLIC_FIREBASE_APP_ID`
- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`
- `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`
- `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`
- `EXPO_PUBLIC_EAS_PROJECT_ID`

主なBackend環境変数:

- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- `GEMINI_FALLBACK_MODEL`
- `ADMIN_API_TOKEN`
- `FIREBASE_SERVICE_ACCOUNT_JSON`

## よく使う確認コマンド

```powershell
cd C:\dev\muscle-hackathon
git status --short --branch
```

```powershell
cd C:\dev\muscle-hackathon\frontend
npx.cmd eslint app\index.tsx --no-cache
npx.cmd expo export --platform web
```

```powershell
cd C:\dev\muscle-hackathon\backend
.\venv\Scripts\python.exe -m compileall app
```

## ドキュメント

- [docs/DEMO_DAY_GUIDE.md](docs/DEMO_DAY_GUIDE.md): 技育博本番で説明する内容、デモ手順、想定質問
- [docs/OPERATIONS.md](docs/OPERATIONS.md): Vercel/AWS/Firebase/デプロイ/運用メモ
- [QA_CHECKLIST.md](QA_CHECKLIST.md): 本番前の動作確認チェックリスト
- [SETUP_MANUAL.md](SETUP_MANUAL.md): ローカルセットアップ手順
- [backend/DOCKER.md](backend/DOCKER.md): Backend Docker起動手順

## 注意点

- GitHubにpushするとVercelのWeb版は自動デプロイされます。
- Backend変更はGitHub pushだけではAWSに反映されません。Docker build/pushとECS redeployが必要です。
- WebではHealthKit、ネイティブ通知、SecureStore系、一部画像URI、自動音声再生に制限があります。
- 現在のプロフィール画像共有は暫定対応です。本格対応はFirebase Storageに画像を保存し、FirestoreにはURLだけ保存する方針です。
