# フロント共有メモ

このファイルは、バックエンド側で変わったことをフロント担当に共有するためのメモです。
難しく考えず、「フロントで何がしやすくなったか」を中心に見てもらえれば大丈夫です。

## まず結論

今回のバックエンド変更で、フロント側は前より少ない計算で画面を作りやすくなりました。

- 今日の記録件数や合計時間を、フロント側で計算しなくても受け取れるようになりました
- 通常の記録とタイマー記録を、ほぼ同じ形で受け取れるようになりました
- 日付の扱いを JST 基準にそろえたので、日ごとの表示でズレにくくなりました
- 変な更新データはバックエンド側で止めやすくなりました

## AI にそのまま貼れる共有文

以下をそのまま AI に貼って使えます。

```text
バックエンドで以下の変更が入りました。フロント実装に必要な対応を整理してください。

【今回できるようになったこと】
- 今日の記録一覧を `GET /records/today/{user_id}` で取得できる
- 今日の記録件数 `todayRecords` と、今日の合計分数 `todayTotalMinutes` をサーバー側で返せる
- `GET /records/summary/{user_id}` で集計情報をまとめて取れる
- `GET /summary/{userId}` も同じ集計ロジックを使うようになった
- 通常記録とタイマー記録のレスポンス形式が近くなった
- `date` は JST 基準で返るので、日別表示にそのまま使いやすい
- profile と record の update は、不正な値や空の更新を弾くようになった

【主に使える API】
- GET /health
- GET /records/{user_id}
- GET /records/today/{user_id}
- GET /records/summary/{user_id}
- GET /summary/{userId}
- PATCH /profile/{user_id}
- PATCH /records/{record_id}

【records 系レスポンスで見てよい主な項目】
- recordId
- userId
- menuName
- count
- duration
- durationSeconds
- minutes
- interval
- rounds
- memo
- createdAt
- updatedAt
- date
- type

【フロントでやるとよさそうなこと】
- ホーム画面で `todayTotalMinutes` をそのまま表示する
- 日別グラフやカレンダーは `date` を使ってまとめる
- 通常記録とタイマー記録は `type` を見つつ、できるだけ同じ UI ロジックで扱う
- 更新フォーム送信時に、空データやマイナス値を送らないようにする
```

## API ごとのざっくり説明

### `GET /health`

サーバーが生きているか確認するための API です。
画面表示には必須ではないですが、接続確認に使えます。

### `GET /records/today/{user_id}`

今日の記録だけ取りたいときに使えます。

返ってくる主な値:

- `totalRecords`: 今日の記録件数
- `totalMinutes`: 今日の合計分数
- `records`: 今日の記録一覧

### `GET /records/summary/{user_id}`

記録の集計をまとめて取りたいときに使えます。

返ってくる主な値:

- `totalMinutes`: 累計の合計分数
- `totalRecords`: 累計の記録件数
- `todayRecords`: 今日の記録件数
- `todayTotalMinutes`: 今日の合計分数
- `streakDays`: 連続日数
- `latestRecord`: 最新の記録
- `dailyRecords`: 日ごとの集計
- `menuSummary`: メニューごとの合計回数

### `GET /summary/{userId}`

ホーム用サマリーです。
`/records/summary/{user_id}` と同じ考え方で作られています。

違い:

- `/records/summary/{user_id}` の `dailyRecords` は「日ごとの分数」
- `/summary/{userId}` の `dailyRecords` は「日ごとの件数」

## レスポンスで見てよい項目

records 系のレスポンスでは、基本的に以下を見れば大丈夫です。

- `recordId`: 記録ID
- `userId`: ユーザーID
- `menuName`: メニュー名
- `count`: 回数
- `duration`: 秒
- `durationSeconds`: 秒
- `minutes`: 分
- `interval`: インターバル秒
- `rounds`: セット数
- `memo`: メモ
- `createdAt`: 作成日時
- `updatedAt`: 更新日時
- `date`: JST 基準の日付
- `type`: `normal` または `timer`

## フロント側でうれしいポイント

- 今日の合計時間をフロント側で再計算しなくてよいです
- `date` が JST 基準なので、日本時間での日別表示に使いやすいです
- タイマー記録も通常記録も近い形で返るので、表示ロジックを共通化しやすいです
- バックエンド側でも入力チェックするので、壊れたデータが入りにくくなります
