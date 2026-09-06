"""Create knowledge_documents and knowledge_chunks tables for RAG

Revision ID: 006_verified_knowledge_rag
Revises: 005_buyer_transac
Create Date: 2026-09-06 22:42:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '006_verified_knowledge_rag'
down_revision: Union[str, None] = '005_buyer_transac'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)

    # 1. Create knowledge_documents table if not exists
    if not insp.has_table("knowledge_documents"):
        op.create_table(
            "knowledge_documents",
            sa.Column("id", sa.Integer(), primary_key=True, index=True),
            sa.Column("title", sa.String(255), nullable=False, index=True),
            sa.Column("description", sa.Text(), nullable=True),
            sa.Column("source_name", sa.String(255), nullable=False),
            sa.Column("source_type", sa.String(50), nullable=False, index=True),
            sa.Column("source_url", sa.String(500), nullable=True),
            sa.Column("authority", sa.String(100), default="National Agricultural Research"),
            sa.Column("language", sa.String(10), default="en", index=True),
            sa.Column("category", sa.String(50), nullable=False, index=True),
            sa.Column("crop", sa.String(100), nullable=True, index=True),
            sa.Column("region", sa.String(100), default="Maharashtra", index=True),
            sa.Column("published_date", sa.String(50), nullable=True),
            sa.Column("last_verified_at", sa.String(50), nullable=True),
            sa.Column("content_hash", sa.String(64), nullable=True),
            sa.Column("is_active", sa.Boolean(), default=True, index=True),
            sa.Column("created_at", sa.DateTime(), default=sa.func.now()),
            sa.Column("updated_at", sa.DateTime(), default=sa.func.now(), onupdate=sa.func.now()),
        )

    # 2. Create knowledge_chunks table if not exists
    if not insp.has_table("knowledge_chunks"):
        op.create_table(
            "knowledge_chunks",
            sa.Column("id", sa.Integer(), primary_key=True, index=True),
            sa.Column("document_id", sa.Integer(), sa.ForeignKey("knowledge_documents.id", ondelete="CASCADE"), nullable=False, index=True),
            sa.Column("chunk_index", sa.Integer(), default=0),
            sa.Column("content", sa.Text(), nullable=False),
            sa.Column("language", sa.String(10), default="en", index=True),
            sa.Column("category", sa.String(50), nullable=False, index=True),
            sa.Column("crop", sa.String(100), nullable=True, index=True),
            sa.Column("region", sa.String(100), default="Maharashtra"),
            sa.Column("embedding", postgresql.JSONB(astext_type=sa.Text()) if bind.dialect.name == "postgresql" else sa.JSON(), nullable=True),
            sa.Column("metadata_json", postgresql.JSONB(astext_type=sa.Text()) if bind.dialect.name == "postgresql" else sa.JSON(), nullable=True),
            sa.Column("created_at", sa.DateTime(), default=sa.func.now()),
        )


def downgrade() -> None:
    op.drop_table("knowledge_chunks")
    op.drop_table("knowledge_documents")
