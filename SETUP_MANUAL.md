# muscle-hackathon セットアップ手順

この手順で、別の PC でもフロントとバックエンドを起動して動作確認できます。

## 1. 事前に必要なもの

- Git
- Python 3.x
- Node.js / npm
- Firebase の `serviceAccountKey.json`

確認コマンド:

```powershell
python --version
node --version
npm --version
```

## 2. リポジトリ取得

```powershell
git clone <リポジトリURL>
cd muscle-hackathon
```

## 3. バックエンド起動

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
```

`backend/serviceAccountKey.json` を配置してください。
`backend/.env` の `GEMINI_API_KEY` に Gemini API キーを設定してください。

例:

```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
```

起動:

```powershell
uvicorn app.main:app --reload
```

確認:

- [http://127.0.0.1:8000/](http://127.0.0.1:8000/)
- [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)

## 4. フロント起動

別ターミナルで:

```powershell
cd frontend
copy .env.example .env
npm install
npm start
```

PC 上のエミュレータなら、`.env` の `EXPO_PUBLIC_API_BASE_URL` はそのままで大丈夫なことが多いです。

実機確認なら、`127.0.0.1` ではなく自分の PC の IP に変えてください。

例:

```env
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.10:8000
```

## 5. 動作確認チェック

- `/health` が開く
- プロフィール保存ができる
- 記録保存ができる
- ホームに累計時間と連続記録が出る
- 今日の記録一覧が出る
- 同じ日付・同じメニューの記録を保存し直したとき、二重加算されず上書きに近い動きになる
- ホームの今日の記録をタップして編集画面に入れる

## 6. よくある詰まりどころ

- `serviceAccountKey.json` がない
- フロントの `.env` が未設定
- 実機から `127.0.0.1` を見にいっている
- PowerShell の仮想環境有効化ができていない

## 7. Git に入れないもの

- `backend/serviceAccountKey.json`
- `.env`
- `venv`, `.venv`
- `__pycache__`
