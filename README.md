# FluentAI

A web platform to help people who stammer practice speaking in real-world scenarios. Built with React, Node.js, and the OpenAI API.

---

## What it does

FluentAI gives users a private space to practice speaking and track how they improve over time. The core features are:

**Speech analysis** — Record yourself speaking and get back a breakdown of your fluency, speech rate, pause patterns, and an overall confidence score. The AI generates a short practice plan based on what it finds.

**Interview roleplay** — Practice a job interview, presentation, or phone call with an AI that responds conversationally. Your fluency metrics update live as you speak. At the end you get a session summary you can review or share with a therapist.

**Situation tracking** — Log which scenarios feel most difficult. After enough data, the app surfaces patterns — whether phone calls are harder than interviews, for example — and adjusts what it prioritizes in practice sessions.

---

## Getting started

**Requirements**
- Node.js 18+
- MongoDB
- An OpenAI API key (optional — enables AI analysis; falls back to heuristics without it)

**Setup**

```bash
git clone <repo>
cd fluent-ai
npm run install:all

cd backend
cp .env.example .env
# Add your keys to .env

cd ..
npm run dev
```

Frontend runs at `http://localhost:3000`, backend at `http://localhost:5000`.

---

## Tech stack

| Layer | Tools |
| Frontend | React 18, Vite, Tailwind CSS, Recharts, Socket.io-client |
| Backend | Node.js, Express, Socket.io, MongoDB, PDFKit, JWT |
| AI | OpenAI GPT-4o-mini, Web Speech API (browser), Whisper (optional) |
| Vercel (frontend), Render (backend), MongoDB Atlas(Database) |

---

## Project structure

```
fluent-ai/
├── frontend/          # React app
│   └── src/
│       ├── pages/     # Dashboard, Analysis, Roleplay, Progress, etc.
│       └── components/
├── backend/           # Express API
│   └── src/
│       ├── routes/    # auth, analysis, roleplay, therapy, reports
│       └── services/  # AI wrappers, PDF generation, socket handlers
└── shared/            # Types and constants
```

---

## API overview

| Endpoint | Description |
|---|---|
| `POST /api/analysis` | Submit a transcript for speech analysis |
| `POST /api/roleplay/start` | Begin a new roleplay session |
| `POST /api/roleplay/message` | Send a message in an active session |
| `GET /api/progress` | Fetch historical session data |
| `GET /api/reports/:id` | Download a session PDF |

Full API docs in [`/docs/api.md`](./docs/api.md).

---

## Configuration

Copy `backend/.env.example` to `backend/.env` and fill in:

```
OPENAI_API_KEY=        # Required for AI features
MONGODB_URI=           # Leave blank to use demo mode
JWT_SECRET=            # Any random string
PORT=5000
```

---

## Contributing

1. Fork the repo and create a branch off `main`
2. Run `npm run dev` to start both servers
3. Make your changes and add tests where relevant
4. Open a pull request with a clear description of what changed and why

Please open an issue before starting large changes.

---
