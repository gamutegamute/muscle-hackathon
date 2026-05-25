# muscloop AWS構成レビュー

## 結論

現在のAWS構成は、技育博で説明するデモ環境としては十分に成立している。

特に、iPhoneアプリからAWS上のFastAPIへ接続し、記録保存まで通っているため、「ローカルPCに依存しないバックエンド公開」は実証済み。

一方で、商用レベルや長期公開を考えると、HTTPS化、CORS制限、IAM権限の最小化などは今後の改善点として残る。

## 現在の構成

```text
iPhone / Web client
  |
  | HTTP :80
  v
Application Load Balancer
  |
  | HTTP :8000
  v
ECS Fargate
  |
  v
FastAPI backend container
  |
  +-- Firebase Authentication / Firestore
  +-- Gemini API
```

## この構成にした理由

### Docker

FastAPIをDocker化することで、ローカルPCとAWSで同じ実行環境を使える。

これにより、PCごとのPython環境差分や依存関係のズレを減らせる。

### ECR

DockerイメージをAWS側に保存するためにECRを使っている。

ECS/FargateはECRからイメージを取得して起動するため、展示PCにDockerイメージを置いておく必要がない。

### ECS Fargate

サーバーを自分で管理せずにコンテナを実行できる。

EC2を立ててOS管理するより、ハッカソン後の継続開発や展示用途では扱いやすい。

### ALB

外部公開の入口としてALBを使っている。

直接FargateタスクのIPへアクセスする形より、安定したURLを使えて、ヘルスチェックや将来的なHTTPS化にもつなげやすい。

### Secrets Manager

Firebase秘密鍵やGemini APIキーをGitやDockerイメージに含めないために使っている。

ECSタスク起動時にSecretを環境変数として渡すことで、コードと秘密情報を分離できている。

### CloudWatch Logs

FastAPIの起動ログやAPIアクセスログを確認するために使っている。

実際に `POST /records 200 OK` を確認できたため、アプリからAWS経由で保存できている証跡として説明できる。

## 良い点

- iPhoneアプリからAWSバックエンド経由で記録保存まで確認済み
- `/health` と `/docs` で外部公開を確認できる
- Fargateは停止中で、不要なコンテナ課金を抑えている
- ALBの80番だけを外部公開している
- FastAPIの8000番はALBのSecurity Groupからだけ許可している
- Firebase秘密鍵とGemini APIキーをSecrets Managerで管理している
- `.env` と `serviceAccountKey.json` はGit管理外
- CloudWatch LogsでAPIアクセスを確認できる

## 現在の注意点と改善案

### 1. ALBがHTTPのみ

現在はALBのリスナーがHTTP 80番のみ。

デモ確認としては動くが、ログインやID tokenを扱うAPIとしてはHTTPS化した方がよい。

改善案:

- ACMで証明書を発行する
- 独自ドメインを用意する
- ALBにHTTPS 443リスナーを追加する
- HTTP 80はHTTPSへリダイレクトする

優先度:

- 技育博直前までは必須ではない
- 外部の人に長時間触ってもらうなら優先度高め

### 2. CORSが広い

現在のFastAPIは `allow_origins=["*"]` になっている。

開発中は便利だが、本番では想定外のWebサイトからAPIを呼べる状態になる。

改善案:

- Expo Webの本番URL
- ローカル開発URL
- 必要な展示用URL

だけを許可する。

優先度:

- Web公開URLが決まったら対応

### 3. `/docs` が外部公開されている

FastAPIのSwagger UIが外部から見える。

デモやチーム開発では便利だが、公開API一覧が誰でも見える状態になる。

改善案:

- 本番では `/docs` を無効化する
- またはBasic認証や管理者向けだけに制限する

優先度:

- 展示中は説明に使えるので残してもよい
- 長期公開時は制限した方がよい

### 4. IAMユーザーの権限が強い

作業用グループ `muscloop-deploy-group` に `AdministratorAccess` が付いている。

開発初期は作業しやすいが、長期運用では権限が広すぎる。

改善案:

- ECR push
- ECS service update
- CloudWatch Logs確認
- Secrets Managerの必要Secret参照

などに絞った専用ポリシーへ移行する。

優先度:

- 技育博前に余裕があれば
- 少なくとも発表後は見直す

### 5. ALBが残っているため課金が続く

ECS/Fargateは `desired-count 0` で停止済み。

ただしALBは残っているため、ALB分の課金は続く。

改善案:

- 近いうちに再確認するならALBは残す
- しばらく触らないならALBとTarget Groupを削除する
- 発表後は削除チェックリストに沿って片付ける

優先度:

- 費用を最優先するなら高い
- 近々再テストするなら残してもよい

### 6. ECRイメージが `latest` タグ運用

現在のタスク定義は `muscloop-backend:latest` を参照している。

シンプルで扱いやすいが、どのコードが動いているかを後から追いづらい。

改善案:

- Git commit hashや日付タグを付けてpushする
- タスク定義では固定タグを指定する

優先度:

- 継続開発では対応した方がよい
- ハッカソン段階では許容

### 7. Fargateタスクはpublic subnet + public IP

現在は初期構築を簡単にするため、Fargateタスクにpublic IPを付けている。

Security GroupでALBからの8000番だけに絞っているため、直接アクセスは防いでいる。

より本格的には、private subnetに置き、NAT GatewayやVPC Endpointを使う構成が望ましい。

改善案:

- ECSタスクをprivate subnetへ移す
- ECR/CloudWatch Logs/Secrets ManagerへのVPC Endpointを検討する
- あるいはNAT Gatewayを使う

優先度:

- 今は低め
- 本番運用では検討

## 技育博での説明ポイント

- Docker化により、ローカルとAWSで同じFastAPI環境を使える
- ECRにイメージを置き、ECS Fargateでサーバーレスにコンテナ実行している
- ALBを入口にして、展示PCに依存せず外部端末からAPIにアクセスできる
- 秘密情報はSecrets Managerに分離しており、GitやDockerイメージに入れていない
- CloudWatch LogsでAPIアクセスを確認できる
- 実際にiPhoneアプリからAWS経由で記録保存できることを確認済み
- 現時点ではHTTP/CORS/IAMなど改善点も把握しており、長期公開時に強化する予定

## 今すぐやるなら

1. フロント/バックのフレンド機能API仕様を固める
2. AWS URL切り替え手順をチームに共有する
3. 近いうちにAWS再テストする予定がなければALB削除を検討する
4. 発表資料用にAWS構成図を1枚作る

## 今は無理にやらなくてよいこと

- private subnet化
- GitHub Actionsによる自動デプロイ
- 独自ドメイン
- HTTPS化
- IAM最小権限化

これらは重要だが、今のフェーズでは「できていることを壊さず説明できる状態にする」方が優先。
