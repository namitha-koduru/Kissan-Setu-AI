# KissanSetuAI (किसान सेतु AI)

**Multilingual AI-Powered Farm-to-Market Decision Intelligence & Mandi Gateway for Indian Farmers**

> **Smart India Hackathon (SIH) Problem Statement:** SIH26132 — Strengthening market linkages and price discovery for farmers  
> **Team:** Skill Squad | **Partner Ministry/Org:** Government of Maharashtra

---

## 🌟 Solution Architecture

KissanSetuAI bridges the gap between field harvest decisions and mandi realization through a high-performance, modular full-stack platform:

```
                  ┌──────────────────────────────────────────┐
                  │    React 18 + TypeScript + Vite UI       │
                  │ (Indian Agritech Design System & Voice)  │
                  └────────────────────┬─────────────────────┘
                                       │ REST APIs / JSON
                                       ▼
                  ┌──────────────────────────────────────────┐
                  │          FastAPI Backend Server          │
                  │   (Routers, Pydantic v2 & Middleware)    │
                  └───────┬──────────────────────────┬───────┘
                          │                          │
        ┌─────────────────┴───────────────┐          │
        ▼                                 ▼          ▼
┌───────────────────────────┐ ┌──────────────────────┐ ┌──────────────────────┐
│  AI Orchestration Layer   │ │ PostgreSQL Database  │ │  Mandi & Weather     │
│ - LLM Agronomic Advisory  │ │ (SQLAlchemy 2.0 ORM  │ │  - 7-Day Forecast    │
│ - Vision / Disease Detect │ │  & Alembic Schema)   │ │  - APMC Price Trends │
│ - Net Realization Engine  │ │ - Farmers & Crops    │ │  - Freight Net Math  │
│ - Multilingual Voice I/O  │ │ - Mandis, Lots, Bids │ │  - Agro Advisories   │
└───────────────────────────┘ └──────────────────────┘ └──────────────────────┘
```

---

## 📦 Project Structure

```
KissanSetuAI/
├── src/                         # Frontend React + TypeScript + Vite application
│   ├── components/              # Reusable UI components & Indian agritech widgets
│   ├── pages/                   # 19 Full-featured interactive views
│   ├── services/                # Centralized frontend API services
│   │   ├── api.ts               # Core Axios/Fetch client
│   │   ├── marketIntelligenceApi.ts # Phase 5: Price Discovery & Net Realization API
│   │   ├── farmIntelligenceApi.ts   # Phase 4: Soil, Weather & Farm Advisory API
│   │   ├── farmerApi.ts         # Farmer profile service
│   │   ├── cropApi.ts           # Crop lifecycle & harvest service
│   │   ├── marketApi.ts         # Mandi price discovery service
│   │   ├── weatherApi.ts        # Agro-meteorological forecast service
│   │   ├── buyerApi.ts          # Institutional buyer marketplace service
│   │   ├── lotApi.ts            # Lot listing service
│   │   ├── offerApi.ts          # Bidding & negotiation service
│   │   └── transactionApi.ts    # Escrow & settlement tracker
│   └── data/                    # Fallback demo data
├── backend/                     # Python 3 + FastAPI + SQLAlchemy Backend
│   ├── app/
│   │   ├── main.py              # FastAPI application & CORS setup
│   │   ├── config.py            # Environment configuration
│   │   ├── database/            # Models, connection pool, seeder
│   │   ├── schemas/             # Pydantic v2 data transfer schemas
│   │   ├── routers/             # REST endpoints (auth, farmers, crops, etc.)
│   │   ├── services/            # Agronomic decision algorithms & forecasting
│   │   └── ai/                  # Phase 2 Modular AI blueprints
│   ├── alembic/                 # Database migrations
│   ├── tests/                   # Pytest API integration test suite
│   ├── requirements.txt         # Python dependencies
│   └── README.md                # Dedicated backend documentation
└── README.md                    # Project documentation
```

---

## 🚀 Quickstart Guide

### 1. Backend Setup & Run

```bash
# Navigate to backend
cd backend

# Create & activate virtual environment (optional)
python -m venv venv
venv\Scripts\activate      # Windows
source venv/bin/activate   # Linux/macOS

# Install dependencies
pip install -r requirements.txt

# Run initial database seed (Populates Ramesh Kumar, Nashik APMC, Tomatoes, etc.)
python -m app.database.seed

# Start FastAPI server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- 📖 **Interactive Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- 🩺 **Health Check**: [http://localhost:8000/api/health](http://localhost:8000/api/health)

### 2. Frontend Setup & Run

In a new terminal window:
```bash
# In the project root directory
npm install
npm run dev
```

- 🌐 **Web Application**: [http://localhost:5173](http://localhost:5173)

---

## 🧠 Phase 4 — Farm Intelligence Engine

KissanSetuAI integrates a multi-factor **Farm Intelligence Engine** transforming structured field data into actionable, explainable agronomic advisories:

```
STRUCTURED DATA (Soil + Weather + Crop Growth Stage + Location + Season)
                               ↓
                   FARM INTELLIGENCE ENGINE
  (Soil Interpretation + Weather Signals + Suitability Scoring + Risk Aggregation)
                               ↓
               EXPLAINABLE ADVISORIES & ACTION PLAN
                               ↓
         MULTILINGUAL LLM EXPLANATION & CHAT ADVISORY
              (EN, HI, TE, MR, TA, KN, BN, ML)
```

### Key Modules:
- **Soil Health Intelligence (`SoilProfile`, `SoilService`)**: Transparent interpretation of pH, N-P-K nutrient reserves, organic carbon, and crop-soil compatibility with graceful partial data handling.
- **Weather-Aware Signals (`WeatherIntelligenceService`)**: Dynamic conversion of rain probability and wind into spraying windows, irrigation adjustment actions, and disease dissemination risks.
- **Explainable Crop Suitability Engine (`CropSuitabilityEngine`)**: Multi-factor scoring (0-100) with transparent reasoning ("Why suitable"), risk alerts, and pluggable ML classifier architecture.
- **Daily & Weekly Farm Action Plan (`FarmActionPlan`)**: Prioritized agronomic schedule displayed directly on the Dashboard and Decision Center.
- **Multilingual AI Chat Integration**: Answers "What should I do today?", "Should I irrigate?", "Which crop is suitable for my soil?" accurately using verified farm context.

---

## 📚 Phase 8 — Verified Agricultural Knowledge + RAG Layer

KissanSetuAI integrates an authoritative **Verified Agricultural Knowledge + RAG (Retrieval-Augmented Generation)** layer grounded in trusted national and state research sources:

```
Farmer Query / Spoken Voice / Leaf Image
                 │
                 ▼
      RAG Decision Layer (Intent Classifier)
   ├── Pure Live Mandi Price / Order Status ──► Direct Structured PostgreSQL Engine
   └── Agronomic / Disease / Soil / Storage ──► Semantic Retrieval Engine (Cosine Sim)
                                                       │
                                                       ▼
                          Authoritative Knowledge Base (ICAR / SAU / IMD / Dept of Agri)
                                                       │
                                                       ▼
                          System Prompt Grounding + Provenance Metadata
                                                       │
                                                       ▼
                          Grounded LLM Response with Verified Research Citations
```

### Key Capabilities:
- **Authoritative Provenance**: Grounded in ICAR (IIHR, IARI, DOGR, NRCG), State Agricultural Universities (MPKV Rahuri), IMD Agromet, and Government Agriculture Departments.
- **Strict Anti-Hallucination Boundaries**: RAG does NOT replace real-time market data or invent transaction state.
- **Multilingual Semantic Retrieval**: 128-dimensional dense concept embeddings supporting queries in 8 Indian languages (EN, HI, TE, MR, TA, KN, BN, ML).
- **Collapsible Source Citations**: Assistant responses feature expandable verified research cards with authority badges (`🏛 ICAR-IARI`, `🏛 MPKV Rahuri`), verification year, and direct official reference links.
- **Multimodal Grounding**: Visual crop leaf symptom assessments automatically retrieve and cite relevant pathological and IPM research.

---

## 🧪 Testing

### Backend Automated Pytest Suite (84 Passing Tests)
```bash
cd backend
python -m pytest tests/ -v
```
**Test Breakdown**:
- `test_rag.py`: 13 passed (Seeding, Search, Filters, RAG Decision Engine, Multilingual Chat, Voice RAG, Vision RAG, Authority citations)
- `test_voice_ai.py`: 10 passed (STT, Multilingual Voice Chat, TTS, Audio Streaming, Multimodal Voice)
- `test_buyer_matching_and_transactions.py`: 10 passed
- `test_market_intelligence.py`: 15 passed
- `test_farm_intelligence.py`: 13 passed
- `test_image_ai.py`: 7 passed
- `test_chat.py`: 5 passed
- `test_api.py`: 11 passed

### Frontend Production Build
```bash
npm run build
```
**Result**: Built cleanly in ~10s with 0 errors.