import os
from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "KissanSetuAI Backend"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Database: Supports PostgreSQL or SQLite fallback for portable dev testing
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:postgres@localhost:5432/kisansetu"
    )

    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dev_secret_key_change_in_production_123456789")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day

    # CORS
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, (list, str)):
            return v
    @property
    def cors_origins_list(self) -> List[str]:
        if isinstance(self.CORS_ORIGINS, list):
            return self.CORS_ORIGINS
        if isinstance(self.CORS_ORIGINS, str):
            return [i.strip() for i in self.CORS_ORIGINS.split(",") if i.strip()]
        return ["http://localhost:5173", "http://127.0.0.1:5173"]

    # LLM Settings (Phase 2 & Ollama Local Inference)
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "ollama")  # 'ollama', 'gemini', 'openai', 'groq', 'mock'
    LLM_API_KEY: str = os.getenv("LLM_API_KEY", "")
    LLM_MODEL: str = os.getenv("LLM_MODEL", "qwen3:4b")
    LLM_MAX_TOKENS: int = 1000
    LLM_TEMPERATURE: float = 0.3
    
    # Ollama Local LLM Settings
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "qwen3:4b")


    # Cloudinary Settings (Phase 3)
    CLOUDINARY_CLOUD_NAME: str = os.getenv("CLOUDINARY_CLOUD_NAME", "")
    CLOUDINARY_API_KEY: str = os.getenv("CLOUDINARY_API_KEY", "")
    CLOUDINARY_API_SECRET: str = os.getenv("CLOUDINARY_API_SECRET", "")
    MAX_IMAGE_SIZE_MB: int = 10

    # Vision AI Settings (Phase 3)
    VISION_PROVIDER: str = os.getenv("VISION_PROVIDER", "gemini")  # 'gemini', 'mock'
    VISION_MODEL: str = os.getenv("VISION_MODEL", "gemini-1.5-flash")

    # Voice AI Settings (Phase 7)
    VOICE_ENABLED: bool = True
    STT_PROVIDER: str = os.getenv("STT_PROVIDER", "mock")  # 'whisper', 'google', 'mock'
    STT_API_KEY: str = os.getenv("STT_API_KEY", "")
    STT_MODEL: str = os.getenv("STT_MODEL", "whisper-1")
    TTS_PROVIDER: str = os.getenv("TTS_PROVIDER", "mock")  # 'gtts', 'openai', 'mock'
    TTS_API_KEY: str = os.getenv("TTS_API_KEY", "")
    TTS_MODEL: str = os.getenv("TTS_MODEL", "tts-1")
    MAX_AUDIO_SIZE_MB: int = 10
    MAX_AUDIO_DURATION_SEC: int = 60

    # RAG & Knowledge Settings (Phase 8)
    RAG_ENABLED: bool = True
    RAG_TOP_K: int = 4
    RAG_MIN_SIMILARITY: float = 0.55
    EMBEDDING_PROVIDER: str = os.getenv("EMBEDDING_PROVIDER", "mock")  # 'openai', 'mock'

    EMBEDDING_API_KEY: str = os.getenv("EMBEDDING_API_KEY", "")
    EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL", "text-embedding-3-small")
    EMBEDDING_DIMENSION: int = 128

    # External Service Keys (Optional integrations)
    OPENWEATHER_API_KEY: str = ""
    GOV_MANDI_API_KEY: str = ""

    # Razorpay Payment Gateway Configuration (Phase 9)
    RAZORPAY_KEY_ID: str = os.getenv("RAZORPAY_KEY_ID", "rzp_test_kisansetu2026")
    RAZORPAY_KEY_SECRET: str = os.getenv("RAZORPAY_KEY_SECRET", "test_secret_kisansetu_secure")
    RAZORPAY_WEBHOOK_SECRET: str = os.getenv("RAZORPAY_WEBHOOK_SECRET", "webhook_secret_kisansetu_2026")

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
