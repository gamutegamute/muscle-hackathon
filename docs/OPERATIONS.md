# muscloop 運用メモ

Vercel、AWS、Firebase、デプロイまわりの現在の正をまとめます。

## 作業場所

本命:

```powershell
C:\dev\muscle-hackathon
```

古い可能性があるクローン:

```powershell
C:\Users\soshi\OneDrive\ドキュメント\GitHub\muscle-hackathon
```

作業前に必ず確認:

```powershell
cd C:\dev\muscle-hackathon
git status --short --branch
```

## 公開URL

- Web: https://muscle-hackathon.vercel.app/
- Backend: http://muscloop-backend-alb-161585801.ap-northeast-1.elb.amazonaws.com
- Health: http://muscloop-backend-alb-161585801.ap-northeast-1.elb.amazonaws.com/health

## Vercel

Project settings:

- Root Directory: `frontend`
- Build Command: `npx expo export --platform web`
- Output Directory: `dist`
- Install Command: `npm install`

`frontend/vercel.json`:

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

Web版ではHTTPSページからHTTP ALBを直接叩けないため、`frontend/lib/api.ts` でHTTPS上かつAPI URLがHTTPの場合は `/api` を使います。

## AWS

Region:

- `ap-northeast-1`

Resources:

- ECS cluster: `muscloop-cluster`
- ECS service: `muscloop-backend-service`
- ECR repository: `muscloop-backend`
- CloudWatch Logs: `/ecs/muscloop-backend`
- ALB: `muscloop-backend-alb`

直近のECR latest digest:

```text
sha256:72da38fc6d54dfa94766ad9c0a3bb451c1ef2f57641893fc746062e2a37d918b
```

## Backend反映

GitHubにpushしただけではAWS Backendは更新されません。Backendを変えた場合はDocker imageをbuild/pushし、ECSをredeployします。

確認:

```powershell
Invoke-RestMethod http://muscloop-backend-alb-161585801.ap-northeast-1.elb.amazonaws.com/health
```

ログ確認:

```powershell
aws logs tail /ecs/muscloop-backend --region ap-northeast-1 --since 10m
```

ECS状態確認:

```powershell
aws ecs describe-clusters --clusters muscloop-cluster --region ap-northeast-1
```

## 本番日の耐性

構成:

- Web: Vercel
- Backend: ECS/Fargate/ALB
- DB: Firestore
- Auth: Firebase Auth
- AI: Gemini API

見込み:

- 1〜20人同時: かなり大丈夫
- 20〜50人同時: 展示用途ならたぶん大丈夫
- 50〜100人同時: AI連打があるとやや不安
- 100人以上でAI連打: 詰まる可能性あり

対策:

- AI送信中はボタン無効
- AI連打制限
- 本番日だけECSタスク数を2に増やす
- CloudWatch Logs確認
- 画像アップロードなど重い機能は慎重に

## Firebase Storage画像方針

現在の画像対応は暫定です。`blob:` や `file://` をプロフィールに保存すると、別端末やフレンド詳細で表示できません。

方針:

- 画像本体はFirestoreに保存しない
- Firebase Storageに保存する
- Firestoreにはdownload URLだけ保存する
- 表示は `avatarUrl` 優先
- `avatarUrl` がなければデフォルトアイコン

保存先:

```text
users/{uid}/avatar.jpg
```

Firestore:

```text
users/{uid}.avatarUrl
```

Storage Rules案:

```text
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{uid}/avatar.jpg {
      allow write: if request.auth != null && request.auth.uid == uid;
      allow read: if request.auth != null;
    }
  }
}
```

## Googleログイン / OAuth

Expo Go / Expo AuthSessionの場合、Google CloudのOAuthクライアントに以下のredirect URIを追加する必要があります。

```text
https://auth.expo.io/@自分のexpoユーザーネーム/muscloop
```

ローカルExpoで `redirect_uri=exp://192.168.x.x:8081` の `Error 400: invalid_request` が出る場合は、実際に使われるredirect URIがGoogle Cloud側で許可されていない可能性があります。

Web版ではVercelドメインもOAuth設定が必要になる場合があります。

## Webで制限がある機能

- HealthKit
- ネイティブ通知
- SecureStore系
- Nativeの一部画像URI
- 自動音声再生

Webは展示導線、スマホアプリは本来利用の導線として説明すると分かりやすいです。

## Git運用

チーム作業中なので、push前にFetch/Pullしてコンフリクト確認します。

```powershell
cd C:\dev\muscle-hackathon
git fetch origin
git status --short --branch
```

GitHub Desktopで「Never commits on remote」が出たら、先にFetchしてからpushします。
