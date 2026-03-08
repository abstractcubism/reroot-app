# Reroot Web App

This project now runs as:
- Frontend: React + Vite + Tailwind (`app/frontend`)
- Backend: Flask API (`app/backend`)

## 1) Backend setup (with venv)

```powershell
cd app/backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python server.py
```

Backend runs at `http://127.0.0.1:8000`.

Before starting backend, put your key in `app/backend/.env`:

```dotenv
OPENAI_API_KEY=your_openai_api_key_here
```

Optional for AI matchmaking:

```powershell
$env:OPENAI_MATCH_MODEL = "gpt-4o-mini"
```

If no OpenAI key is set, matchmaking still works using a built-in heuristic ranker.

## 2) Frontend setup

Open a second terminal:

```powershell
cd app/frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`.

`vite.config.ts` includes a proxy so `/api/*` routes forward to the Flask backend during local development.

## 3) Build frontend

```powershell
cd app/frontend
npm run build
```

## 4) Type-check frontend

```powershell
cd app/frontend
npm run typecheck
```
