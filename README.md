<p align="center">
  <img src="frontend/assets/images/muscloop-hero.png" width="100%" alt="muscloop" />
</p>

# muscloop

muscloopは、筋トレを「考える」「記録する」「続ける」まで支援するトレーニング継続アプリです。
AI相談、トレーニング記録、実績、通知、フレンド、ランキングなどの機能を搭載し、初心者でも迷わず継続できる体験を目指しています。


## 受賞/出展歴
- SysHack2026      **サイバーエージェント賞 受賞**
- 技育博2026vol.1   **出展**　　　　         

## 工夫した点
とことん見やすさを追求し、ユーザーに飽きを与えないためにこだわり抜いたUI/UX。加えて、筋トレをストレスなく行えるよう、インターバルとセット数を設定できるタイマーを作成。筋トレが続かないのは何が原因か、既存の筋トレアプリに足りないのは何か、ユーザーの視点に立って研究し、「継続」に徹底フォーカスしたアプリになっています。

## 主な機能

- メール/パスワード認証
- ゲスト利用
- プロフィール登録
- 筋トレ記録
- タイマー/ストップウォッチ記録
- プッシュ通知
- 今日の記録、累計時間、連続日数、カレンダー表示
- 実績/バッジ
- AIトレーナー相談
- フレンド検索、申請、承認、一覧、詳細
- フレンドランキング
- テーマカラー変更
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
  +-- Firebase Storage
  +-- Gemini API
  +-- Expo Push Notifications
```

### Backend

```powershell
cd backend
python -m venv venv

# Windowsの場合
.\venv\Scripts\Activate.ps1
# Mac/Linuxの場合
source venv/bin/activate

pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload
```

必要なもの:

- `backend/.env`
- `backend/serviceAccountKey.json`
- `GEMINI_API_KEY`

### Frontend

```powershell
cd C:\dev\muscle-hackathon\frontend
npm install
npx expo start
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

## 注意点

- GitHubにpushするとVercelのWeb版は自動デプロイされます。
- Backend変更はGitHub pushだけではAWSに反映されません。Docker build/pushとECS redeployが必要です。
- WebではHealthKit、ネイティブ通知、SecureStore系、一部画像URI、自動音声再生に制限があります。

## 今後の課題
- マネタイズの方法の模索
- ターゲット層の明確化
- 同業他社のアプリとの差別化
- 食事管理機能の追加
- 目標設定システムの導入
- 体重を記録し、その推移をグラフ化するシステムの導入
- 記録のメモの改善
- スマートウォッチとの連携
- HealthKitと連携した本格的なヘルスケアデータ取得
- 歩数測定機能の追加
- チャット機能の追加