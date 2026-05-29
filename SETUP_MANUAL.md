# muscloop セットアップ手順

本命の作業場所は `C:\dev\muscle-hackathon` です。OneDrive側の古いクローンと間違えないようにしてください。

## 1. 必要なもの

- Git
- Node.js / npm
- Python 3.x
- Docker Desktop（BackendのDocker確認やAWS反映時）
- Firebase service account key
- Gemini API key

## 2. Backend

```powershell
cd C:\dev\muscle-hackathon\backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
```

`backend/.env` に `GEMINI_API_KEY` を設定します。ローカルでは `backend/serviceAccountKey.json` も配置してください。

起動:

```powershell
uvicorn app.main:app --reload
```

確認:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/health
```

期待値:

```json
{
  "status": "ok"
}
```

## 3. Frontend

```powershell
cd C:\dev\muscle-hackathon\frontend
copy .env.example .env
npm install
npx expo start
```

ローカルBackendを見る場合:

```env
EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```

実機からローカルBackendを見る場合は、`127.0.0.1` ではなくPCのLAN IPを使います。

```env
EXPO_PUBLIC_API_BASE_URL=http://192.168.x.x:8000
```

AWS Backendを見る場合:

```env
EXPO_PUBLIC_API_BASE_URL=http://muscloop-backend-alb-161585801.ap-northeast-1.elb.amazonaws.com
```

## 4. Webビルド

```powershell
cd C:\dev\muscle-hackathon\frontend
npx.cmd expo export --platform web
```

Vercelでは以下の設定です。

- Root Directory: `frontend`
- Build Command: `npx expo export --platform web`
- Output Directory: `dist`
- Install Command: `npm install`

## 5. Gitに入れないもの

- `.env`
- `backend/serviceAccountKey.json`
- `venv`
- `.venv`
- `__pycache__`
- ビルド成果物やキャッシュ
