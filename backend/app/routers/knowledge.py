from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.connection import get_db
from app.database.models import KnowledgeDocument, KnowledgeChunk
from app.schemas.knowledge import (
    KnowledgeDocumentResponse,
    KnowledgeChunkResponse,
    KnowledgeSearchRequest,
    KnowledgeSearchResponse,
    KnowledgeSearchResultItem,
    KnowledgeCategoryEnum,
)
from app.services.retrieval_service import retrieval_service
from app.services.knowledge_service import knowledge_service

router = APIRouter(prefix="/knowledge", tags=["Verified Agricultural Knowledge (RAG)"])


@router.post("/search", response_model=KnowledgeSearchResponse)
@router.get("/search", response_model=KnowledgeSearchResponse)
async def search_knowledge(
    q: Optional[str] = Query(None, description="Search query text"),
    query: Optional[str] = Query(None, description="Search query text alias"),
    crop: Optional[str] = Query(None, description="Filter by crop name"),
    category: Optional[str] = Query(None, description="Filter by category"),
    language: Optional[str] = Query("en", description="Language code"),
    top_k: Optional[int] = Query(4, ge=1, le=10, description="Max results"),
    min_similarity: Optional[float] = Query(0.60, ge=0.0, le=1.0, description="Minimum cosine similarity threshold"),
    db: Session = Depends(get_db)
):
    """
    Search verified agricultural knowledge chunks using semantic embedding similarity and metadata filters.
    """
    search_query = (q or query or "").strip()
    if not search_query:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Search query 'q' cannot be empty."
        )

    results = await retrieval_service.retrieve_relevant_chunks(
        db=db,
        query=search_query,
        crop=crop,
        category=category,
        language=language or "en",
        top_k=top_k or 4,
        min_similarity=min_similarity or 0.60
    )

    items = [
        KnowledgeSearchResultItem(
            chunk_id=r["chunk_id"],
            document_id=r["document_id"],
            document_title=r["document_title"],
            source_name=r["source_name"],
            authority=r["authority"],
            source_url=r.get("source_url"),
            category=r.get("category", "CROP_PRACTICES"),
            crop=r.get("crop"),
            region=r.get("region"),
            content=r["content"],
            similarity_score=r["similarity_score"],
            last_verified_at=r.get("last_verified_at")
        )
        for r in results
    ]

    return KnowledgeSearchResponse(
        query=search_query,
        total_results=len(items),
        results=items
    )


@router.get("/documents", response_model=List[KnowledgeDocumentResponse])
def list_knowledge_documents(
    crop: Optional[str] = Query(None, description="Filter by crop"),
    category: Optional[str] = Query(None, description="Filter by category"),
    authority: Optional[str] = Query(None, description="Filter by authority"),
    is_active: bool = Query(True, description="Filter active documents"),
    db: Session = Depends(get_db)
):
    """
    List all authoritative agricultural documents with verified metadata and chunk counts.
    """
    query = db.query(KnowledgeDocument)
    if is_active:
        query = query.filter(KnowledgeDocument.is_active == True)
    if crop:
        query = query.filter(KnowledgeDocument.crop.ilike(f"%{crop}%"))
    if category:
        query = query.filter(KnowledgeDocument.category == category)
    if authority:
        query = query.filter(KnowledgeDocument.authority.ilike(f"%{authority}%"))

    docs = query.order_by(KnowledgeDocument.id.asc()).all()

    # Pre-fetch chunk counts
    doc_ids = [d.id for d in docs]
    counts_map = {}
    if doc_ids:
        chunk_counts = (
            db.query(KnowledgeChunk.document_id, func.count(KnowledgeChunk.id))
            .filter(KnowledgeChunk.document_id.in_(doc_ids))
            .group_by(KnowledgeChunk.document_id)
            .all()
        )
        counts_map = {row[0]: row[1] for row in chunk_counts}

    resp = []
    for d in docs:
        doc_resp = KnowledgeDocumentResponse.model_validate(d)
        doc_resp.total_chunks = counts_map.get(d.id, 0)
        resp.append(doc_resp)

    return resp


@router.get("/documents/{document_id}", response_model=KnowledgeDocumentResponse)
def get_knowledge_document_detail(
    document_id: int,
    db: Session = Depends(get_db)
):
    """
    Get detailed document information including all verified chunks.
    """
    doc = db.query(KnowledgeDocument).filter(KnowledgeDocument.id == document_id).first()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Knowledge document {document_id} not found."
        )

    chunks = (
        db.query(KnowledgeChunk)
        .filter(KnowledgeChunk.document_id == doc.id)
        .order_by(KnowledgeChunk.chunk_index.asc())
        .all()
    )

    doc_resp = KnowledgeDocumentResponse.model_validate(doc)
    doc_resp.total_chunks = len(chunks)
    doc_resp.chunks = [KnowledgeChunkResponse.model_validate(c) for c in chunks]
    return doc_resp


@router.get("/categories")
def get_knowledge_categories():
    """
    List all supported agricultural knowledge categories and descriptions.
    """
    return [
        {"code": cat.value, "label": cat.name.replace("_", " ").title()}
        for cat in KnowledgeCategoryEnum
    ]


@router.get("/crops")
def get_knowledge_crops(db: Session = Depends(get_db)):
    """
    List distinct crops that have verified agricultural knowledge available.
    """
    crops = (
        db.query(KnowledgeDocument.crop)
        .filter(KnowledgeDocument.crop.isnot(None), KnowledgeDocument.is_active == True)
        .distinct()
        .all()
    )
    return [c[0] for c in crops if c[0]]


@router.post("/seed")
async def seed_knowledge_base(
    force: bool = Query(False, description="Force re-seed all knowledge docs"),
    db: Session = Depends(get_db)
):
    """
    Ingests and embeds curated ICAR, SAU, IMD, and Government agricultural advisories into the knowledge base.
    """
    stats = await knowledge_service.seed_knowledge_base(db, force=force)
    return {
        "status": "success",
        "message": f"Seeded {stats['documents_created']} documents and {stats['chunks_created']} chunks ({stats['documents_skipped']} skipped).",
        "stats": stats
    }
