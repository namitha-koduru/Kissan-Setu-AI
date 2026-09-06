# KissanSetuAI System Architecture

**SIH Problem Statement:** SIH26132 — Strengthening market linkages and price discovery for farmers  
**Team:** Skill Squad | **Partner:** Government of Maharashtra

---

## 1. High-Level System Architecture

KissanSetuAI is built as a unified full-stack agronomic decision engine and digital mandi gateway:

```
                                  KISSANSETUAI PLATFORM
                                            │
               ┌────────────────────────────┼────────────────────────────┐
               ▼                            ▼                            ▼
         [TEXT QUERY]                 [VOICE QUERY]                [IMAGE UPLOAD]
         Natural Language             Spoken Audio                 Leaf / Crop Photo
               │                            │                            │
               │                            ▼                            ▼
               │                   Speech-to-Text (STT)           Vision AI (Cloudinary)
               │                   (Whisper / Mock Engine)        (Gemini 1.5 Flash)
               │                            │                            │
               └────────────────────────────┼────────────────────────────┘
                                            ▼
                                UNIFIED AI REASONING PIPELINE
                                            │
                    ┌───────────────────────┼───────────────────────┐
                    ▼                       ▼                       ▼
          [STRUCTURED DATA]          [RAG RETRIEVAL]         [LLM REASONING]
             PostgreSQL             Authoritative Knowledge   Contextual Multilingual
          - Soil Profiles           - ICAR Research            Synthesis (8 Languages)
          - 7-Day Weather           - MPKV Rahuri Guidelines
          - APMC Mandi Prices       - IMD Spray Windows
          - Verified Buyers         - Govt Soil Schemes
          - Digital Transactions
                    │                       │                       │
                    └───────────────────────┼───────────────────────┘
                                            ▼
                             FARMER-SPECIFIC ACTIONABLE ADVISORY
                                            │
                    ┌───────────────────────┴───────────────────────┐
                    ▼                                               ▼
          [VISUAL INTERFACE]                              [AUDIO SYNTHESIS]
          - Decision Center / Cards                       Text-to-Speech (TTS)
          - Verified Research Citations                   (gTTS / OpenAI / Browser)
          - Responsive Web & Mobile                       Playable Spoken Advisory
```

---

## 2. Core Subsystems

### A. Farm Intelligence Engine (Phase 4)
- **Soil Interpretation**: Evaluates pH, N-P-K nutrient reserves, and organic carbon with transparent deficiency flags and biofertilizer recommendations.
- **Weather Signals**: Computes 24h/48h rain risks, spray safety windows (<15 km/h wind, <50% rain probability), and growth stage irrigation adjustments.
- **Crop Suitability**: Multi-factor scoring (0–100) based on soil compatibility, regional climate, and seasonal profitability.
- **Daily Action Plan**: Prioritized agronomic schedule answering "What should I do today?".

### B. Market Intelligence & Price Discovery (Phase 5)
- **Mandi Benchmarks**: Real-time modal prices and 7-day historical trends across regional APMCs (Lasalgaon, Nashik, Pune, Pimpalgaon, Vashi).
- **Net Realization Math**:
  $$\text{Net In-Hand Return} = (\text{Modal Mandi Price} \times \text{Quantity}) - \text{Freight} - \text{Mandi Cess} - \text{Handling}$$
- **SELL / WAIT / COMPARE Decision**: Recommends whether to sell immediately or hold produce based on price momentum, storage shelf-life, and transit cost.

### C. Smart Buyer Matching & Transaction Lifecycle (Phase 6)
- **Matching Algorithm**: Ranks verified institutional buyers (FPCs, modern retail, exporters) based on crop match, volume demand, payment reliability, and distance radius.
- **Lot & Negotiation Flow**:
  $$\text{Create Lot} \longrightarrow \text{Receive Buyer Offers} \longrightarrow \text{AI Offer Intelligence} \longrightarrow \text{Counter / Accept} \longrightarrow \text{Digital Contract}$$
- **Logistics & Payment Tracking**: Non-custodial record-keeping from pickup scheduling to direct bank settlement verification.

### D. Multimodal Voice & Vision AI (Phases 3 & 7)
- **Speech-to-Text (STT)**: 10MB/60s validated voice input in 8 Indian languages (EN, HI, TE, MR, TA, KN, BN, ML).
- **Vision AI**: Objective visual inspection of foliar lesions, sucking pests, and deficiency symptoms with probabilistic confidence ratings.
- **Text-to-Speech (TTS)**: Speech-friendly, punchy spoken advisories with automated client fallback.

### E. Verified Knowledge + RAG Layer (Phase 8)
- **Grounding Provenance**: Grounded in ICAR (IIHR, IARI, DOGR, NRCG), MPKV Rahuri, IMD Agromet, and Government Agriculture Departments.
- **Anti-Hallucination Barrier**: Strict intent classifier defers live price, weather, and transaction queries to structured PostgreSQL tables, preventing factual hallucination.
- **Source Transparency**: Clickable verified research citations with authority badges, verification dates, and official URLs.

---

## 3. Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Vanilla CSS Design System, Lucide Icons |
| **Backend** | Python 3.11, FastAPI, Pydantic v2, SQLAlchemy 2.0, Alembic |
| **Database** | PostgreSQL 16 (Relational models + JSON vector embeddings) |
| **AI Orchestration** | Gemini 1.5 Flash (Vision & LLM), Whisper / gTTS (Voice), RAG Vector Cosine Engine |
| **Storage** | Cloudinary API (Multimodal crop imagery) with local filesystem fallback |
