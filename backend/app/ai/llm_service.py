"""
LLM Provider Abstraction and Service for KissanSetuAI Farmer Assistant.
Supports Ollama (default local Qwen3 4B), Google Gemini, OpenAI-compatible APIs (OpenAI/Groq/OpenRouter), and an Intelligent Fallback Dev Assistant.
"""

import json
import logging
from typing import List, Dict, Any, Optional
import httpx
from app.config import settings

logger = logging.getLogger("kissansetu.ai")


class LLMService:
    def __init__(self):
        self.provider = (settings.LLM_PROVIDER or "ollama").lower()
        self.api_key = settings.LLM_API_KEY
        self.model = settings.LLM_MODEL or getattr(settings, "OLLAMA_MODEL", "qwen3:4b") or "qwen3:4b"
        self.ollama_base_url = (getattr(settings, "OLLAMA_BASE_URL", "http://localhost:11434") or "http://localhost:11434").rstrip("/")
        self.timeout = 25.0

    async def generate_response(
        self,
        messages: List[Dict[str, str]],
        system_prompt: str,
        language: str = "en"
    ) -> str:
        """
        Main interface to dispatch generation request to the configured LLM provider.
        """
        try:
            # 1. Ollama Local Provider (No API key required)
            if self.provider == "ollama":
                return await self._call_ollama(messages, system_prompt)

            # 2. Cloud Providers (Require API key, fallback to local agronomic engine if missing)
            if self.provider in ["gemini", "google"]:
                if not self.api_key:
                    logger.info("No Gemini API key configured, using dev agronomic fallback engine.")
                    return self._generate_fallback_response(messages, language)
                return await self._call_gemini(messages, system_prompt)

            elif self.provider in ["openai", "groq", "openrouter"]:
                if not self.api_key:
                    logger.info("No OpenAI/Groq API key configured, using dev agronomic fallback engine.")
                    return self._generate_fallback_response(messages, language)
                return await self._call_openai_compatible(messages, system_prompt)

            elif self.provider == "mock":
                return self._generate_fallback_response(messages, language)

            else:
                logger.warning(f"Unknown LLM provider '{self.provider}', using fallback assistant.")
                return self._generate_fallback_response(messages, language)

        except Exception as exc:
            logger.warning(f"LLM Provider '{self.provider}' call failed ({exc}). Gracefully falling back to dev agronomic engine.")
            return self._generate_fallback_response(messages, language, error_context=str(exc))

    async def _call_ollama(self, messages: List[Dict[str, str]], system_prompt: str) -> str:
        """
        Calls local Ollama instance (default: Qwen3 4B via /api/chat).
        Runs offline without requiring any API key.
        """
        url = f"{self.ollama_base_url}/api/chat"
        
        full_messages = [{"role": "system", "content": system_prompt}]
        for msg in messages:
            full_messages.append({"role": msg["role"], "content": msg["content"]})

        payload = {
            "model": self.model,
            "messages": full_messages,
            "stream": False,
            "options": {
                "temperature": settings.LLM_TEMPERATURE,
                "num_predict": settings.LLM_MAX_TOKENS,
            }
        }

        async with httpx.AsyncClient(timeout=httpx.Timeout(self.timeout, connect=2.0)) as client:
            response = await client.post(url, json=payload)
            if response.status_code != 200:
                raise Exception(f"Ollama API returned status {response.status_code}: {response.text}")
            
            data = response.json()
            msg_obj = data.get("message", {})
            content = msg_obj.get("content", "")
            if content:
                return content
            
            if "response" in data:
                return data["response"]
            
            raise Exception("No text content returned from Ollama API")


    async def _call_gemini(self, messages: List[Dict[str, str]], system_prompt: str) -> str:
        """
        Calls Google Gemini 1.5 Flash via REST API endpoint.
        """
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}"
        
        # Format Gemini contents
        contents = []
        for msg in messages:
            role = "user" if msg["role"] == "user" else "model"
            contents.append({
                "role": role,
                "parts": [{"text": msg["content"]}]
            })

        payload = {
            "contents": contents,
            "systemInstruction": {
                "parts": [{"text": system_prompt}]
            },
            "generationConfig": {
                "temperature": settings.LLM_TEMPERATURE,
                "maxOutputTokens": settings.LLM_MAX_TOKENS,
            }
        }

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(url, json=payload)
            if response.status_code != 200:
                raise Exception(f"Gemini API returned status {response.status_code}: {response.text}")
            
            data = response.json()
            candidates = data.get("candidates", [])
            if candidates and "content" in candidates[0]:
                parts = candidates[0]["content"].get("parts", [])
                if parts and "text" in parts[0]:
                    return parts[0]["text"]
            
            raise Exception("No text candidates returned from Gemini API")

    async def _call_openai_compatible(self, messages: List[Dict[str, str]], system_prompt: str) -> str:
        """
        Calls OpenAI, Groq, or OpenRouter compatible completions endpoint.
        """
        base_url = "https://api.openai.com/v1/chat/completions"
        if "groq" in self.provider:
            base_url = "https://api.groq.com/openai/v1/chat/completions"
        elif "openrouter" in self.provider:
            base_url = "https://openrouter.ai/api/v1/chat/completions"

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        full_messages = [{"role": "system", "content": system_prompt}]
        for msg in messages:
            full_messages.append({"role": msg["role"], "content": msg["content"]})

        payload = {
            "model": self.model if self.model != "gemini-1.5-flash" else "gpt-4o-mini",
            "messages": full_messages,
            "temperature": settings.LLM_TEMPERATURE,
            "max_tokens": settings.LLM_MAX_TOKENS,
        }

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(base_url, json=payload, headers=headers)
            if response.status_code != 200:
                raise Exception(f"OpenAI compatible API returned {response.status_code}: {response.text}")
            
            data = response.json()
            choices = data.get("choices", [])
            if choices and "message" in choices[0]:
                return choices[0]["message"].get("content", "")
            
            raise Exception("Invalid choice format from OpenAI compatible provider")

    def _generate_fallback_response(
        self,
        messages: List[Dict[str, str]],
        language: str = "en",
        error_context: Optional[str] = None
    ) -> str:
        """
        Transparent offline/fallback message indicating AI service status in the user's language.
        """
        service_msg = f" (Ollama / {self.model})" if self.provider == "ollama" else ""
        
        if language == "hi":
            return (
                f"⚠️ **AI सलाहकार सेवा वर्तमान में ऑफ़लाइन है**{service_msg}\n\n"
                "स्थानीय AI मॉडल से संपर्क नहीं हो पा रहा है। कृपया सुनिश्चित करें कि Ollama सेवा सक्रिय है (`ollama run qwen3:4b`).\n\n"
                "फसल सुरक्षा अथवा त्वरित आपातकालीन सहायता के लिए आप अपने स्थानीय **कृषि विज्ञान केंद्र (KVK)** या किसान कॉल सेंटर (1800-180-1551) से संपर्क कर सकते हैं।"
            )
        elif language == "te":
            return (
                f"⚠️ **AI సేవ ప్రస్తుతం అందుబాటులో లేదు**{service_msg}\n\n"
                "స్థానిక AI మోడల్‌తో కనెక్ట్ కాలేకపోతున్నాము. దయచేసి Ollama సర్వర్ రన్ అవుతోందో లేదో నిర్ధారించుకోండి (`ollama run qwen3:4b`).\n\n"
                "అత్యవసర వ్యవసాయ సలహాల కోసం మీ స్థానిక **రైతు భరోసా కేంద్రం (RBK)** లేదా కిసాన్ కాల్ సెంటర్ (1800-180-1551) ను సంప్రదించండి."
            )
        elif language == "mr":
            return (
                f"⚠️ **AI सल्लागार सेवा सध्या ऑफलाइन आहे**{service_msg}\n\n"
                "स्थानिक AI मॉडेलशी संपर्क होऊ शकत नाही. कृपया Ollama सुरू असल्याची खात्री करा (`ollama run qwen3:4b`).\n\n"
                "तातडीच्या शेती सल्ल्यासाठी कृपया स्थानिक **कृषी विज्ञान केंद्र (KVK)** किंवा किसान कॉल सेंटर (1800-180-1551) शी संपर्क साधावा."
            )
        elif language == "ta":
            return (
                f"⚠️ **AI சேவை தற்போது கிடைக்கவில்லை**{service_msg}\n\n"
                "உள்ளூர் AI மாதிரியுடன் இணைக்க முடியவில்லை. Ollama இயங்குகிறதா என்பதை உறுதிப்படுத்தவும் (`ollama run qwen3:4b`).\n\n"
                "அவசர விவசாய ஆலோசனைகளுக்கு உங்கள் உள்ளூர் வேளாண் அறிவியல் மையத்தை (KVK) தொடர்பு கொள்ளவும்."
            )
        elif language == "kn":
            return (
                f"⚠️ **AI ಸೇವೆ ಪ್ರಸ್ತುತ ಲಭ್ಯವಿಲ್ಲ**{service_msg}\n\n"
                "ಸ್ಥಳೀಯ AI ಮಾದರಿಯೊಂದಿಗೆ ಸಂಪರ್ಕ ಸಾಧಿಸಲು ಸಾಧ್ಯವಾಗುತ್ತಿಲ್ಲ. ದಯವಿಟ್ಟು Ollama ಚಾಲನೆಯಲ್ಲಿದೆಯೇ ಎಂದು ಪರಿಶೀಲಿಸಿ (`ollama run qwen3:4b`).\n\n"
                "ತುರ್ತು ಕೃಷಿ ಸಲಹೆಗಾಗಿ ಸ್ಥಳೀಯ ಕೃಷಿ ವಿಜ್ಞಾನ ಕೇಂದ್ರವನ್ನು (KVK) ಸಂಪರ್ಕಿಸಿ."
            )
        elif language == "bn":
            return (
                f"⚠️ **AI উপদেষ্টা পরিষেবা বর্তমানে অফলাইনে রয়েছে**{service_msg}\n\n"
                "স্থানীয় AI মডেলের সাথে সংযোগ করা যাচ্ছে না। অনুগ্রহ করে নিশ্চিত করুন যে Ollama চলছে (`ollama run qwen3:4b`)।\n\n"
                "জরুরী কৃষি নির্দেশিকার জন্য স্থানীয় কৃষি বিজ্ঞান কেন্দ্রের (KVK) সাথে যোগাযোগ করুন।"
            )
        elif language == "ml":
            return (
                f"⚠️ **AI സേവനം ഇപ്പോൾ ലഭ്യമല്ല**{service_msg}\n\n"
                "പ്രാദേശിക AI മോഡലിലേക്ക് കണക്റ്റുചെയ്യാനാകുന്നില്ല. Ollama പ്രവർത്തിക്കുന്നുണ്ടെന്ന് ഉറപ്പാക്കുക (`ollama run qwen3:4b`).\n\n"
                "അടിയന്തര കാർഷിക മാർഗ്ഗനിർദ്ദേശങ്ങൾക്ക് പ്രാദേശിക കൃഷി വിജ്ഞാന കേന്ദ്രവുമായി (KVK) ബന്ധപ്പെടുക."
            )

        return (
            f"⚠️ **AI Advisory Service is Temporarily Unavailable**{service_msg}\n\n"
            "Unable to connect to the local LLM inference engine. Please ensure that Ollama is running (`ollama run qwen3:4b`) at http://localhost:11434.\n\n"
            "For urgent agricultural field queries, you can also consult your local Krishi Vigyan Kendra (KVK) or the Kisan Call Centre (1800-180-1551)."
        )

    def detect_language(self, text: str) -> str:
        """
        Lightweight script/character detection for Indian languages.
        """
        for char in text:
            code = ord(char)
            if 0x0900 <= code <= 0x097F:  # Devanagari (Hindi / Marathi)
                return "hi"
            elif 0x0C00 <= code <= 0x0C7F:  # Telugu
                return "te"
            elif 0x0B80 <= code <= 0x0BFF:  # Tamil
                return "ta"
            elif 0x0C80 <= code <= 0x0CFF:  # Kannada
                return "kn"
            elif 0x0980 <= code <= 0x09FF:  # Bengali
                return "bn"
            elif 0x0D00 <= code <= 0x0D7F:  # Malayalam
                return "ml"
        return "en"


llm_service = LLMService()
