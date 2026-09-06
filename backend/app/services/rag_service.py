import re
import logging
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from app.services.retrieval_service import retrieval_service
from app.schemas.chat import ChatSourceItem
from app.config import settings

logger = logging.getLogger("rag_service")


class RAGService:
    """RAG Intent Decision Layer, Knowledge Retrieval, and Prompt Context Builder."""

    KNOWLEDGE_INTENT_KEYWORDS = [
        # Disease & Pest
        "blight", "disease", "spot", "yellow", "wilt", "curl", "fungal", "pest", "thrips", "aphid",
        "virus", "rot", "neem", "spray", "pesticide", "insect", "leaf", "symptom", "cure", "treatment",
        "रोग", "बीमारी", "झुलसा", "कीट", "स्प्रे", "उपचार", "नीम", "धब्बा", "पीला", "मुडदा",
        "తెగులు", "పురుగు", "మచ్చ", "ఆకు", "నివారణ", "మందు", "స్ప్రింగ్", "పసుపు",
        "रोग", "कीड", "पाणी", "औषध", "फवारणी", "करपा", "डाग", "पिवळे",
        # Agronomy & Practices
        "irrigate", "irrigation", "water", "drip", "moisture", "ph", "carbon", "fertilizer", "npk", "urea", "dap",
        "soil", "manure", "compost", "sowing", "pruning", "staking", "spacing", "variety",
        "सिंचाई", "उर्वरक", "खाद", "मिट्टी", "कटाई", "रोपण",
        "నీరు", "ఎరువు", "నేల", "సాగు",
        "पाणी", "खत", "माती", "लागवड",
        # Post-Harvest & Storage
        "storage", "store", "curing", "chawl", "shelf", "post-harvest", "sprout", "rotting",
        "भंडारण", "स्टोरेज", "रखरखाव", "चाळ",
        "నిల్వ", "కోత",
        "साठवणूक", "चाळ",
        # General Inquiries
        "how to", "what is", "why", "cause", "prevent", "manage", "practice", "guideline",
        "कैसे", "क्या", "क्यों", "उपाय",
        "ఎలా", "ఏమిటి", "ఎందుకు",
        "कसे", "काय", "का",
    ]

    REALTIME_TRANSACTIONAL_PATTERNS = [
        r"today'?s\s+price",
        r"mandi\s+price\s+today",
        r"current\s+rate",
        r"rate\s+per\s+kg",
        r"what\s+price\s+did\s+buyer",
        r"payment\s+status",
        r"delivery\s+status",
        r"track\s+order",
        r"buyer\s+offer",
        r"आज\s+का\s+भाव",
        r"आजचा\s+दर",
        r"ఈరోజు\s+ధర",
    ]

    def should_use_rag(self, query: str, has_image: bool = False) -> bool:
        """
        Lightweight decision layer determining if authoritative agricultural knowledge
        retrieval is beneficial for the user's query.
        """
        if not settings.RAG_ENABLED:
            return False

        if has_image:
            # Always retrieve verified knowledge to ground visual leaf observations
            return True

        q_lower = query.lower().strip()

        # Check if query contains agricultural knowledge concepts
        has_knowledge_intent = any(kw in q_lower for kw in self.KNOWLEDGE_INTENT_KEYWORDS)

        # Check if query is strictly asking for today's price or transaction status
        is_pure_live_data = any(re.search(pat, q_lower) for pat in self.REALTIME_TRANSACTIONAL_PATTERNS)

        # If it asks general knowledge, use RAG. If pure live transaction/price only, defer to structured data.
        if is_pure_live_data and not any(kw in q_lower for kw in ["how to", "why", "storage", "blight", "disease", "soil"]):
            return False

        return has_knowledge_intent

    async def get_grounded_context(
        self,
        db: Session,
        query: str,
        crop_hint: Optional[str] = None,
        language: str = "en",
        has_image: bool = False
    ) -> Tuple[str, List[ChatSourceItem]]:
        """
        Retrieves relevant verified agricultural research and formats grounded context
        plus structured source citations.
        """
        if not self.should_use_rag(query, has_image=has_image):
            return "", []

        try:
            chunks = await retrieval_service.retrieve_relevant_chunks(
                db=db,
                query=query,
                crop=crop_hint,
                language=language,
                top_k=settings.RAG_TOP_K,
                min_similarity=settings.RAG_MIN_SIMILARITY
            )
        except Exception as e:
            logger.warning(f"RAG retrieval error: {e}. Continuing with normal context...")
            return "", []

        if not chunks:
            return "", []

        # 1. Format Grounded Knowledge Text for LLM System Prompt
        context_lines = [
            "VERIFIED AGRICULTURAL KNOWLEDGE & RESEARCH EVIDENCE (TRUSTED SOURCES):",
            "The following verified agronomic research guidance was retrieved from official sources (ICAR, SAU, IMD, Government Depts).",
            "Base your factual agricultural recommendations strictly on this evidence where applicable:\n"
        ]

        sources_list: List[ChatSourceItem] = []
        seen_titles = set()

        for idx, c in enumerate(chunks, start=1):
            context_lines.append(
                f"[Source {idx}: {c['document_title']} ({c['source_name']} | Authority: {c['authority']})]"
            )
            context_lines.append(f"{c['content']}\n")

            if c["document_title"] not in seen_titles:
                seen_titles.add(c["document_title"])
                sources_list.append(ChatSourceItem(
                    title=c["document_title"],
                    source_name=c["source_name"],
                    authority=c["authority"],
                    url=c.get("source_url"),
                    category=c.get("category", "CROP_PRACTICES"),
                    crop=c.get("crop"),
                    last_verified_at=c.get("last_verified_at") or "2026",
                    confidence_score=c.get("similarity_score")
                ))

        grounded_text = "\n".join(context_lines)
        return grounded_text, sources_list


rag_service = RAGService()
