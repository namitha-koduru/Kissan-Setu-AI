import math
import hashlib
import logging
from abc import ABC, abstractmethod
from typing import List, Optional, Dict
from app.config import settings

logger = logging.getLogger("embedding_service")


class EmbeddingProvider(ABC):
    @abstractmethod
    async def embed_text(self, text: str) -> List[float]:
        """Generate normalized embedding vector for text."""
        pass

    @abstractmethod
    async def embed_batch(self, texts: List[str]) -> List[List[float]]:
        """Generate normalized embedding vectors for a batch of texts."""
        pass


class OpenAIEmbeddingProvider(EmbeddingProvider):
    """OpenAI / Compatible Embedding Provider."""

    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key or settings.EMBEDDING_API_KEY or settings.LLM_API_KEY
        self.model = model or settings.EMBEDDING_MODEL or "text-embedding-3-small"

    async def embed_text(self, text: str) -> List[float]:
        res = await self.embed_batch([text])
        return res[0]

    async def embed_batch(self, texts: List[str]) -> List[List[float]]:
        if not self.api_key:
            raise ValueError("OpenAI Embedding requires an API key.")
        try:
            from openai import AsyncOpenAI
            client = AsyncOpenAI(api_key=self.api_key)
            cleaned = [t.replace("\n", " ").strip()[:1000] for t in texts]
            response = await client.embeddings.create(input=cleaned, model=self.model)
            return [data.embedding for data in response.data]
        except Exception as e:
            logger.warning(f"OpenAI embedding generation failed: {e}. Falling back to mock...")
            raise e


class MockEmbeddingProvider(EmbeddingProvider):
    """
    Deterministic Semantic Agricultural Embedding Provider.
    Generates normalized 128-dimensional dense vectors based on semantic agricultural concept hashing.
    Supports English, Hindi, Telugu, Marathi, Tamil, Kannada, Bengali, and Malayalam queries.
    """

    DIMENSION = 128

    # Semantic keyword mappings for agricultural knowledge clustering
    CONCEPT_KEYWORDS = {
        # Diseases & Pathogens
        0: ["blight", "fungal", "spots", "alternaria", "फफूंद", "झुलसा", "తెగులు", "ब्लाइट", "डाग", "கருகல்", "ರೋಗ"],
        1: ["wilt", "fusarium", "bacterial", "मर", "విల్ట్", "मुरझान", "வாடல்"],
        2: ["leaf curl", "virus", "gemini", "thrips", "चूर्णी", "ముడత", "चुरडा", "சுருட்டல்", "ಎಲೆ ಮುದುರು"],
        # Pests & IPM
        3: ["pest", "aphid", "caterpillar", "borer", "कीट", "పురుగు", "కిటక", "பூச்சி", "कीड"],
        4: ["neem", "spray", "biocontrol", "organic", "नीम", "వేప", "कडुलिंब", "வேம்பு"],
        # Irrigation & Water
        5: ["irrigation", "water", "drip", "moisture", "सिंचाई", "నీటి", "पाणी", "பாசனம்", "ನೀರು", "पानी"],
        # Soil & Nutrients
        6: ["soil", "organic carbon", "ph", "clay", "मिट्टी", "నేల", "माती", "மண்", "ಮಣ್ಣು", "मृदा"],
        7: ["nitrogen", "phosphorus", "potassium", "npk", "fertilizer", "उर्वरक", "ఎరువు", "खत", "உரம்", "ಗೊಬ್ಬರ"],
        # Post-Harvest & Storage
        8: ["storage", "curing", "ventilation", "shelf life", "भंडारण", "నిల్వ", "साठवण", "சேமிப்பு", "ಶೇಖರಣೆ"],
        9: ["harvest", "picking", "crates", "sorting", "कटाई", "కోత", "काढणी", "அறுவடை", "ಕೊಯ್ಲು"],
        # Crops
        10: ["tomato", "टमाटर", "టమాటా", "टोमॅटो", "தக்காளி", "ಟೊಮೇಟೊ"],
        11: ["onion", "प्याज", "ఉల్లి", "कांदा", "வெங்காயம்", "ಈರುಳ್ಳಿ"],
        12: ["grape", "grapes", "अंगूर", "ద్రాక్ష", "द्राक्ष", "திராட்சை", "ದ್ರಾಕ್ಷಿ"],
        13: ["chilli", "chili", "मिर्च", "మిర్చి", "मिरची", "மிளகாய்", "ಮೆಣಸಿನಕಾಯಿ"],
        14: ["potato", "आलू", "బంగాళాదుంప", "बटाटा", "உருளைக்கிழங்கு", "ಆಲೂಗಡ್ಡೆ"],
        15: ["wheat", "गेहूं", "గోధుమ", "गहू", "கோதுமை", "ಗೋಧಿ"],
        16: ["cotton", "कपास", "పత్తి", "कापूस", "பருத்தி", "ಹತ್ತಿ"],
    }

    async def embed_text(self, text: str) -> List[float]:
        return self._generate_vector(text)

    async def embed_batch(self, texts: List[str]) -> List[List[float]]:
        return [self._generate_vector(t) for t in texts]

    def _generate_vector(self, text: str) -> List[float]:
        cleaned = text.lower()
        vec = [0.0] * self.DIMENSION

        # 1. Concept Keyword Semantic Mapping (High weights in primary semantic slots)
        for concept_idx, keywords in self.CONCEPT_KEYWORDS.items():
            for kw in keywords:
                if kw in cleaned:
                    base_dim = concept_idx * 6
                    for offset in range(6):
                        if base_dim + offset < self.DIMENSION:
                            vec[base_dim + offset] += 2.5 / (offset + 1)

        # 2. Character N-Gram & Word Hashing for general vocabulary similarity
        words = cleaned.split()
        for w in words:
            h = int(hashlib.md5(w.encode("utf-8")).hexdigest()[:8], 16)
            dim = h % self.DIMENSION
            weight = 0.5 + (len(w) * 0.1)
            vec[dim] += weight

        # 3. L2 Unit Normalization (so dot product equals cosine similarity)
        norm = math.sqrt(sum(v * v for v in vec))
        if norm > 0:
            return [round(v / norm, 5) for v in vec]
        # Return uniform unit vector if empty
        val = round(1.0 / math.sqrt(self.DIMENSION), 5)
        return [val] * self.DIMENSION


class EmbeddingService:
    """Composite Embedding Manager with Provider Selection & In-Memory Cache."""

    def __init__(self):
        self.providers: Dict[str, EmbeddingProvider] = {
            "mock": MockEmbeddingProvider(),
        }
        if settings.EMBEDDING_API_KEY or settings.LLM_API_KEY:
            self.providers["openai"] = OpenAIEmbeddingProvider()

        self._cache: Dict[str, List[float]] = {}

    def get_provider(self, name: Optional[str] = None) -> EmbeddingProvider:
        provider_name = name or settings.EMBEDDING_PROVIDER
        return self.providers.get(provider_name, self.providers["mock"])

    async def embed_query(self, text: str) -> List[float]:
        cleaned = text.strip().lower()
        if cleaned in self._cache:
            return self._cache[cleaned]

        provider = self.get_provider()
        try:
            vec = await provider.embed_text(cleaned)
        except Exception as e:
            logger.warning(f"Primary embedding failed: {e}. Using deterministic mock fallback...")
            vec = await self.providers["mock"].embed_text(cleaned)

        self._cache[cleaned] = vec
        return vec

    async def embed_chunks(self, texts: List[str]) -> List[List[float]]:
        provider = self.get_provider()
        try:
            return await provider.embed_batch(texts)
        except Exception as e:
            logger.warning(f"Batch embedding failed: {e}. Using mock fallback...")
            return await self.providers["mock"].embed_batch(texts)


embedding_service = EmbeddingService()
