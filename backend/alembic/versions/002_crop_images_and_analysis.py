"""Add conversations, chat messages, crop images and image analysis models

Revision ID: 002_crop_images_and_analysis
Revises: 001_initial_schema
Create Date: 2026-09-06 18:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '002_crop_images_and_analysis'
down_revision: Union[str, None] = '001_initial_schema'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. conversations
    op.create_table(
        'conversations',
        sa.Column('id', sa.String(length=50), nullable=False, primary_key=True),
        sa.Column('farmer_id', sa.Integer(), sa.ForeignKey('farmers.id', ondelete='CASCADE'), nullable=True),
        sa.Column('title', sa.String(length=255), server_default='New Farming Advisory', nullable=True),
        sa.Column('language', sa.String(length=10), server_default='en', nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
    )
    op.create_index('ix_conversations_id', 'conversations', ['id'])

    # 2. crop_images
    op.create_table(
        'crop_images',
        sa.Column('id', sa.String(length=50), nullable=False, primary_key=True),
        sa.Column('farmer_id', sa.Integer(), sa.ForeignKey('farmers.id', ondelete='CASCADE'), nullable=True),
        sa.Column('crop_id', sa.Integer(), sa.ForeignKey('crops.id', ondelete='SET NULL'), nullable=True),
        sa.Column('conversation_id', sa.String(length=50), sa.ForeignKey('conversations.id', ondelete='SET NULL'), nullable=True),
        sa.Column('image_url', sa.String(length=500), nullable=False),
        sa.Column('cloudinary_public_id', sa.String(length=255), nullable=True),
        sa.Column('original_filename', sa.String(length=255), nullable=True),
        sa.Column('mime_type', sa.String(length=50), nullable=False),
        sa.Column('file_size', sa.Integer(), nullable=True),
        sa.Column('width', sa.Integer(), nullable=True),
        sa.Column('height', sa.Integer(), nullable=True),
        sa.Column('uploaded_at', sa.DateTime(), nullable=True),
    )
    op.create_index('ix_crop_images_id', 'crop_images', ['id'])
    op.create_index('ix_crop_images_farmer_id', 'crop_images', ['farmer_id'])
    op.create_index('ix_crop_images_crop_id', 'crop_images', ['crop_id'])
    op.create_index('ix_crop_images_conversation_id', 'crop_images', ['conversation_id'])

    # 3. chat_messages
    op.create_table(
        'chat_messages',
        sa.Column('id', sa.Integer(), nullable=False, primary_key=True, autoincrement=True),
        sa.Column('conversation_id', sa.String(length=50), sa.ForeignKey('conversations.id', ondelete='CASCADE'), nullable=False),
        sa.Column('role', sa.String(length=20), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('image_url', sa.String(length=500), nullable=True),
        sa.Column('image_id', sa.String(length=50), sa.ForeignKey('crop_images.id', ondelete='SET NULL'), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
    )
    op.create_index('ix_chat_messages_id', 'chat_messages', ['id'])
    op.create_index('ix_chat_messages_conversation_id', 'chat_messages', ['conversation_id'])

    # 4. image_analyses
    op.create_table(
        'image_analyses',
        sa.Column('id', sa.Integer(), nullable=False, primary_key=True, autoincrement=True),
        sa.Column('image_id', sa.String(length=50), sa.ForeignKey('crop_images.id', ondelete='CASCADE'), nullable=False),
        sa.Column('detected_crop', sa.String(length=100), nullable=True),
        sa.Column('image_quality', sa.String(length=20), server_default='good', nullable=True),
        sa.Column('observed_symptoms', sa.JSON(), nullable=True),
        sa.Column('possible_issues', sa.JSON(), nullable=True),
        sa.Column('confidence', sa.Float(), nullable=True),
        sa.Column('analysis_text', sa.Text(), nullable=True),
        sa.Column('recommendations', sa.JSON(), nullable=True),
        sa.Column('model_name', sa.String(length=100), server_default='gemini-1.5-flash', nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
    )
    op.create_index('ix_image_analyses_id', 'image_analyses', ['id'])
    op.create_index('ix_image_analyses_image_id', 'image_analyses', ['image_id'])


def downgrade() -> None:
    op.drop_index('ix_image_analyses_image_id', table_name='image_analyses')
    op.drop_index('ix_image_analyses_id', table_name='image_analyses')
    op.drop_table('image_analyses')

    op.drop_index('ix_chat_messages_conversation_id', table_name='chat_messages')
    op.drop_index('ix_chat_messages_id', table_name='chat_messages')
    op.drop_table('chat_messages')

    op.drop_index('ix_crop_images_conversation_id', table_name='crop_images')
    op.drop_index('ix_crop_images_crop_id', table_name='crop_images')
    op.drop_index('ix_crop_images_farmer_id', table_name='crop_images')
    op.drop_index('ix_crop_images_id', table_name='crop_images')
    op.drop_table('crop_images')

    op.drop_index('ix_conversations_id', table_name='conversations')
    op.drop_table('conversations')
