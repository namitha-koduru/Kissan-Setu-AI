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

## 🧪 Testing

### Backend Test Suite (36 Automated Tests)
```bash
cd backend
pytest -v
```

### Frontend Production Build
```bash
npm run build
```

---

## 🔑 Demo Credentials

| Role | Email / Phone | Password | Location |
|---|---|---|---|
| **Farmer** | `farmer@kisansetu.in` / `+91 98765 43210` | `demo123` | Nashik, Maharashtra |
| **FPO / Aggregator** | `fpo@kisansetu.in` | `demo123` | Godavari FPC, Nashik |
| **Institutional Buyer** | `buyer@kisansetu.in` | `demo123` | FreshFarm Foods, Pune |
| **Admin** | `admin@kisansetu.in` | `demo123` | Mumbai HQ |

---

## 🗄 Database Models & Schema (PostgreSQL)

- **`Farmer`**: ID, Name, Phone, Email, Preferred Language, State, District, Village, Coordinates
- **`Crop`**: ID, Farmer ID, Crop Name, Variety, Acreage, Quantity, Sowing Date, Harvest Date, Growth Stage, Soil Type
- **`Market`**: ID, Name, District, State, Coordinates
- **`MarketPrice`**: ID, Market ID, Crop Name, Price, Unit (kg/qtl), Date
- **`Buyer`**: ID, Name, Organization, Location, Phone, Email, Verified Badge, Rating
- **`Lot`**: ID, Farmer ID, Crop ID, Buyer ID, Quantity, Asking Price, Quality Grade, Harvest Date, Location, Status
- **`Offer`**: ID, Lot ID, Buyer ID, Offered Price, Status (Pending, Accepted, Rejected, Countered)
- **`Transaction`**: ID, Lot ID, Final Price, Status (Deal Locked, In Transit, Settled)

---

## 🌾 Phase 3: Vision AI & Leaf Symptom Assessment

KissanSetuAI integrates end-to-end multimodal Vision AI:
1. **Camera / Gallery Upload**: Farmers can capture or select a leaf/crop image directly from Chat or from the Crop Details page.
2. **Cloudinary Backend Storage**: Images are validated (Pillow integrity, MIME type, max 10MB limit) and stored in organized Cloudinary folders (with local dev fallback).
3. **Vision AI Inspection**: Gemini 1.5 Flash multimodal inspection extracts structured visual findings (detected crop, visible symptoms, possible issues + confidence, image quality check, and safety disclaimer).
4. **Contextual LLM Explanation**: Merges the vision findings with the farmer's registered crops, active growth stage, 7-day weather forecast, and mandi price trends, explaining findings in the farmer's selected language (Telugu, Hindi, Marathi, Tamil, Kannada, Bengali, Malayalam, English).
5. **Interactive Chat Integration**: Displays the uploaded leaf photo with full-screen zoom, loading stages (`"Uploading..."` → `"Analyzing symptoms with Vision AI..."` → `"Preparing guidance..."`), and structured actionable guidance.

---

## 🧪 Testing

```bash
# Run backend pytest suite (23 unit & integration tests)
cd backend
python -m pytest tests/ -v

# Run frontend TypeScript typecheck and production build
cd ..
npm run build
```