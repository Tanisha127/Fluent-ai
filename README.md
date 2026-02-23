# 🎙️ FluentAI — AI-Powered Speech Confidence Platform

> For the 70+ million people who stammer worldwide.  
> **Not therapy videos. Not static blogs. Real AI. Real progress. Real confidence.**

---

## 🏆 HACKATHON PITCH SCRIPT (2 Minutes)

**[Open with this — DO NOT SKIP]**

> *"Imagine being brilliant at your job, passionate about your ideas, and completely capable — but the moment you open your mouth in an interview, your words disappear. Not because you don't know the answer. Because you stammer. That's the reality for 70 million people."*

> *"Today's solutions? Generic YouTube videos. $150/hour therapy sessions. Static blogs. None of them know YOUR voice. None of them practice WITH you."*

> *"FluentAI bridges therapy, AI, and community into one platform. Here's what it does:"*

**[Live Demo — 3 WOW Features]**

1. **Real-time Speech Analysis** — User reads a paragraph. AI immediately returns: fluency %, blocks count, speech rate, confidence score (0-100), and a personalized 4-step therapy plan. Not generic advice. YOUR data.

2. **AI Roleplay Interview Mode** — Select "Job Interview." An AI interviewer asks real questions. The user responds verbally. Live stress indicators and fluency metrics appear in real-time. When done: detailed session report. This is practicing your most feared situation — without fear of judgment.

3. **Anxiety Heatmap** — After 2 weeks of use, the AI identifies WHICH situations trigger stammering most. Phone calls? Interviews? Class presentations? The system detects the pattern and adapts the therapy plan.

**[Close]**

> *"We're not replacing speech therapists. We're making their work accessible — 24/7, personalized, and free at scale. Built on React, Node.js, Web Speech API, and GPT-4. The architecture scales to 1 million users. The roadmap extends to autism, aphasia, and selective mutism. One platform. Every voice."*

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (optional — runs in demo mode without it)
- OpenAI API key (optional — enables real AI analysis)

### Installation

```bash
# 1. Clone and install
git clone <repo>
cd fluent-ai
npm run install:all

# 2. Configure backend
cd backend
cp .env.example .env
# Edit .env with your keys

# 3. Run development servers
cd ..
npm run dev
# Frontend: http://localhost:3000
# Backend: http://localhost:5000
```

### Demo Credentials
- Email: `demo@fluent.ai`
- Password: `demo1234`

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT (React + Vite)                  │
│  Landing → Auth → Dashboard → Analysis → Coaching →      │
│  Roleplay → Therapy → Progress → Community → Reports     │
└─────────────────┬───────────────────────────────────────┘
                  │ REST API + WebSocket (Socket.io)
┌─────────────────▼───────────────────────────────────────┐
│              BACKEND (Node.js + Express)                  │
│                                                           │
│  /auth    /analysis   /roleplay   /therapy               │
│  /community  /reports  /progress  /users                 │
│                                                           │
│  ┌─────────────────────────────────────┐                 │
│  │          AI SERVICES LAYER           │                 │
│  │  • Speech Analysis (heuristic/GPT)  │                 │
│  │  • Roleplay AI (GPT-4o-mini)        │                 │
│  │  • PDF Report Generator (PDFKit)    │                 │
│  │  • Real-time Hints (Socket.io)      │                 │
│  └─────────────────────────────────────┘                 │
└─────────────────┬───────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────┐
│                   DATABASE (MongoDB)                       │
│  users • speech_analyses • therapy_sessions              │
│  roleplay_sessions • situation_logs • community_posts    │
└─────────────────────────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────┐
│               EXTERNAL AI SERVICES                        │
│  • OpenAI GPT-4o-mini (analysis + roleplay)              │
│  • Web Speech API (browser STT, free)                    │
│  • Whisper API (audio transcription, optional)           │
└─────────────────────────────────────────────────────────┘
```

---

## ✨ Feature Map

| Feature | Tech | WOW Factor |
|---------|------|-----------|
| Speech Analysis | Web Speech API + GPT | Confidence Score 0-100 |
| Live Coaching | Socket.io + heuristics | Real-time floating hints |
| AI Roleplay | GPT-4o-mini chat | Full interview simulation |
| Anxiety Heatmap | Recharts + MongoDB | Pattern detection over time |
| Therapy Generator | GPT + rule engine | Personalized daily plan |
| Gamification | XP + badges + streaks | Habit loop psychology |
| Community | Socket.io + moderation | Anonymous safe space |
| PDF Reports | PDFKit | Shareable with therapists |

---

## 🎯 3 WOW Features for Judges

### WOW #1: Real-Time Confidence Score
Unlike any existing tool, FluentAI gives you a **0-100 Confidence Score** with a visual gauge, radar chart, and 6 speech metrics — all in under 3 seconds after stopping recording.

### WOW #2: AI Roleplay Interview Mode
Speak to an AI interviewer. Get real follow-up questions. See your live fluency metric while talking. Receive a full session report after. **This is practicing your most feared situation without ever needing to leave home.**

### WOW #3: Anxiety Pattern Intelligence
After 2+ weeks of situation logging, the AI identifies which specific scenarios (interview vs phone call vs class) trigger the most anxiety — and automatically prioritizes those in the therapy plan. **It learns YOUR stammer, not a generic one.**

---

## 💰 Monetization Strategy

| Tier | Price | Features |
|------|-------|---------|
| **Free** | $0 | 5 analyses/month, basic therapy, community |
| **Pro** | $9.99/month | Unlimited analysis, roleplay, PDF reports, history |
| **Therapist** | $49/month | Multi-patient dashboard, session exports, integration |
| **Enterprise** | Custom | SLP clinics, schools, corporates |

**B2B2C**: Partner with speech therapy clinics as a practice tool between sessions.

---

## 🗺️ Scalability Roadmap

**Phase 1 (Hackathon)**: Core web platform, 8 features, demo-ready  
**Phase 2 (3 months)**: Mobile app (React Native), Whisper audio transcription, therapist dashboard  
**Phase 3 (6 months)**: Expand to Autism (social scripts), Aphasia (word finding), Selective Mutism  
**Phase 4 (12 months)**: Clinical partnerships, insurance integrations, telehealth bridge  
**Phase 5 (18 months)**: Multilingual support (Hindi, Arabic, Spanish), government healthcare contracts  

---

## 🛠️ Tech Stack

**Frontend**: React 18, Vite, Tailwind CSS, Framer Motion, Recharts, Socket.io-client  
**Backend**: Node.js, Express, Socket.io, MongoDB/Mongoose, PDFKit, JWT  
**AI**: OpenAI GPT-4o-mini, Web Speech API, custom heuristic engine  
**Deployment**: Vercel (frontend) + Railway/Render (backend) + MongoDB Atlas  

---

## 🌍 Impact Statement

> 70 million people stammer worldwide. Only ~5% receive any form of professional therapy.  
> FluentAI closes this gap — not as a replacement, but as a daily companion, practice partner, and confidence builder.  
> Every voice deserves to be heard.

---

*Built with 💜 for the 70+ million people who stammer worldwide*
