# KissanSetuAI - Backend API Foundation (Phase 1, 2 & 3)

Multilingual AI-Powered Agricultural Decision Engine, Mandi Gateway & Computer Vision Assistant for Indian Farmers.

---

## 🌾 Phase 3: Vision AI Crop & Foliar Disease Assessment

In Phase 3, KissanSetuAI adds **Image AI capability** for visual crop assessment and foliar symptom identification.

### Architectural Flow:
```
Farmer (Upload / Camera)
         ↓
  Frontend Preview Card
         ↓
POST /api/chat/analyze-image
         ↓
Cloudinary Image Storage (or local dev media fallback)
         ↓
Vision AI Service (Gemini 1.5 Flash Multimodal / Structured Agronomic Model)
         ↓
Structured Vision Observation (Crop, Symptoms, Possible Issues, Quality, Confidence)
         ↓
Context Builder (Farmer profile, Growth stage, Weather risk, Mandi prices)
         ↓
LLM Multilingual Explanation (Telugu, Hindi, Marathi, Tamil, Kannada, Bengali, Malayalam, English)
         ↓
Saved to PostgreSQL (CropImage, ImageAnalysis, ChatMessage)
         ↓
Chat UI Transcript with Zoomable Image Attachment & Actionable Guidance
```

---

## 📦 Architecture & Directory Structure

```
backend/
├── app/
│   ├── main.py                  # FastAPI Application entry point & static file mounts
│   ├── config.py                # Environment configuration & settings (Cloudinary & LLM)
│   ├── database/
│   │   ├── connection.py        # SQLAlchemy engine, session lifecycle & pool management
│   │   ├── models.py            # PostgreSQL models (CropImage, ImageAnalysis, Conversation, ChatMessage, etc.)
│   │   └── seed.py              # Development seed script with realistic Indian agritech data
│   ├── schemas/                 # Pydantic v2 validation models
│   │   ├── image.py             # CropImageResponse, ImageAnalysisResponse, VisionAnalysisResult
│   │   ├── chat.py              # ChatRequest, ChatResponse, ChatAnalyzeImageResponse
│   │   ├── crop.py              # Harvest crop lifecycle schemas
│   │   ├── market.py            # Mandi & price schemas
│   │   └── ...
│   ├── routers/                 # Modular REST API endpoints
│   │   ├── chat.py              # POST /api/chat, POST /api/chat/analyze-image, GET /api/chat/conversations
│   │   ├── images.py            # POST /api/images/upload, GET /api/images/{id}, GET /api/images/crop/{crop_id}
│   │   ├── crops.py             # GET, POST, PUT, DELETE /api/crops
│   │   ├── market.py            # GET, POST /api/markets, /api/markets/{id}/prices
│   │   └── ...
│   ├── services/                # Core business logic services
│   │   └── cloudinary_service.py # Cloudinary upload, Pillow image validation, local dev fallback
│   └── ai/                      # AI & Computer Vision Orchestration
│       ├── vision_service.py    # Gemini Multimodal / Computer Vision analysis service
│       ├── llm_service.py       # Multilingual LLM chatbot & advisory engine
│       ├── context_builder.py   # Aggregates farm, crop, weather & mandi intelligence
│       └── prompts.py           # Agronomic system prompts, safety guardrails & vision prompts
├── alembic/                     # Database migrations
│   ├── versions/
│   │   ├── 001_initial_schema.py# Initial PostgreSQL migration
│   │   └── 002_crop_images_and_analysis.py # Phase 3 Crop images & analysis migration
├── tests/                       # Pytest test suite (23 passing tests)
│   ├── test_api.py              # Core REST API tests
│   ├── test_chat.py             # Chatbot & multilingual advisory tests
│   └── test_image_ai.py         # Cloudinary, Vision AI & multimodal chat tests
├── requirements.txt             # Python dependencies (fastapi, pillow, cloudinary, etc.)
└── .env.example                 # Environment variables blueprint
```

---

## 🔑 Environment Configuration

Required in `backend/.env`:

```env
PROJECT_NAME="KissanSetuAI Backend"
ENVIRONMENT=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/kissansetu
SECRET_KEY=dev_secret_key_change_in_production_123456789
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000

# Cloudinary Image Storage
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
MAX_IMAGE_SIZE_MB=10

# AI / Multimodal Vision Provider
LLM_PROVIDER=gemini
LLM_API_KEY=your_gemini_api_key
LLM_MODEL=gemini-1.5-flash
VISION_PROVIDER=gemini
VISION_MODEL=gemini-1.5-flash
```

> **Zero-Crash Local Fallback**: If Cloudinary or Gemini API keys are omitted in development, KissanSetuAI automatically saves images locally to `backend/uploads/crop-analysis/` (served at `/uploads/...`) and uses the agronomic rule-based vision assessment engine.

---

## 🧪 Automated Testing

Run all 23 backend unit and integration tests:

```bash
pytest tests/ -v
```

Test coverage includes:
- Valid image uploads & metadata persistence
- Corrupted file & invalid MIME type rejection
- Oversized (>10MB) image rejection
- Multimodal `/api/chat/analyze-image` endpoint execution
- Vision AI inspection schema & safety language
- Multilingual explanation in Indian languages (Telugu, Hindi, Marathi, etc.)
- Conversation history retention with image attachments

---

## 📡 Key Phase 3 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/chat/analyze-image` | Upload crop leaf photo, run Vision AI, generate multilingual LLM advisory, save conversation |
| `POST` | `/api/images/upload` | Direct image upload to Cloudinary/storage, saves `CropImage` record |
| `GET` | `/api/images/{id}` | Retrieve image metadata and storage URL |
| `GET` | `/api/images/crop/{crop_id}` | List all uploaded inspection photos for a specific crop |
| `POST` | `/api/chat` | Text-based multilingual conversational agronomic assistant |
| `GET` | `/api/chat/conversations` | List farmer advisory discussions |
| `GET` | `/api/chat/conversations/{id}` | Full message transcript including image attachments |
