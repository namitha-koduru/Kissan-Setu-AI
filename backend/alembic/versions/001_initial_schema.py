"""Initial migration for KissanSetuAI database schema

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-09-06 16:15:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Farmers
    op.create_table(
        'farmers',
        sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('phone', sa.String(length=50), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=True),
        sa.Column('hashed_password', sa.String(length=255), nullable=True),
        sa.Column('preferred_language', sa.String(length=10), server_default='en', nullable=True),
        sa.Column('state', sa.String(length=100), server_default='Maharashtra', nullable=True),
        sa.Column('district', sa.String(length=100), server_default='Nashik', nullable=True),
        sa.Column('village', sa.String(length=100), nullable=True),
        sa.Column('latitude', sa.Float(), nullable=True),
        sa.Column('longitude', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
    )
    op.create_index('ix_farmers_id', 'farmers', ['id'])
    op.create_index('ix_farmers_phone', 'farmers', ['phone'], unique=True)
    op.create_index('ix_farmers_email', 'farmers', ['email'], unique=True)

    # 2. Crops
    op.create_table(
        'crops',
        sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
        sa.Column('farmer_id', sa.Integer(), sa.ForeignKey('farmers.id', ondelete='CASCADE'), nullable=False),
        sa.Column('crop_name', sa.String(length=100), nullable=False),
        sa.Column('variety', sa.String(length=100), nullable=True),
        sa.Column('acreage', sa.Float(), nullable=True),
        sa.Column('quantity', sa.Float(), nullable=False),
        sa.Column('sowing_date', sa.String(length=50), nullable=True),
        sa.Column('expected_harvest_date', sa.String(length=50), nullable=True),
        sa.Column('growth_stage', sa.String(length=100), nullable=True),
        sa.Column('soil_type', sa.String(length=100), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
    )
    op.create_index('ix_crops_id', 'crops', ['id'])
    op.create_index('ix_crops_crop_name', 'crops', ['crop_name'])

    # 3. Markets
    op.create_table(
        'markets',
        sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('district', sa.String(length=100), nullable=False),
        sa.Column('state', sa.String(length=100), server_default='Maharashtra', nullable=True),
        sa.Column('latitude', sa.Float(), nullable=True),
        sa.Column('longitude', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
    )
    op.create_index('ix_markets_id', 'markets', ['id'])
    op.create_index('ix_markets_name', 'markets', ['name'])

    # 4. Market Prices
    op.create_table(
        'market_prices',
        sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
        sa.Column('market_id', sa.Integer(), sa.ForeignKey('markets.id', ondelete='CASCADE'), nullable=False),
        sa.Column('crop_name', sa.String(length=100), nullable=False),
        sa.Column('price', sa.Float(), nullable=False),
        sa.Column('unit', sa.String(length=20), server_default='kg', nullable=True),
        sa.Column('date', sa.String(length=50), nullable=False),
    )
    op.create_index('ix_market_prices_id', 'market_prices', ['id'])
    op.create_index('ix_market_prices_crop_name', 'market_prices', ['crop_name'])

    # 5. Buyers
    op.create_table(
        'buyers',
        sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('organization', sa.String(length=255), nullable=True),
        sa.Column('location', sa.String(length=255), nullable=False),
        sa.Column('phone', sa.String(length=50), nullable=True),
        sa.Column('email', sa.String(length=255), nullable=True),
        sa.Column('verified', sa.Boolean(), server_default=sa.text('false'), nullable=True),
        sa.Column('rating', sa.Float(), server_default='4.5', nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
    )
    op.create_index('ix_buyers_id', 'buyers', ['id'])
    op.create_index('ix_buyers_name', 'buyers', ['name'])

    # 6. Lots
    op.create_table(
        'lots',
        sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
        sa.Column('farmer_id', sa.Integer(), sa.ForeignKey('farmers.id', ondelete='CASCADE'), nullable=False),
        sa.Column('crop_id', sa.Integer(), sa.ForeignKey('crops.id', ondelete='CASCADE'), nullable=False),
        sa.Column('buyer_id', sa.Integer(), sa.ForeignKey('buyers.id', ondelete='SET NULL'), nullable=True),
        sa.Column('quantity', sa.Float(), nullable=False),
        sa.Column('asking_price', sa.Float(), nullable=False),
        sa.Column('quality', sa.String(length=50), server_default='Grade A', nullable=True),
        sa.Column('harvest_date', sa.String(length=50), nullable=True),
        sa.Column('location', sa.String(length=255), nullable=True),
        sa.Column('status', sa.String(length=50), server_default='Open for Offers', nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
    )
    op.create_index('ix_lots_id', 'lots', ['id'])

    # 7. Offers
    op.create_table(
        'offers',
        sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
        sa.Column('lot_id', sa.Integer(), sa.ForeignKey('lots.id', ondelete='CASCADE'), nullable=False),
        sa.Column('buyer_id', sa.Integer(), sa.ForeignKey('buyers.id', ondelete='CASCADE'), nullable=False),
        sa.Column('offered_price', sa.Float(), nullable=False),
        sa.Column('status', sa.String(length=50), server_default='Pending', nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
    )
    op.create_index('ix_offers_id', 'offers', ['id'])

    # 8. Transactions
    op.create_table(
        'transactions',
        sa.Column('id', sa.Integer(), nullable=False, primary_key=True),
        sa.Column('lot_id', sa.Integer(), sa.ForeignKey('lots.id', ondelete='CASCADE'), unique=True, nullable=False),
        sa.Column('final_price', sa.Float(), nullable=False),
        sa.Column('status', sa.String(length=50), server_default='Offer Accepted', nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
    )
    op.create_index('ix_transactions_id', 'transactions', ['id'])


def downgrade() -> None:
    op.drop_table('transactions')
    op.drop_table('offers')
    op.drop_table('lots')
    op.drop_table('buyers')
    op.drop_table('market_prices')
    op.drop_table('markets')
    op.drop_table('crops')
    op.drop_table('farmers')
