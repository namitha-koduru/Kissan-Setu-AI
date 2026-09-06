# KissanSetuAI — Smart India Hackathon (SIH 2026) Demo Playbook

**SIH Problem Statement:** SIH26132 — Strengthening market linkages and price discovery for farmers  
**Team:** Skill Squad | **Partner Ministry:** Government of Maharashtra

---

## 🎬 5–10 Minute Presentation Demonstration Flow

```
[STEP 1: COMMAND CENTER]  ──►  [STEP 2: VOICE AI]        ──►  [STEP 3: VISION AI + RAG]
Dashboard & Farm Alerts        "Should I water tomato today?"  Upload Leaf Photo + ICAR Citations
            │                                                                │
            ▼                                                                ▼
[STEP 6: DIRECT SETTLEMENT]◄── [STEP 5: BUYER MATCHING]   ◄── [STEP 4: MARKET INTELLIGENCE]
Accepted Offer & Payment Track Matching Sahyadri Farms FPC    Net Realization: ₹32/kg vs Freight
```

---

### Step 1: Central Command Center (Dashboard)
- **Action**: Open [http://localhost:5173/dashboard](http://localhost:5173/dashboard).
- **Narrative**:
  > *"Welcome to KissanSetuAI. Here, Ramesh Kumar, a smallholder farmer in Dindori, Nashik, sees his complete farm state at a glance: 2.5 acres of hybrid tomato near harvest, upcoming 48-hour rain risk, and active market alerts."*
- **Key Visuals**:
  - Farm Today prioritize card (`Rain alert: Avoid foliar spraying today`).
  - Active Crops summary (Tomato, Onion, Grapes).
  - Quick Action button `[ 🎙 Speak to AI ]`.

---

### Step 2: Voice AI Interaction (Natural Multilingual Query)
- **Action**: Click `[ 🎙 Speak to AI ]` or navigate to `/chat`. Switch language to **Hindi (हिंदी)** or **Telugu (తెలుగు)** or keep **English**. Click microphone button.
- **Farmer Query**:
  > *"Should I irrigate my tomato crop today?"*
- **System Output**:
  - Real-time speech transcription.
  - Contextual response: *"With 70% rain probability in Nashik over the next 48 hours and your tomato crop at fruit turning stage, suspend drip cycles for 24-48 hours to prevent fruit splitting and root rot."*
  - Spoken audio playback.

---

### Step 3: Multimodal Vision AI + Verified RAG Knowledge
- **Action**: In Chat, click the camera icon `[ 📷 ]` and upload a crop leaf image (or ask about tomato leaf spots).
- **Farmer Query**:
  > *"What is this spot on my tomato leaf and how do I cure it?"*
- **System Output**:
  - Vision inspection: Concentric brown target-like lesions detected.
  - Probabilistic classification: Possible Early Blight (*Alternaria solani*) (~78% confidence).
  - Actionable guidance: Prune lower infected leaves, avoid evening sprinkler wetting, spray organic Neem Seed Kernel Extract.
  - **Verified Citations Card**: Expandable card citing `🏛 ICAR-IARI: Integrated Disease Management for Tomato Early Blight` with official verification link.

---

### Step 4: Market Intelligence & Net Realization Math
- **Action**: Navigate to `/market` or `/market/1`.
- **Narrative**:
  > *"The fundamental flaw in traditional farming is looking only at gross mandi rates. KissanSetuAI calculates Net Realization."*
- **Comparison**:
  - Lasalgaon APMC: ₹32.00/kg gross – ₹1.50 freight = **₹30.50/kg net**.
  - Pimpalgaon APMC: ₹33.00/kg gross – ₹3.20 freight = **₹29.80/kg net**.
  - **Decision Engine**: Recommends **SELL NOW at Lasalgaon** (momentum peak before rain).

---

### Step 5: Smart Buyer Matching & Negotiation Intelligence
- **Action**: Navigate to `/buyers` or `/lots`.
- **Narrative**:
  > *"Instead of distress selling to middlemen, KissanSetuAI matches Ramesh directly with verified institutional buyers."*
- **Matching Highlights**:
  - **Sahyadri Farms FPC**: 98% match, verified badge, farm-gate pickup, indicative price ₹32.50/kg.
- **Offer Intelligence**:
  - Buyer sends offer at ₹30.00/kg.
  - AI Negotiation Advisor suggests reasonable counter-offer range: **₹31.50 – ₹32.50/kg**.

---

### Step 6: Digital Transaction Flow & Payment Record
- **Action**: Navigate to `/transactions` or `/transactions/1`.
- **Narrative**:
  > *"Once accepted, an immutable digital transaction contract is created. Ramesh tracks logistics pickup (MH-15-EG-4412) and verified direct bank transfer settlement without intermediaries taking cuts."*

---

## 💡 Judge Questions & Answers (Technical Defensibility)

#### Q1: Why use PostgreSQL instead of separate vector or NoSQL databases?
> **Answer**: Agricultural decision-making requires relational consistency across farmers, crops, inventory lots, legal offers, and escrow transactions. PostgreSQL provides ACID compliance, structured indexing, and native support for JSON vector embeddings in a single resilient database without multi-database synchronization lag.

#### Q2: How do you prevent LLM hallucination in agricultural advice?
> **Answer**: We enforce strict architectural boundaries:
> 1. Real-time market prices, buyer offers, and weather signals come strictly from deterministic PostgreSQL records.
> 2. Agronomic advice is grounded in verified ICAR/SAU research chunks via cosine similarity retrieval.
> 3. The LLM is strictly constrained by prompt guardrails prohibiting fabricated chemicals, fake market numbers, or certainty claims on visual inspections.

#### Q3: How does your RAG layer verify source credibility?
> **Answer**: We index exclusively official sources: ICAR institutes (IIHR, IARI, DOGR, NRCG), State Agricultural Universities (MPKV Rahuri), and Government Agriculture Departments. Each chunk retains source provenance, authority classification, and last-verified timestamps displayed directly to the farmer.

#### Q4: How does Net Realization benefit smallholder farmers?
> **Answer**: Small farmers often travel to distant mandis chasing higher advertised rates, only to lose profit to fuel, hamali (handling), and market cess. Net Realization transparently deducts localized logistics costs to highlight the true in-hand cash return.

#### Q5: How does multilingual Voice AI work for low-literacy farmers?
> **Answer**: Voice acts as an intuitive input/output layer feeding into the same unified AI brain. Spoken audio in 8 Indian languages (Hindi, Telugu, Marathi, Tamil, Kannada, Bengali, Malayalam, English) is converted to text, processed through unified farm context, and spoken back via natural Text-to-Speech audio.

---

## 🛡 Backup & Presentation Fallback Plan
- **Backend Offline / API Rate Limit**: The platform includes built-in mock providers for STT, TTS, Embeddings, and Vision AI so live demonstrations run smoothly without internet dropouts.
- **Pre-seeded Demo Persona**: Farmer **Ramesh Kumar (+91 98765 43210)** in Nashik, Maharashtra with ready-to-demo Tomato, Onion, and Grape crops, active lots, offers, and transaction audit trails.
