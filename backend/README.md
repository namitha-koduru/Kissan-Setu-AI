# KissanSetuAI - Backend API Foundation (Phase 1)

Multilingual AI-Powered Agricultural Decision Engine & Mandi Gateway for Indian Farmers.

## 🌾 Overview

The KissanSetuAI backend is built with **Python 3**, **FastAPI**, **SQLAlchemy**, and **PostgreSQL** (with zero-configuration SQLite development fallback). It provides the core data services for farmer management, harvest crop tracking, APMC mandi market price discovery, institutional buyer matchmaking, lot listings, bidding, transactions, and hyper-local agricultural weather advisories.

---

## 🏗 Architecture & Directory Structure

```
backend/
├── app/
│   ├── main.py                  # FastAPI Application entry point & middleware
│   ├── config.py                # Environment configuration & settings
│   ├── database/
│   │   ├── connection.py        # SQLAlchemy engine, session lifecycle & pool management
│   │   ├── models.py            # PostgreSQL database models (Farmer, Crop, Market, etc.)
│   │   └── seed.py              # Development seed script with realistic Indian agritech data
│   ├── schemas/                 # Pydantic v2 validation models
│   │   ├── auth.py              # Auth & JWT / Dev login schemas
│   │   ├── farmer.py            # Farmer profile schemas
│   │   ├── crop.py              # Harvest crop lifecycle schemas
│   │   ├── market.py            # Mandi & price schemas
│   │   ├── buyer.py             # Buyer & FPC listing schemas
│   │   ├── lot.py               # Marketplace lot schemas
│   │   ├── offer.py             # Buyer bid/offer schemas
│   │   ├── transaction.py       # Settlement & transaction schemas
│   │   ├── weather.py           # Weather forecast & advisory schemas
│   │   └── recommendation.py    # AI recommendation engine schemas
│   ├── routers/                 # Modular REST API endpoints
│   │   ├── auth.py              # POST /api/auth/login, GET /api/auth/me
│   │   ├── farmers.py           # GET, POST, PUT /api/farmers
│   │   ├── crops.py             # GET, POST, PUT, DELETE /api/crops
│   │   ├── market.py            # GET, POST /api/markets, /api/markets/{id}/prices
│   │   ├── buyers.py            # GET, POST /api/buyers
│   │   ├── lots.py              # GET, POST, PUT /api/lots
│   │   ├── offers.py            # GET, POST, PUT /api/offers
│   │   ├── transactions.py      # GET, POST, PUT /api/transactions
│   │   ├── weather.py           # GET /api/weather
│   │   └── recommendations.py   # GET /api/recommendations, POST /api/recommendations/analyze
│   ├── services/                # Core business logic services
│   │   ├── crop_service.py      # Agronomic calculations & harvest tracking
│   │   ├── market_service.py    # Mandi price discovery & filtering
│   │   ├── weather_service.py   # Meteorological forecasting & risk analysis
│   │   └── recommendation_service.py # Net realization ranking & decision engine
│   └── ai/                      # Future AI/ML service blueprints (Phase 2)
│       ├── llm_service.py       # Multilingual LLM chatbot & advisory
│       ├── vision_service.py    # Computer vision for crop defect/leaf analysis
│       ├── disease_detection.py # Foliar pathology & pest diagnostics
│       └── recommendation_engine.py # AI decision engine orchestrator
├── alembic/                     # Database migrations
│   ├── versions/
│   │   └── 001_initial_schema.py# Initial PostgreSQL migration
│   └── env.py
├── tests/                       # Pytest test suite
│   └── test_api.py              # Comprehensive API integration tests
├── requirements.txt             # Python dependencies
├── alembic.ini                  # Alembic configuration
└── .env.example                 # Environment variables blueprint
```

---

## 🚀 Getting Started

### 1. Prerequisites
- Python 3.10+
- PostgreSQL (Optional for local development; SQLite fallback is automatically used if PostgreSQL is not active)

### 2. Environment Setup
```bash
# Navigate to backend directory
cd backend

# Create virtual environment (optional)
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Default variables:
```env
PROJECT_NAME="KissanSetuAI Backend"
ENVIRONMENT=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/kissansetu
SECRET_KEY=dev_secret_key_change_in_production_123456789
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000
```

### 4. Database Initialization & Seeding
```bash
# Run database seeder with realistic Indian agricultural demo data
python -m app.database.seed
```
This populates:
- **Farmer**: Ramesh Kumar (Nashik, Maharashtra)
- **Crops**: Tomato (Hybrid F1), Onion (Bhima Super), Grapes (Thompson Seedless)
- **Markets**: Lasalgaon APMC, Nashik APMC, Pune APMC, Vashi APMC, Pimpalgaon APMC
- **Buyers**: Sahyadri Farms FPC, FreshToHome Supply, Reliance Fresh Procurement, BigBasket Direct Mandi Hub, Mahaveer Agro Traders
- **Lots, Offers & Transactions**: Live marketplace lots, pending buyer bids, and escrow settlement milestones.

### 5. Start the Backend Server
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Interactive Swagger API Documentation:
- 📖 **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- 📑 **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- 🩺 **Health Check**: [http://localhost:8000/api/health](http://localhost:8000/api/health)

---

## 🧪 Running Automated Tests

Run the full pytest integration test suite:
```bash
pytest tests/test_api.py -v
```

---

## 📡 REST API Summary

| Category | Method | Endpoint | Description |
|---|---|---|---|
| **Health** | `GET` | `/api/health` | Service health status check |
| **Auth** | `POST` | `/api/auth/login` | Phone-based developer login |
| | `GET` | `/api/auth/me` | Current farmer profile |
| **Farmers** | `GET` | `/api/farmers/{id}` | Get farmer profile |
| | `POST` | `/api/farmers` | Create new farmer |
| | `PUT` | `/api/farmers/{id}` | Update farmer details |
| **Crops** | `GET` | `/api/farmers/{id}/crops` | List crops for farmer |
| | `POST` | `/api/crops` | Register new crop |
| | `GET` | `/api/crops/{id}` | Get crop details |
| | `PUT` | `/api/crops/{id}` | Update crop info |
| | `DELETE` | `/api/crops/{id}` | Remove crop entry |
| **Markets** | `GET` | `/api/markets` | List APMC mandis |
| | `GET` | `/api/markets/{id}` | Get mandi details |
| | `GET` | `/api/markets/{id}/prices`| Real-time crop commodity prices |
| **Buyers** | `GET` | `/api/buyers` | Institutional buyer directory |
| | `GET` | `/api/buyers/{id}` | Get buyer profile & rating |
| **Lots** | `GET` | `/api/farmers/{id}/lots` | Get farmer listed lots |
| | `POST` | `/api/lots` | Post crop harvest lot for sale |
| | `GET` | `/api/lots/{id}` | Get lot details |
| **Offers** | `GET` | `/api/lots/{id}/offers` | List buyer bids on lot |
| | `POST` | `/api/offers` | Submit buyer purchase offer |
| | `PUT` | `/api/offers/{id}/status` | Accept/Reject/Counter bid |
| **Transactions** | `GET` | `/api/transactions` | List escrow settlements |
| | `GET` | `/api/transactions/{id}`| Get transaction lifecycle |
| | `PUT` | `/api/transactions/{id}/status` | Update transaction status |
| **Weather** | `GET` | `/api/weather` | 7-day meteorological forecast & farm advisory |
| **Decision AI**| `GET` | `/api/recommendations` | Net realization calculation & SELL/WAIT/SWITCH advisory |
