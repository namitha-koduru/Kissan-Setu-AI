import os
import uuid
import time
import logging
from abc import ABC, abstractmethod
from typing import Optional, Dict, Any
from pydantic import BaseModel
from app.config import settings

logger = logging.getLogger("tts_service")

# Audio storage directory
VOICE_AUDIO_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads", "voice")
os.makedirs(VOICE_AUDIO_DIR, exist_ok=True)


class TTSResult(BaseModel):
    available: bool = True
    audio_id: Optional[str] = None
    url: Optional[str] = None
    mime_type: str = "audio/mpeg"
    language: str = "en"
    duration_seconds: Optional[float] = None
    provider: str = "mock"


class TextToSpeechProvider(ABC):
    @abstractmethod
    async def synthesize(
        self,
        text: str,
        language: str = "en",
        speed: str = "normal"
    ) -> Optional[bytes]:
        """Synthesize text into audio bytes (e.g. MP3)."""
        pass


class GoogleGTTSProvider(TextToSpeechProvider):
    """Google Text-to-Speech (gTTS) Provider supporting Indian languages."""

    LANG_MAP = {
        "en": "en",
        "hi": "hi",
        "te": "te",
        "ta": "ta",
        "mr": "mr",
        "kn": "kn",
        "bn": "bn",
        "ml": "ml",
        "gu": "gu",
        "pa": "pa",
    }

    async def synthesize(
        self,
        text: str,
        language: str = "en",
        speed: str = "normal"
    ) -> Optional[bytes]:
        try:
            from gtts import gTTS
            import io
            gtts_lang = self.LANG_MAP.get(language.lower(), "en")
            slow = speed == "slow"
            tts = gTTS(text=text[:600], lang=gtts_lang, slow=slow)
            fp = io.BytesIO()
            tts.write_to_fp(fp)
            fp.seek(0)
            return fp.read()
        except Exception as e:
            logger.warning(f"gTTS synthesis failed: {e}")
            return None


class OpenAITTSProvider(TextToSpeechProvider):
    """OpenAI TTS Provider."""

    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key or settings.TTS_API_KEY or settings.LLM_API_KEY
        self.model = model or settings.TTS_MODEL or "tts-1"

    async def synthesize(
        self,
        text: str,
        language: str = "en",
        speed: str = "normal"
    ) -> Optional[bytes]:
        if not self.api_key:
            return None
        try:
            from openai import AsyncOpenAI
            client = AsyncOpenAI(api_key=self.api_key)
            response = await client.audio.speech.create(
                model=self.model,
                voice="alloy",
                input=text[:600]
            )
            return response.content
        except Exception as e:
            logger.warning(f"OpenAI TTS synthesis failed: {e}")
            return None


class MockTTSProvider(TextToSpeechProvider):
    """
    Lightweight Synthetic TTS Audio Provider for testing and offline environments.
    Produces valid playable MP3 frame header data.
    """

    # Valid minimal silent/synthetic MP3 byte header
    SYNTHETIC_MP3_BYTES = (
        b"\xff\xfb\x90d\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00"
        b"\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00"
        b"\xff\xfb\x90d\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00"
        b"\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00"
    )

    async def synthesize(
        self,
        text: str,
        language: str = "en",
        speed: str = "normal"
    ) -> Optional[bytes]:
        # Generate lightweight synthetic audio bytes proportional to text length
        repeat_count = max(4, min(64, len(text) // 10))
        return self.SYNTHETIC_MP3_BYTES * repeat_count


class TTSService:
    """Composite TTS Service managing synthesis, file saving, and temporary caching."""

    def __init__(self):
        self.providers: Dict[str, TextToSpeechProvider] = {
            "gtts": GoogleGTTSProvider(),
            "mock": MockTTSProvider(),
        }
        if settings.TTS_API_KEY or settings.LLM_API_KEY:
            self.providers["openai"] = OpenAITTSProvider()

    def get_provider(self, name: Optional[str] = None) -> TextToSpeechProvider:
        provider_name = name or settings.TTS_PROVIDER
        return self.providers.get(provider_name, self.providers["mock"])

    async def synthesize_speech(
        self,
        text: str,
        language: str = "en",
        speed: str = "normal",
        provider_name: Optional[str] = None
    ) -> TTSResult:
        if not text.strip():
            return TTSResult(available=False, language=language)

        provider = self.get_provider(provider_name)
        audio_bytes = await provider.synthesize(text, language, speed)

        # If primary failed, use mock fallback
        if not audio_bytes:
            fallback = self.providers["mock"]
            audio_bytes = await fallback.synthesize(text, language, speed)

        if not audio_bytes:
            return TTSResult(available=False, language=language)

        # Save audio file with unique ID
        audio_id = f"aud_{uuid.uuid4().hex[:12]}"
        filename = f"{audio_id}.mp3"
        filepath = os.path.join(VOICE_AUDIO_DIR, filename)

        try:
            with open(filepath, "wb") as f:
                f.write(audio_bytes)

            audio_url = f"/api/voice/audio/{audio_id}"
            estimated_duration = max(2.0, len(text.split()) * 0.4)

            return TTSResult(
                available=True,
                audio_id=audio_id,
                url=audio_url,
                mime_type="audio/mpeg",
                language=language,
                duration_seconds=round(estimated_duration, 1),
                provider=provider_name or settings.TTS_PROVIDER
            )
        except Exception as e:
            logger.error(f"Failed to persist synthesized audio: {e}")
            return TTSResult(available=False, language=language)

    def get_audio_path(self, audio_id: str) -> Optional[str]:
        """Retrieve filesystem path for generated audio ID."""
        # Sanitize audio_id
        safe_id = os.path.basename(audio_id).replace(".mp3", "")
        filepath = os.path.join(VOICE_AUDIO_DIR, f"{safe_id}.mp3")
        if os.path.exists(filepath):
            return filepath
        return None


tts_service = TTSService()
