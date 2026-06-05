<p align="center">
  <img src="frontend/assets/images/muscloop-hero.png" width="100%" alt="muscloop" />
</p>

# muscloop

**筋トレを「考える」「記録する」「続ける」まで支援する、トレーニング継続アプリ。**

muscloopは、筋トレを始めても続かない人のために、AI相談、トレーニング記録、実績、通知、フレンド、ランキングをひとつにつないだアプリです。  
何をすればよいか迷う時間と記録の手間を減らし、仲間や達成感によって続けたくなる体験を目指しています。

## 受賞・出展

- **SysHack2026 サイバーエージェント賞**
- **技育博2026 vol.1 出展**

## 解決したい課題

筋トレは、始めることよりも続けることが難しい活動です。チーム内でも、次のような理由で継続できない経験がありました。

- 自分に合うメニューが分からない
- 毎回の記録が面倒
- 一人ではモチベーションを保ちにくい
- 成長や積み重ねを実感しにくい

muscloopでは、単なる記録ツールではなく、**行動を始めやすくし、継続を後押しする仕組み**に焦点を当てています。

## 主な機能

| 機能 | 内容 |
| --- | --- |
| AIトレーナー相談 | 目的や悩みに応じたアドバイスを受け、そのまま記録につなげられます |
| トレーニング記録 | 手動入力、タイマー、ストップウォッチから記録できます |
| 継続の可視化 | 累計時間、連続日数、カレンダー、実績・バッジを確認できます |
| フレンド・ランキング | フレンド申請、詳細表示、期間別ランキングで仲間と継続できます |
| プロフィール | Firebase Storageを利用し、プロフィール画像を端末間で共有できます |
| 認証・ゲスト利用 | 登録ユーザーと、すぐ試せるゲスト利用の両方に対応しています |
| カスタマイズ・通知 | テーマカラー変更とExpo Push Notificationsに対応しています |

## 画面イメージ

| ホーム | 記録 | 実績 |
| --- | --- | --- |
| ![ホーム画面](docs/screenshots/home.png) | ![記録画面](docs/screenshots/record.png) | ![実績一覧画面](docs/screenshots/achievements.png) |

| グラフ | 設定 |
| --- | --- |
| ![グラフ画面](docs/screenshots/graph.jpg) | ![設定画面](docs/screenshots/settings.png) |

## 特に工夫した点

### AI相談を「回答」で終わらせない

AIに相談してメニューを決め、その内容を記録画面へ引き継げるようにしました。  
相談、実行、記録を分断せず、ユーザーが次の行動へ移りやすい導線を意識しています。

### 継続を複数の角度から支える

実績や連続記録による達成感、フレンドやランキングによる仲間とのつながり、通知によるリマインドを組み合わせています。  
競争だけに偏らず、自分の積み重ねも楽しめる設計を目指しました。

### Webとネイティブの違いを吸収する

Expo / React Nativeを利用し、Web・iOS・Androidで共通化できる部分を増やしました。  
一方で、画像URI、通知、HealthKitなどプラットフォームごとの差がある機能は、安全に分岐して扱っています。

## 技術的な挑戦

- Firebase ID tokenをFastAPIで検証し、認証済みユーザーのUIDを基準にデータを扱う構成
- Firebase Storageに画像を保存し、Firestoreには共有可能なURLのみを保存
- HTTPSのVercelからHTTPのALBへアクセスする際のMixed Content問題をVercel rewritesで回避
- ゲスト利用と登録ユーザーの両方に対応したデータ同期
- Webとネイティブで異なる画像URIやUI挙動への対応
- Docker化したFastAPIをAWS ECS/Fargateへデプロイし、CloudWatchで監視

## 実運用で得られた結果

技育博2026 vol.1では、来場者や企業の方に実際に操作していただきました。

- 約 **3,500件** のユーザー操作由来APIリクエストを処理
- バックエンドの **5xxエラーは0件**
- ECS CPU使用率は最大約 **11%**
- ECSメモリ使用率は約 **14%**
- AI相談APIは当日 **35件** の正常応答を確認

展示規模では安定して動作しました。一方、より大規模な利用では、AI APIのレート制限、ランキング集計、オートスケーリングなどが今後の改善点です。

## システム構成

```text
Web user
  |
  v
Vercel / Expo Web
  |
  | /api/* rewrite
  v
Application Load Balancer
  |
  v
FastAPI on AWS ECS/Fargate
  |
  +-- Firebase Authentication
  +-- Firestore
  +-- Firebase Storage
  +-- Gemini API
  +-- Expo Push Notifications

iOS / Android
  |
  +-- Expo React Native app
        |
        +-- FastAPI API
        +-- Firebase services
```

> [!NOTE]
> 展示終了後のコスト削減のため、現在AWSバックエンドとALBは停止しています。再公開時にはAWS環境の再構築とAPI接続先の更新が必要です。

## 技術スタック

### Frontend

- Expo / React Native / React Native Web
- Expo Router
- TypeScript
- Firebase Authentication
- Expo Push Notifications

### Backend

- FastAPI / Python
- Firebase Admin SDK
- Firestore / Firebase Storage
- Gemini API
- Docker

### Hosting / Infrastructure

- Vercel
- AWS ECS / Fargate
- Application Load Balancer
- Amazon ECR
- CloudWatch Logs
- AWS Secrets Manager

## 開発体制

- 開発期間: 2026/03/17 - 2026/03/31
- チーム人数: 5名
- 開発形態: チーム開発

- 開発期間: 2026/05/15 - 2026/05/30
- チーム人数: 3名
- 開発形態: 継続開発

短期間で各機能を個別に作るだけでなく、認証、保存、画面遷移をつなぎ、ひとつのサービスとして操作できる状態にすることを重視しました。

## 今後の展望

### 短期

- ターゲットユーザーの明確化とユーザーテスト
- AI相談とランキングへのレート制限・監視追加
- 記録メモ、目標設定、体重推移グラフの改善

### 中期

- 食事管理とトレーニングデータを組み合わせたAI提案
- HealthKit・スマートウォッチ連携
- フレンド間チャレンジやグループ機能

### 長期

- AIによるフォーム解析と安全なトレーニング支援
- ジム、学校、企業の健康支援向け機能
- AWS上での配信、監視、スケーリングの一元化
- マネタイズの方法の模索

## ローカルでの実行

FirebaseとGeminiの認証情報、環境変数の設定が必要です。  
詳しい起動手順と確認方法は [SETUP_MANUAL.md](SETUP_MANUAL.md) を参照してください。

