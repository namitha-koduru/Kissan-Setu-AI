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

## 🧪 Testing

```bash
# Run backend pytest suite
cd backend
pytest tests/test_api.py -v

# Run frontend TypeScript typecheck and build
cd ..
npm run build
```