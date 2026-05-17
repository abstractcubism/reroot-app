# Reroot

A housing and roommate matching app for students. Built for Rutgers Techstart 2026 and placed top 5.

Students enter their campus, budget, traits, and interests and reroot ranks compatible roommates and off/on-campus listings using a scoring engine, with OpenAI-powered re-ranking on top.

## Features

- Browse housing listings across all four Rutgers campuses (College Ave, Busch, Cook/Douglass, Livingston)
- Filter by on-campus vs. off-campus, price, and commute distance
- Find compatible roommates matched by budget, campus preference, lifestyle traits, and interests
- Like/dislike feedback loop that adjusts match rankings in real time
- AI re-ranking via OpenAI (falls back to built-in heuristic ranker if no key is set)

## Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Backend**: Python, Flask
- **AI**: OpenAI GPT-4o-mini (optional)

## Running with Docker

```bash
cp app/backend/.env.example app/backend/.env
# Add your OPENAI_API_KEY to app/backend/.env (optional)

docker compose up --build
```

- Frontend: [http://localhost](http://localhost)
- Backend API: [http://localhost:8000](http://localhost:8000)

## Running locally

**Backend**

```bash
cd app/backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1   # Windows
# source .venv/bin/activate    # macOS/Linux
pip install -r requirements.txt
python server.py
```

**Frontend** (separate terminal)

```bash
cd app/frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`. API calls are proxied to the Flask backend during dev.

## Environment variables

Copy `.env.example` to `.env` in `app/backend/`:

| Variable | Default | Description |
|---|---|---|
| `OPENAI_API_KEY` | — | Enables AI-powered match re-ranking (optional) |
| `OPENAI_MATCH_MODEL` | `gpt-4o-mini` | Which OpenAI model to use for ranking |
| `PORT` | `8000` | Backend port |
| `FLASK_DEBUG` | `1` | Set to `0` in production |

## What I'd add to improve

- User accounts and persistent saved matches (currently in falsified 'signed in with Rutgers' state)
- Real listing data via a live scraper (current data is from a one-time scrape) or housing API
- A compatibility quiz onboarding flow
- Deployed demo
