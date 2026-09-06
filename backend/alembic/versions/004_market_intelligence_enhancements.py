"""Enhance market_prices table with modal, min, max prices, arrivals, and source

Revision ID: 004_market_intel
Revises: 003_soil_and_farm_intelligence
Create Date: 2026-09-06 21:58:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '004_market_intel'
down_revision: Union[str, None] = '003_soil_and_farm_intelligence'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Check and add columns safely if they don't exist yet
    bind = op.get_bind()
    insp = sa.inspect(bind)
    existing_cols = [c['name'] for c in insp.get_columns('market_prices')]

    if 'min_price' not in existing_cols:
        op.add_column('market_prices', sa.Column('min_price', sa.Float(), nullable=True))
    if 'max_price' not in existing_cols:
        op.add_column('market_prices', sa.Column('max_price', sa.Float(), nullable=True))
    if 'modal_price' not in existing_cols:
        op.add_column('market_prices', sa.Column('modal_price', sa.Float(), nullable=True))
    if 'arrival_quantity' not in existing_cols:
        op.add_column('market_prices', sa.Column('arrival_quantity', sa.Float(), nullable=True))
    if 'source' not in existing_cols:
        op.add_column('market_prices', sa.Column('source', sa.String(length=100), server_default='APMC Mandi Bulletin', nullable=True))


def downgrade() -> None:
    op.drop_column('market_prices', 'source')
    op.drop_column('market_prices', 'arrival_quantity')
    op.drop_column('market_prices', 'modal_price')
    op.drop_column('market_prices', 'max_price')
    op.drop_column('market_prices', 'min_price')
