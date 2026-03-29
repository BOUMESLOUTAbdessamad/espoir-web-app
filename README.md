# Welcome to Espoir - The AI Powered Pharmacy Partner

> **Avicenna** — Your intelligent pharmacy assistant, named after Ibn Sina (Avicenna), the legendary Persian physician and philosopher who revolutionized medicine in the 11th century.

---

## What is Espoir?

Espoir is an AI-powered pharmacy platform that connects patients with pharmacies and medicines across Algeria. At its core is **Avicenna**, an intelligent agent that understands natural language queries, searches drug databases, locates nearby pharmacies, and provides AI-enhanced medical information.

---

## Avicenna AI Agent

Avicenna is more than a search engine. It understands intent.

| Query | What Avicenna does |
|---|---|
| `"amoxicillin"` | Finds exact match + alternatives + nearby pharmacies |
| `"something for fever"` | Understands intent → returns relevant medicines |
| `"headache without drowsiness"` | Semantic search → filtered results |
| `"paracetamol side effects"` | AI explanation in plain language |

### How it works
```
User Query
    │
    ▼
Semantic Understanding (Gemini Embeddings)
    │
    ▼
Vector Search (pgvector) ──► Medicine Database
    │
    ▼
Pharmacy Availability ──► Location + Distance
    │
    ▼
AI Enhancement (Gemini Flash) ──► Side effects, alternatives, warnings
    │
    ▼
Structured Response
```

---

## Features

### 🔍 AI-Powered Medicine Search
- Natural language queries in Arabic, French, or English
- Semantic similarity search using vector embeddings
- Finds medicines even with typos or generic descriptions

### 🗺️ Pharmacy Locator
- Find pharmacies that have your medicine in stock
- Sorted by distance from your location
- Real-time open/closed status
- Google Maps directions integration

### 💊 Drug Information
- Side effects explained in plain language
- Medicine alternatives when out of stock
- Drug interaction warnings *(coming soon)*
- Dosage guidelines

### 🤖 AI Modes

| Mode | Description | Cost |
|---|---|---|
| **Database Search** | Fast vector search from local DB | Free |
| **AI Enhanced** | Gemini AI for richer explanations | Free tier |
| **AI Pro** *(coming soon)* | Advanced models, interactions, personalization | Paid |

---

## Tech Stack
```
Frontend        Next.js 16 + Tailwind CSS
Admin Panel     Next.js 16 + NextAuth
Backend         Flask REST API (Python)
AI Engine       Google Gemini (gemini-1.5-flash + text-embedding-004)
Vector Search   pgvector (PostgreSQL extension)
Database        PostgreSQL 17
Maps            Google Maps API
Auth            NextAuth + Flask JWT
Deployment      Docker + Docker Compose
```

---

## Project Structure
```
espoir/
├── espoir-admin/        # Next.js admin dashboard (Super Admin + Pharmacy)
├── espoir-api/          # Flask REST API + Avicenna AI engine
├── espoir-web/          # Next.js customer web app (coming soon)
└── espoir-mobile/       # React Native mobile app (coming soon)
```

---

## API Endpoints

### Search
```
GET /api/v1/search?q={query}&lat={lat}&lng={lng}
```

### Medicines
```
GET  /api/v1/medicines
GET  /api/v1/medicines/{id}
GET  /api/v1/medicines/{id}/pharmacies
```

### Pharmacies
```
GET  /api/v1/pharmacies
GET  /api/v1/pharmacies/{id}
GET  /api/v1/pharmacies/{id}/medicines
POST /api/v1/pharmacies
PUT  /api/v1/pharmacies/{id}
```

### Auth
```
POST /api/v1/auth/login
POST /api/v1/auth/social-login
GET  /api/v1/auth/me
```

### Avicenna Chatbot
```
POST /api/v1/chatbot/chat
```

---

## Getting Started

### Prerequisites
- Docker + Docker Compose
- Google Gemini API key (free at [aistudio.google.com](https://aistudio.google.com))
- Google OAuth credentials

### Setup
```bash
# 1. Create shared Docker network
docker network create espoir-network

# 2. Start the API + Database
cd espoir-api
cp .env.example .env   # fill in your values
docker compose up -d

# 3. Start the Admin Panel
cd ../espoir-admin
cp .env.example .env   # fill in your values
docker compose up -d

# 4. Index medicines for AI search
docker compose exec api python src/scripts/index_medicines.py
```

### Environment Variables

**espoir-api `.env`**
```env
DATABASE_URL=postgresql://postgres:password@db:5432/espoir
JWT_SECRET_KEY=
GEMINI_API_KEY=
FLASK_ENV=development
```

**espoir-admin `.env`**
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
API_PUBLIC_URL=http://api:5000
```

---

## Roadmap

- [x] Flask REST API
- [x] Admin dashboard with RBAC
- [x] Docker deployment
- [x] Medicine semantic search (Avicenna v1)
- [x] Pharmacy locator
- [ ] Customer web app
- [ ] Mobile app (React Native / Expo)
- [ ] Prescription OCR upload
- [ ] Drug interaction warnings
- [ ] Avicenna Pro (paid tier)
- [ ] Multi-language support (AR / EN / DE)

---

## Why Avicenna?

Ibn Sina (980–1037), known in the West as Avicenna, wrote *The Canon of Medicine* — a medical encyclopedia used in universities for 600 years. He believed medicine should be accessible to everyone.

Espoir carries that same belief into the digital age.

---

## License

MIT License — free to use, modify, and distribute.

---

*Built with ❤️*