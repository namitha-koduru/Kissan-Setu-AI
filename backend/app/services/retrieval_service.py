import math
import logging
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.database.models import KnowledgeDocument, KnowledgeChunk
from app.services.embedding_service import embedding_service
from app.config import settings

logger = logging.getLogger("retrieval_service")


def compute_cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
    """Compute cosine similarity between two float vectors."""
    if not vec_a or not vec_b:
        return 0.0
    dot = sum(a * b for a, b in zip(vec_a, vec_b))
    norm_a = math.sqrt(sum(a * a for a in vec_a))
    norm_b = math.sqrt(sum(b * b for b in vec_b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


class RetrievalService:
    """Semantic Retrieval Engine with Metadata Filtering and Authority Weighting."""

    async def retrieve_relevant_chunks(
        self,
        db: Session,
        query: str,
        crop: Optional[str] = None,
        category: Optional[str] = None,
        language: Optional[str] = "en",
        top_k: Optional[int] = None,
        min_similarity: Optional[float] = None
    ) -> List[Dict[str, Any]]:
        if not query or not query.strip():
            return []

        k = top_k or settings.RAG_TOP_K
        threshold = min_similarity if min_similarity is not None else settings.RAG_MIN_SIMILARITY

        # 1. Generate Query Vector Embedding
        query_vector = await embedding_service.embed_query(query)

        # 2. Query Candidate Chunks from Database with Active Document Join
        q = (
            db.query(KnowledgeChunk, KnowledgeDocument)
            .join(KnowledgeDocument, KnowledgeChunk.document_id == KnowledgeDocument.id)
            .filter(KnowledgeDocument.is_active == True)
        )

        if crop and crop != "General" and crop != "All":
            q = q.filter((KnowledgeChunk.crop == crop) | (KnowledgeChunk.crop == "General") | (KnowledgeChunk.crop == None))

        if category:
            q = q.filter(KnowledgeChunk.category == category)

        candidate_records = q.all()

        if not candidate_records:
            # Fallback to all active chunks if crop filter had 0 records
            candidate_records = (
                db.query(KnowledgeChunk, KnowledgeDocument)
                .join(KnowledgeDocument, KnowledgeChunk.document_id == KnowledgeDocument.id)
                .filter(KnowledgeDocument.is_active == True)
                .all()
            )

        scored_results = []
        for chunk, doc in candidate_records:
            chunk_embedding = chunk.embedding
            if not chunk_embedding:
                # Generate on-the-fly if missing
                chunk_embedding = await embedding_service.embed_query(f"{doc.title} [{chunk.crop}]: {chunk.content}")
                chunk.embedding = chunk_embedding
                db.commit()


            base_sim = compute_cosine_similarity(query_vector, chunk_embedding)

            # 3. Apply Authority Weighting
            # Verified ICAR / Agricultural University gets a +0.05 authority boost
            authority_boost = 0.05 if doc.source_type in ["ICAR", "AGRICULTURAL_UNIVERSITY", "IMD"] else 0.0
            final_score = min(1.0, base_sim + authority_boost)

            # Filter by minimum similarity threshold
            if final_score >= threshold:
                scored_results.append({
                    "chunk_id": chunk.id,
                    "document_id": doc.id,
                    "chunk_index": chunk.chunk_index,
                    "content": chunk.content,
                    "similarity_score": round(final_score, 4),
                    "document_title": doc.title,
                    "source_name": doc.source_name,
                    "source_type": doc.source_type,
                    "source_url": doc.source_url,
                    "authority": doc.authority,
                    "category": chunk.category,
                    "crop": chunk.crop,
                    "language": chunk.language,
                    "published_date": doc.published_date,
                    "last_verified_at": doc.last_verified_at,
                })

        # Sort descending by similarity score
        scored_results.sort(key=lambda x: x["similarity_score"], reverse=True)
        return scored_results[:k]


retrieval_service = RetrievalService()
