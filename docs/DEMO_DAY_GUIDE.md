# 技育博 本番説明ガイド

本番で説明しやすいように、muscloopの概要、デモ手順、想定質問をまとめた資料です。

## ひとことで

muscloopは、筋トレ初心者が「何をすればいいか迷う」「記録が面倒」「続かない」を解決するための、AI相談つきトレーニング継続アプリです。

AIトレーナーに相談して、記録して、実績やフレンド機能で続けるところまでを一つのアプリにまとめています。

## 伝えたい価値

- 初心者がメニュー選びで迷いにくい
- 記録までの手数を減らして続けやすい
- 実績、連続日数、ランキングで継続の動機を作る
- Webでもスマホでも触れる
- AI、Firebase、AWS、Vercelをつないだ実運用に近い構成

## デモURL

- Web: https://muscle-hackathon.vercel.app/
- Backend health: http://muscloop-backend-alb-161585801.ap-northeast-1.elb.amazonaws.com/health

## デモの流れ

### 1. ログイン

最初はゲストログインが説明しやすいです。

話すこと:

- 登録なしで試せる
- ゲストは毎回新しいセッションにして、前の人のデータが残らないようにしている
- 登録ユーザーはFirebase Authenticationで管理している

### 2. AIトレーナー

例:

- 脚トレしたい
- いい腕立ての方法ある？
- 筋肉痛だけど筋トレしていい？
- 膝が痛い時はどうする？
- サプリ必要？
- お酒と筋トレの相性

話すこと:

- 固定の分類で無理に返すのではなく、Geminiに自然に判断させている
- フォーム説明、安全配慮、食事/サプリ相談などに対応している
- 医療的な断定は避け、安全側に倒すようにしている

### 3. 記録

見せること:

- 手入力で記録
- タイマー/ストップウォッチで記録
- 保存後にホームへ反映

話すこと:

- ログインユーザーはFirebase ID tokenのuidを優先して保存する
- ゲストは `guest-...` のuserIdで保存できる
- 今日の記録、累計時間、連続日数、履歴に反映される

### 4. ホーム/実績

話すこと:

- 今日どれだけやったかがすぐ分かる
- 累計時間や連続日数で継続を可視化する
- 実績やバッジで「続けたい」を作る

### 5. フレンド/ランキング

見せること:

- 自分のIDコピー
- フレンド検索
- 申請/承認
- フレンド一覧
- ランキング

話すこと:

- フレンド公開プロフィールは最小限の情報だけ返す
- 体重、体脂肪、メモ、食事、HealthKit詳細、通知トークンなどは返さない
- ランキングには自分も表示される

## 技術説明

```text
Vercel Web / Expo App
  |
  v
FastAPI on AWS ECS Fargate
  |
  +-- Firebase Authentication
  +-- Firestore
  +-- Gemini API
  +-- Expo Push Notifications
```

### Frontend

- Expo / React Native / Expo Router / TypeScript
- Expo Web / React Native Web
- VercelでWeb公開

### Backend

- FastAPI / Python
- Docker化済み
- AWS ECS/Fargate + ALB + ECR
- Firestore連携

### Auth / DB

- Firebase Authentication
- Firestore

### AI

- Gemini API

### 通知

- Expo Push Notifications

## Web公開の工夫

VercelはHTTPS、AWS ALBはHTTPなので、ブラウザから直接HTTP ALBへアクセスするとMixed Contentになります。  
そのため `frontend/vercel.json` で `/api/*` をALBへrewriteし、Web版ではHTTPS配下の `/api` 経由でバックエンドを呼びます。

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "http://muscloop-backend-alb-161585801.ap-northeast-1.elb.amazonaws.com/:path*"
    }
  ]
}
```

## セキュリティ/プライバシーで説明できること

- Firebase ID tokenをFastAPI側で検証する方針
- 新規APIではbodyやURLのuserIdを信用せず、認証済みuidを使う方針
- Firebase service accountやGemini API keyはGitに含めない
- AWSではSecrets Managerで秘匿情報を管理
- フレンド公開情報は必要最小限にする

公開してよい情報:

- userId
- friendId
- name
- avatarUrl
- equippedBadge
- totalMinutes
- consecutiveDays
- achievementCount

返さない情報:

- email
- age
- height
- weight
- bodyFat
- memo
- food
- HealthKit詳細
- expoPushToken

## まだ伸ばせるところ

- Firebase Storageでプロフィール画像を本格共有する
- AIの代表質問をさらに調整する
- 本番日だけECSタスク数を2に増やして耐性を上げる
- HTTPS化、CORS制限、IAM権限最小化
- HealthKit連携の本格化
- 音ON/OFF設定や通知音の整理

## 想定質問

### なぜWebとスマホ両方にしたのか

展示ではWebが触りやすく、実際の利用ではスマホの方が筋トレ中に使いやすいためです。Expo/React Nativeにすることで、同じ実装をWebとNativeに展開しやすくしています。

### AIは何をしているのか

Gemini APIを使って、筋トレメニュー、フォーム、安全配慮、食事やサプリの相談に答えます。医療的な断定は避け、痛みがある場合は安全寄りに案内します。

### バックエンドはどこで動いているのか

FastAPIをDocker化し、AWS ECS/Fargate上で動かしています。外部公開はApplication Load Balancer経由です。

### データはどこに保存しているのか

ユーザー情報や記録はFirestoreに保存しています。認証はFirebase Authenticationです。

### 画像はどうしているのか

今は暫定対応です。Webの `blob:` URLをNativeで表示するとクラッシュするため、安全に表示できるURIだけ出すようにしています。今後はFirebase Storageに保存し、FirestoreにはURLだけ保存する設計にします。

### 何人くらい同時に使えるのか

展示用途の1〜50人程度なら大きく問題ない見込みです。100人以上がAIを連打するとGemini APIやBackend待ちが詰まる可能性があるため、必要ならECSタスク数を増やし、AI送信中の連打制限を強めます。
