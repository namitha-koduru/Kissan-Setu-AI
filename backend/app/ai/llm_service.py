"""
LLM Provider Abstraction and Service for KissanSetuAI Farmer Assistant.
Supports Google Gemini, OpenAI-compatible APIs (OpenAI/Groq/OpenRouter), and an Intelligent Fallback Dev Assistant.
"""

import json
import logging
from typing import List, Dict, Any, Optional
import httpx
from app.config import settings

logger = logging.getLogger("kissansetu.ai")


class LLMService:
    def __init__(self):
        self.provider = (settings.LLM_PROVIDER or "mock").lower()
        self.api_key = settings.LLM_API_KEY
        self.model = settings.LLM_MODEL or "gemini-1.5-flash"
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
        # If no valid API key is present or provider is 'mock', use Intelligent Agronomic Fallback Engine
        if not self.api_key or self.provider == "mock":
            return self._generate_fallback_response(messages, language)

        try:
            if self.provider in ["gemini", "google"]:
                return await self._call_gemini(messages, system_prompt)
            elif self.provider in ["openai", "groq", "openrouter"]:
                return await self._call_openai_compatible(messages, system_prompt)
            else:
                logger.warning(f"Unknown LLM provider '{self.provider}', using fallback assistant.")
                return self._generate_fallback_response(messages, language)
        except Exception as exc:
            logger.error(f"LLM Provider call failed ({exc}). Gracefully falling back to dev agronomic engine.")
            return self._generate_fallback_response(messages, language, error_context=str(exc))

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
        Intelligent context-aware fallback assistant that parses user queries (irrigation, weather, harvest, pests, mandi)
        and responds in the farmer's selected language.
        """
        last_message = messages[-1]["content"].lower() if messages else ""

        # Language specific templates
        if language == "hi":
            if "water" in last_message or "सिंचाई" in last_message or "irrigation" in last_message:
                return (
                    "🌾 **सिंचाई सलाह (Tomato & General Crops):**\n\n"
                    "1. **मिट्टी की नमी:** ड्रिप सिंचाई द्वारा सुबह के समय 1.5–2 घंटे पानी देना सबसे उत्तम है।\n"
                    "2. **मौसम पूर्वानुमान:** यदि अगले 48 घंटों में बारिश की संभावना हो, तो सिंचाई 1–2 दिन के लिए टाल दें ताकि जलभराव से जड़ सड़न न हो।\n"
                    "3. **फल पकने की अवस्था:** अत्यधिक पानी से टमाटर फटने (cracking) का खतरा रहता है, इसलिए नियमित और नियंत्रित नमी बनाए रखें।"
                )
            elif "harvest" in last_message or "कटाई" in last_message or "मंडी" in last_message:
                return (
                    "🚜 **फसल कटाई एवं मंडी सलाह:**\n\n"
                    "1. **तुड़ाई का सही समय:** टमाटर जब 70-80% लाल (Breaker to Turning stage) हों, तब सुबह 7 से 10 बजे के बीच तुड़ाई करें।\n"
                    "2. **मंडी चयन:** नासिक और लासलगांव मंडियों में इस समय थोक मांग अच्छी है। पास के संग्रह केंद्र पर ले जाने से परिवहन खर्च कम होगा।"
                )
            elif "pest" in last_message or "कीट" in last_message or "रोग" in last_message:
                return (
                    "🌿 **कीट एवं रोग नियंत्रण मार्गदर्शिका:**\n\n"
                    "1. **प्रारंभिक लक्षण:** पत्तियों पर धब्बे या सिकुड़न फंगल इन्फेक्शन या थ्रिप्स/सफेद मक्खी का संकेत हो सकते हैं।\n"
                    "2. **जैविक उपचार:** 5 मिली नीम तेल प्रति लीटर पानी में मिलाकर शाम के समय छिड़काव करें।\n"
                    "3. **सलाह:** सटीक निदान के लिए स्थानीय कृषि विज्ञान केंद्र (KVK) से संपर्क करें।"
                )
            else:
                return (
                    "नमस्ते किसान भाई! मैं **किसान सेतु AI** सहायक हूँ।\n\n"
                    "आप अपनी फसल की सिंचाई, मौसम जोखिम, मंडी भाव, खाद प्रबंधन अथवा कीट नियंत्रण के बारे में कोई भी प्रश्न पूछ सकते हैं।"
                )

        elif language == "mr":
            if "water" in last_message or "पाणी" in last_message or "सिंचन" in last_message or "irrigation" in last_message:
                return (
                    "🌾 **पाणी व्यवस्थापन व सिंचन सल्ला:**\n\n"
                    "1. **ठिबक सिंचन:** टोमॅटो पिकास सकाळी लवकर 1 ते 2 तास ठिबक सिंचनाने पाणी द्यावे.\n"
                    "2. **हवामान अंदाज:** नाशिक परिसरात पुढील 2 दिवसांत पावसाची शक्यता असल्यास पाणी देणे थांबवावे.\n"
                    "3. **फळ तडकणे टाळा:** काढणीच्या काळात जास्त पाणी दिल्यास फळे तडकण्याची शक्यता असते."
                )
            elif "harvest" in last_message or "काढणी" in last_message or "मंडी" in last_message:
                return (
                    "🚜 **काढणी व बाजारपेठ सल्ला:**\n\n"
                    "1. टोमॅटोची काढणी फळे 70-80% लाल रंगावर असताना (ब्रेकर स्टेज) करावी.\n"
                    "2. नाशिक व पिंपळगाव कृषी उत्पन्न बाजार समितीत (APMC) सध्या चांगला भाव मिळत आहे."
                )
            else:
                return (
                    "नमस्कार शेतकरी बंधूंनो! मी **किसान सेतू AI** शेती सल्लागार आहे.\n\n"
                    "आपण पीक नियोजन, खत व्यवस्थापन, हवामान अंदाज आणि बाजारभावाबाबत माहिती विचारू शकता."
                )

        elif language == "te":
            if "water" in last_message or "నీరు" in last_message or "irrigation" in last_message:
                return (
                    "🌾 **నీటి యాజమాన్యం మరియు సూచనలు:**\n\n"
                    "1. **బిందు సేద్యం (Drip):** ఉదయం పూట 1.5 నుండి 2 గంటల పాటు డ్రిప్ ద్వారా నీటిని అందించడం ఉత్తమం.\n"
                    "2. **వాతావరణం:** రాబోయే 48 గంటల్లో వర్ష సూచన ఉంటే నీరు పెట్టడం వాయిదా వేయండి.\n"
                    "3. **పండ్ల నాణ్యత:** అధిక తేమ వల్ల కాయలు పగిలిపోయే ప్రమాదం ఉంది, కాబట్టి సమతుల్య తేమను కొనసాగించండి."
                )
            else:
                return (
                    "నమస్కారం రైతు సోదరులారా! నేను మీ **కిసాన్ సేతు AI** వ్యవసాయ సహాయకుడిని.\n\n"
                    "మీ పంట సాగు, నీటి పారుదల, మార్కెట్ ధరలు మరియు వాతావరణ సమాచారం గురించి ఏవైనా ప్రశ్నలు అడగవచ్చు."
                )

        # Default English response
        if "water" in last_message or "irrigate" in last_message or "irrigation" in last_message:
            return (
                "💧 **Irrigation Advisory (Tomato & Field Crops):**\n\n"
                "1. **Moisture Timing:** Irrigate during the early morning hours (6:00 AM – 8:30 AM) via drip irrigation for 1.5 to 2 hours.\n"
                "2. **Weather Alignment:** Given the forecast showing increased rain probability in 48 hours, consider reducing scheduled irrigation volume by 30-40% to prevent root saturation and fungal development.\n"
                "3. **Fruit Ripening Stage:** If your tomatoes are in the 70–80% color-turning stage, maintain consistent, moderate moisture to avoid fruit cracking."
            )
        elif "harvest" in last_message or "cut" in last_message or "market" in last_message:
            return (
                "🚜 **Harvest & Mandi Timing Guidance:**\n\n"
                "1. **Optimal Maturity Window:** Harvest tomatoes at the 'Breaker to Turning' stage (pinkish-red bottom) for optimal transit shelf-life.\n"
                "2. **Market Realization:** Local wholesale demand at Nashik APMC is currently strong. Direct transport to collection hubs will yield higher net realization after accounting for freight deductions.\n"
                "3. **Rain Precaution:** Completing harvest before heavy shower periods protects skin firmness and Grade A classification."
            )
        elif "pest" in last_message or "leaf" in last_message or "disease" in last_message or "spot" in last_message:
            return (
                "🌿 **Foliar Health & Pest Assessment:**\n\n"
                "1. **Observation:** Yellowing leaf margins or small dark spots commonly suggest early blight or sucking pest pressure (such as thrips or whiteflies).\n"
                "2. **Safe First Step:** Apply 5 ml cold-pressed Neem oil (10,000 ppm) per liter of water during the late afternoon.\n"
                "3. **Expert Verification:** Because visual verification is critical, consult your local Krishi Vigyan Kendra (KVK) or extension officer with a physical leaf sample."
            )
        elif "rain" in last_message or "weather" in last_message:
            return (
                "🌦️ **Weather Impact Analysis:**\n\n"
                "1. **Forecast Check:** Precipitation probability increases across the region in 2–3 days.\n"
                "2. **Field Actions:** Clear field drainage furrows to avoid waterlogging around roots.\n"
                "3. **Fertilizer Spraying:** Avoid foliar spraying within 4 hours of expected rain."
            )
        else:
            return (
                "Hello Farmer! I am your **KissanSetuAI Agricultural Assistant**.\n\n"
                "I am ready to help you with:\n"
                "• **Irrigation & Soil Moisture** schedules\n"
                "• **Harvest Timing** based on crop maturity & rain forecasts\n"
                "• **Mandi Price Discovery** and net realization calculation\n"
                "• **Safe Organic Pest & Disease Management**\n\n"
                "Feel free to ask a question in English, Hindi, Telugu, Marathi, Tamil, or your preferred language!"
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
