# muscloop AWS公開構成まとめ

## 目的

muscloopのバックエンドをローカルPCに依存せず公開するため、FastAPIをDocker化し、AWS上で動かす構成を作った。

これにより、展示PCでバックエンドを起動しなくても、審査員や参加者が自分の端末からAPIにアクセスできる。

## 現在できていること

- FastAPIバックエンドをDockerコンテナとして起動できる
- DockerイメージをAmazon ECRにpushできる
- ECS Fargate上でFastAPIコンテナを実行できる
- ALB経由で外部からAPIにアクセスできる
- `/health` でヘルスチェックできる
- `/docs` でFastAPIのSwagger UIを確認できる
- Firebase秘密鍵とGemini APIキーをAWS Secrets Managerで管理している
- CloudWatch Logsでバックエンドの起動ログを確認できる
- バックエンドの8000番ポートは直接公開せず、ALBからの通信だけ許可している

## 公開URL

```text
http://muscloop-backend-alb-161585801.ap-northeast-1.elb.amazonaws.com
```

確認用URL:

```text
http://muscloop-backend-alb-161585801.ap-northeast-1.elb.amazonaws.com/health
http://muscloop-backend-alb-161585801.ap-northeast-1.elb.amazonaws.com/docs
```

`/health` の期待レスポンス:

```json
{
  "status": "ok"
}
```

## AWS構成

```text
Client
  |
  | HTTP :80
  v
Application Load Balancer
  |
  | HTTP :8000
  v
ECS Fargate Task
  |
  v
FastAPI backend container
  |
  +-- Firestore / Firebase Authentication
  +-- Gemini API
```

## 利用している主なAWSサービス

- Amazon ECR
  - Dockerイメージ置き場
- Amazon ECS
  - コンテナ実行基盤
- AWS Fargate
  - サーバー管理なしでコンテナを実行
- Application Load Balancer
  - 外部公開用の入口
- AWS Secrets Manager
  - Firebase秘密鍵とGemini APIキーを管理
- Amazon CloudWatch Logs
  - FastAPIの起動ログやエラーログ確認
- AWS Budgets
  - 費用アラート

## 現在の主要リソース

| 種類 | 名前 |
| --- | --- |
| リージョン | ap-northeast-1 |
| ECRリポジトリ | muscloop-backend |
| ECSクラスター | muscloop-cluster |
| ECSサービス | muscloop-backend-service |
| ECSタスク定義 | muscloop-backend:1 |
| ALB | muscloop-backend-alb |
| Target Group | muscloop-backend-tg |
| CloudWatch Logs | /ecs/muscloop-backend |
| Backend Security Group | muscloop-backend-sg |
| ALB Security Group | muscloop-alb-sg |

## 秘密情報の扱い

以下はGitやDockerイメージに含めない。

- `backend/.env`
- `backend/serviceAccountKey.json`
- Gemini API key
- Firebase Admin SDK秘密鍵

AWSではSecrets Managerに保存し、ECSタスク実行時に環境変数として渡す。

現在使っているSecret:

- `muscloop/backend/gemini-api-key`
- `muscloop/backend/firebase-service-account-json`

## セキュリティ方針

- 外部公開する入口はALBのHTTP 80番
- FastAPIコンテナの8000番はALBからだけ許可
- Firebase ID tokenをFastAPI側で検証する方針
- APIではbodyやURLの`userId`を信用せず、認証済みuidを使う
- 秘密鍵やAPIキーはGitHubに上げない
- HealthKit詳細、体重、体脂肪、メモ、食事、画像、通知トークンなどはフレンド公開しない

## 発表での説明文

muscloopのバックエンドは、Docker化したFastAPIをAmazon ECRに保存し、ECS Fargate上で実行しています。
外部公開はApplication Load Balancer経由にしており、Firebase秘密鍵やGemini APIキーはSecrets Managerで管理しています。
これにより、展示PCでバックエンドを起動しなくても、審査員や参加者が自分の端末からAPIにアクセスできる構成にしています。

また、FastAPIコンテナのポートは直接インターネットに公開せず、ALBからの通信だけを許可しています。
今後はFirebase ID token検証をさらに広げ、ログインユーザー本人のuidをサーバー側で確定する形に移行していきます。

## 起動確認手順

```powershell
aws sts get-caller-identity
```

アカウントIDが正しいことを確認する。

```powershell
aws ecs describe-services `
  --cluster muscloop-cluster `
  --services muscloop-backend-service `
  --region ap-northeast-1
```

`runningCount` が `1` ならECSサービスが動いている。

```powershell
aws elbv2 describe-target-health `
  --target-group-arn arn:aws:elasticloadbalancing:ap-northeast-1:986232522042:targetgroup/muscloop-backend-tg/65656f50713d9f88 `
  --region ap-northeast-1
```

`State` が `healthy` ならALBからECSタスクに到達できている。

```powershell
Invoke-RestMethod http://muscloop-backend-alb-161585801.ap-northeast-1.elb.amazonaws.com/health
```

`status: ok` が返れば公開確認完了。

## 一時停止手順

Fargateのコンテナを止めたい場合は、ECSサービスの希望台数を0にする。

```powershell
aws ecs update-service `
  --cluster muscloop-cluster `
  --service muscloop-backend-service `
  --desired-count 0 `
  --region ap-northeast-1
```

注意:

- これでECS/Fargateの実行台数は0になる
- ALBなど他のリソースは残る
- ALBを残している間はALB分の課金が続く

## 再開手順

```powershell
aws ecs update-service `
  --cluster muscloop-cluster `
  --service muscloop-backend-service `
  --desired-count 1 `
  --region ap-northeast-1
```

数分待ってから `/health` を確認する。

## 発表後の削除チェックリスト

発表後にAWS費用を止める場合は、以下を確認して削除する。

- ECSサービス `muscloop-backend-service`
- ECSクラスター `muscloop-cluster`
- ALB `muscloop-backend-alb`
- Target Group `muscloop-backend-tg`
- Security Group `muscloop-alb-sg`
- Security Group `muscloop-backend-sg`
- CloudWatch Logs `/ecs/muscloop-backend`
- ECRリポジトリ `muscloop-backend`
- Secrets ManagerのSecret
  - `muscloop/backend/gemini-api-key`
  - `muscloop/backend/firebase-service-account-json`

削除前に、今後も使う予定のものがないか確認する。

## 今後やること

- フロントのAPI接続先をAWS URLに切り替えて実機確認する
- CORSを本番URLに絞る
- HTTPS化する
- 必要なら独自ドメインを設定する
- IAM権限を必要最小限に寄せる
- 起動、停止、削除手順をチームで共有する
