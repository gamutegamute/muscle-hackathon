# Backend Docker

FastAPI backend can run in Docker for local verification before AWS deployment.

## Build

Run from `backend`.

```powershell
docker build -t muscloop-backend:local .
```

## Run

Keep secrets out of the Docker image. Pass `.env` with `--env-file` and mount
`serviceAccountKey.json` as read-only.

```powershell
docker run --rm -p 8000:8000 `
  --env-file .env `
  -e FIREBASE_KEY_PATH=/run/secrets/serviceAccountKey.json `
  -v C:\dev\muscle-hackathon\backend\serviceAccountKey.json:/run/secrets/serviceAccountKey.json:ro `
  muscloop-backend:local
```

If port `8000` is already used by local uvicorn, map the container to `8001`.

```powershell
docker run --rm -p 8001:8000 `
  --env-file .env `
  -e FIREBASE_KEY_PATH=/run/secrets/serviceAccountKey.json `
  -v C:\dev\muscle-hackathon\backend\serviceAccountKey.json:/run/secrets/serviceAccountKey.json:ro `
  muscloop-backend:local
```

## Health Check

```powershell
Invoke-RestMethod http://127.0.0.1:8000/health
```

Expected response:

```json
{
  "status": "ok"
}
```

For the `8001` example, use `http://127.0.0.1:8001/health`.
