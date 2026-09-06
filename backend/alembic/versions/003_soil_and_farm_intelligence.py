"""Add soil profiles and farm intelligence schema

Revision ID: 003_soil_and_farm_intelligence
Revises: 002_crop_images_and_analysis
Create Date: 2026-09-06 21:45:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '003_soil_and_farm_intelligence'
down_revision: Union[str, None] = '002_crop_images_and_analysis'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'soil_profiles',
        sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
        sa.Column('farmer_id', sa.Integer(), sa.ForeignKey('farmers.id', ondelete='CASCADE'), nullable=False, unique=True),
        sa.Column('soil_type', sa.String(length=100), server_default='Black', nullable=True),
        sa.Column('ph', sa.Float(), nullable=True),
        sa.Column('nitrogen', sa.Float(), nullable=True),
        sa.Column('phosphorus', sa.Float(), nullable=True),
        sa.Column('potassium', sa.Float(), nullable=True),
        sa.Column('organic_carbon', sa.Float(), nullable=True),
        sa.Column('moisture', sa.Float(), nullable=True),
        sa.Column('source', sa.String(length=100), server_default='Self Reported', nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
    )
    op.create_index(op.f('ix_soil_profiles_id'), 'soil_profiles', ['id'], unique=False)
    op.create_index(op.f('ix_soil_profiles_farmer_id'), 'soil_profiles', ['farmer_id'], unique=True)


def downgrade() -> None:
    op.drop_index(op.f('ix_soil_profiles_farmer_id'), table_name='soil_profiles')
    op.drop_index(op.f('ix_soil_profiles_id'), table_name='soil_profiles')
    op.drop_table('soil_profiles')
