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
Semantic Understanding (OpenRouter Free Models)
    │
    ▼
Vector Search (pgvector) ──► Medicine Database
    │
    ▼
Pharmacy Availability ──► Location + Distance
    │
    ▼
AI Enhancement ──► Side effects, alternatives, warnings
    │
    ▼
Structured Response
```

---

## Features

### 🔍 AI-Powered Medicine Search
- Natural language queries
- Semantic similarity search using vector embeddings
- Finds medicines even with typos or generic descriptions

### 🗺️ Pharmacy Locator
- Find pharmacies that have your medicine in stock 
- Sorted by distance from your location *(coming soon)*
- Real-time open/closed status
- Google Maps directions integration

### 💊 Drug Information
- Side effects explained in plain language
- Medicine alternatives when out of stock
- Drug interaction warnings *(coming soon)*
- Dosage guidelines

### 🌍 Language Support

| Language | Status |
|---|---|
| English | ✅ Available |
| Arabic | 🔜 Coming soon |
| German | 🔜 Coming soon |

### 🤖 AI Modes

| Mode | Description | Cost |
|---|---|---|
| **Database Search** | Fast vector search from local DB | Free |
| **AI Enhanced** | OpenRouter free models for richer explanations | Free |
| **AI Pro** *(coming soon)* | Advanced models, interactions, personalization | Paid |

> Espoir uses free, open-weight health-focused models via [OpenRouter](https://openrouter.ai). A paid tier with more powerful models is planned.

---

## Tech Stack
```
Frontend        Next.js 16 + Tailwind CSS
Admin Panel     Next.js 16 + NextAuth
Backend         Flask REST API (Python)
AI Engine       OpenRouter (free open-weight models)
Vector Search   pgvector (PostgreSQL extension)
Database        PostgreSQL 17
Maps            Google Maps API
Auth            NextAuth + Flask JWT
Deployment      Docker + Docker Compose
```



## Roadmap

- [x] Flask REST API
- [x] Admin dashboard with RBAC
- [x] Docker deployment
- [x] Medicine semantic search (Avicenna v1)
- [x] Customer web app
- [ ] Mobile app (React Native / Expo)
- [ ] Prescription OCR
- [ ] Arabic language support
- [ ] German language support

---

## Why Avicenna?

Ibn Sina (980–1037), known in the West as Avicenna, wrote *The Canon of Medicine* — a medical encyclopedia used in universities for 600 years. He believed medicine should be accessible to everyone.

Espoir carries that same belief into the digital age.

---

## License

MIT License — free to use, modify, and distribute.

---

*Built with ❤️*